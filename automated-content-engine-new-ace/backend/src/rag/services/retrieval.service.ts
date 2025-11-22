import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService, VectorSearchResult } from './vector-store.service';

export interface RetrievalOptions {
  topK?: number;
  scoreThreshold?: number;
  rerank?: boolean;
  rerankTopK?: number;
  filter?: {
    fileId?: string;
    domain?: string;
  };
}

export interface RetrievalResult {
  chunks: Array<{
    text: string;
    score: number;
    filename: string;
    fileId: string;
    chunkIndex: number;
    metadata?: {
      domain?: string;
      personaRole?: string;
      subtopic?: string;
    };
  }>;
  totalRetrieved: number;
  query: string;
}

@Injectable()
export class RetrievalService {
  private readonly anthropic: Anthropic;

  constructor(
    private embeddingService: EmbeddingService,
    private vectorStore: VectorStoreService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = new Anthropic({ apiKey });
  }

  async retrieve(
    moduleSlug: string,
    query: string,
    options: RetrievalOptions = {},
  ): Promise<RetrievalResult> {
    const topK = options.topK ?? 10;
    const scoreThreshold = options.scoreThreshold ?? 0.0;
    const rerank = options.rerank ?? false;
    const rerankTopK = options.rerankTopK ?? topK;

    const expandedQuery = this.expandQuery(query, moduleSlug);

    const queryVector = await this.embeddingService.embedQuery(expandedQuery);

    const initialResults = await this.vectorStore.search(queryVector, {
      topK: rerank ? Math.min(topK * 3, 30) : topK,
      scoreThreshold: scoreThreshold * 0.8,
      filter: {
        moduleSlug,
        ...options.filter,
      },
    });

    let finalResults = initialResults;

    if (rerank && initialResults.length > topK) {
      console.log(`🔄 Reranking ${initialResults.length} candidates with LLM`);
      finalResults = await this.llmRerank(query, initialResults, rerankTopK);
    }

    const chunks = finalResults.slice(0, topK).map((result) => ({
      text: result.payload.text,
      score: result.score,
      filename: result.payload.filename,
      fileId: result.payload.fileId,
      chunkIndex: result.payload.chunkIndex,
      metadata: {
        domain: result.payload.domain,
        personaRole: result.payload.personaRole,
        subtopic: result.payload.subtopic,
      },
    }));

    return {
      chunks,
      totalRetrieved: initialResults.length,
      query,
    };
  }

  private expandQuery(query: string, moduleSlug: string): string {
    const intentHint = this.moduleIntentHints(moduleSlug);
    const expanded = `${query}\n${intentHint} professional tone actionable practical`;
    return expanded.trim();
  }

  private moduleIntentHints(slug: string): string {
    const hints: Record<string, string> = {
      'linkedin-post': 'LinkedIn post writing professional B2B content',
      'twitter-thread': 'Twitter thread writing engaging social media',
      'x-thread': 'X thread writing engaging social media',
      'blog-post': 'blog article writing informative content',
      'email-campaign': 'email marketing professional communication',
      'content-strategy': 'content strategy planning marketing',
    };

    return hints[slug] || '';
  }

  private async llmRerank(
    query: string,
    candidates: VectorSearchResult[],
    topK: number,
  ): Promise<VectorSearchResult[]> {
    const maxCandidates = Math.min(candidates.length, 12);
    const candidatesToRerank = candidates.slice(0, maxCandidates);

    const prompt = this.buildRerankPrompt(query, candidatesToRerank);

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 2000,
        temperature: 0,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from reranking');
      }

      const scores = this.parseRerankScores(content.text);

      const reranked = candidatesToRerank.map((candidate, idx) => ({
        ...candidate,
        score: scores[idx] ?? candidate.score * 0.5,
      }));

      reranked.sort((a, b) => b.score - a.score);

      const remaining = candidates.slice(maxCandidates);
      return [...reranked.slice(0, topK), ...remaining];
    } catch (error) {
      console.error('❌ LLM reranking failed, using original scores:', error);
      return candidates;
    }
  }

  private buildRerankPrompt(
    query: string,
    candidates: VectorSearchResult[],
  ): string {
    const candidateTexts = candidates
      .map((c, idx) => {
        const truncated =
          c.payload.text.length > 900
            ? c.payload.text.substring(0, 900) + '...'
            : c.payload.text;
        return `[${idx}] ${truncated}`;
      })
      .join('\n\n');

    return `You are a relevance scoring expert. Given a user query and a list of text chunks, score each chunk's relevance to answering the query.

Query: "${query}"

Chunks:
${candidateTexts}

Return ONLY a JSON array of scores (0.0 to 1.0) for each chunk in order, like: [0.95, 0.82, 0.65, ...]
Higher scores mean more relevant. Consider:
- Direct answer potential
- Topic alignment
- Specificity
- Usefulness for the query

JSON array:`;
  }

  private parseRerankScores(text: string): number[] {
    try {
      const match = text.match(/\[[\d\s,.]+\]/);
      if (!match) {
        throw new Error('No JSON array found in response');
      }
      const scores = JSON.parse(match[0]);
      if (!Array.isArray(scores)) {
        throw new Error('Parsed result is not an array');
      }
      return scores.map((s) => (typeof s === 'number' ? s : 0.5));
    } catch (error) {
      console.error('❌ Failed to parse rerank scores:', error);
      return [];
    }
  }

  async similaritySearch(
    moduleSlug: string,
    text: string,
    topK: number = 5,
  ): Promise<VectorSearchResult[]> {
    const vector = await this.embeddingService.embed(text);
    return this.vectorStore.search(vector, {
      topK,
      filter: { moduleSlug },
    });
  }

  async getChunksByFileId(
    moduleSlug: string,
    fileId: string,
  ): Promise<VectorSearchResult[]> {
    const dummyVector = new Array(this.embeddingService.getDimensions()).fill(
      0,
    );
    return this.vectorStore.search(dummyVector, {
      topK: 1000,
      scoreThreshold: 0,
      filter: { moduleSlug, fileId },
    });
  }

  async deleteFileChunks(moduleSlug: string, fileId: string): Promise<void> {
    await this.vectorStore.deleteByFilter({ moduleSlug, fileId });
  }

  async getModuleChunkCount(moduleSlug: string): Promise<number> {
    return await this.vectorStore.count({ moduleSlug });
  }

  async getFileChunkCount(moduleSlug: string, fileId: string): Promise<number> {
    return await this.vectorStore.count({ moduleSlug, fileId });
  }
}
