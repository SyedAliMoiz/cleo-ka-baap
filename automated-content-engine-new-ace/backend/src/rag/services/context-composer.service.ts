import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { RetrievalResult } from './retrieval.service';

export interface CompositionOptions {
  maxTokens?: number;
  includeSource?: boolean;
  deduplication?: boolean;
  template?: 'default' | 'detailed' | 'minimal';
}

export interface ComposedContext {
  context: string;
  chunksUsed: number;
  totalTokens: number;
  sources: string[];
}

interface ScoredChunk {
  text: string;
  score: number;
  filename: string;
  fileId: string;
  chunkIndex: number;
  fingerprint?: string;
}

@Injectable()
export class ContextComposerService {
  compose(
    retrievalResult: RetrievalResult,
    options: CompositionOptions = {},
  ): ComposedContext {
    const maxTokens = options.maxTokens ?? 8000;
    const includeSource = options.includeSource ?? true;
    const deduplication = options.deduplication ?? true;
    const template = options.template ?? 'default';

    if (retrievalResult.chunks.length === 0) {
      return {
        context: '',
        chunksUsed: 0,
        totalTokens: 0,
        sources: [],
      };
    }

    let chunks = retrievalResult.chunks.map((c) => ({
      text: c.text,
      score: c.score,
      filename: c.filename,
      fileId: c.fileId,
      chunkIndex: c.chunkIndex,
    }));

    if (deduplication) {
      chunks = this.deduplicateChunks(chunks);
    }

    const selectedChunks = this.fitChunksToLimit(chunks, maxTokens);

    let formattedContext = '';
    if (template === 'detailed') {
      formattedContext = this.formatDetailed(selectedChunks, includeSource);
    } else if (template === 'minimal') {
      formattedContext = this.formatMinimal(selectedChunks);
    } else {
      formattedContext = this.formatDefault(selectedChunks, includeSource);
    }

    const sources = [...new Set(selectedChunks.map((c) => c.filename))];
    const totalTokens = this.estimateTokens(formattedContext);

    return {
      context: formattedContext,
      chunksUsed: selectedChunks.length,
      totalTokens,
      sources,
    };
  }

  private deduplicateChunks(chunks: ScoredChunk[]): ScoredChunk[] {
    const seen = new Set<string>();
    const deduplicated: ScoredChunk[] = [];

    for (const chunk of chunks) {
      const fingerprint = this.computeFingerprint(chunk.text);

      if (!seen.has(fingerprint)) {
        seen.add(fingerprint);
        deduplicated.push({ ...chunk, fingerprint });
      }
    }

    return deduplicated;
  }

  private computeFingerprint(text: string): string {
    const start = text.slice(0, 120);
    const end = text.slice(-120);
    const fingerprint = createHash('md5')
      .update(start + end)
      .digest('hex');
    return fingerprint;
  }

  private fitChunksToLimit(
    chunks: ScoredChunk[],
    maxTokens: number,
  ): ScoredChunk[] {
    const formattingOverhead = 400;
    const availableTokens = maxTokens - formattingOverhead;

    const sortedByScore = [...chunks].sort((a, b) => b.score - a.score);

    const selected: ScoredChunk[] = [];
    let currentTokens = 0;

    for (const chunk of sortedByScore) {
      const chunkTokens = this.estimateTokens(chunk.text);

      if (currentTokens + chunkTokens <= availableTokens) {
        selected.push(chunk);
        currentTokens += chunkTokens;
      } else {
        break;
      }
    }

    selected.sort((a, b) => b.score - a.score);

    return selected;
  }

  private formatDefault(chunks: ScoredChunk[], includeSource: boolean): string {
    const grounding = `You MUST ground every factual claim in the following reference material unless explicitly stated otherwise. If a claim is not covered here, clearly state that you're using general knowledge.`;

    const parts = chunks.map((chunk) => {
      const source = includeSource ? `[Source: ${chunk.filename}]\n` : '';
      return `${source}${chunk.text}`;
    });

    return `${grounding}\n\n${parts.join('\n\n---\n\n')}`;
  }

  private formatDetailed(
    chunks: ScoredChunk[],
    includeSource: boolean,
  ): string {
    const grounding = `You MUST ground every factual claim in the following reference material unless explicitly stated otherwise. If a claim is not covered here, clearly state that you're using general knowledge.`;

    const parts = chunks.map((chunk, idx) => {
      const header = includeSource
        ? `### Reference ${idx + 1} [${chunk.filename}]`
        : `### Reference ${idx + 1}`;
      return `${header}\n${chunk.text}`;
    });

    return `${grounding}\n\n${parts.join('\n\n')}`;
  }

  private formatMinimal(chunks: ScoredChunk[]): string {
    return chunks.map((c) => c.text).join('\n\n');
  }

  createSystemMessage(
    baseSystemPrompt: string,
    composedContext: ComposedContext,
  ): string {
    if (!baseSystemPrompt) {
      return '';
    }

    if (composedContext.chunksUsed === 0) {
      return baseSystemPrompt;
    }

    return baseSystemPrompt;
  }

  buildAssistantContextMessage(context: string): string {
    return `REFERENCE CONTEXT\n\n${context}`;
  }

  estimateConversationTokens(
    system: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): number {
    const systemTokens = this.estimateTokens(system);
    const messageTokens = messages.reduce(
      (sum, msg) => sum + this.estimateTokens(msg.content),
      0,
    );
    return systemTokens + messageTokens;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  trimMessagesToLimit(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    maxPairs: number = 8,
  ): Array<{ role: 'user' | 'assistant'; content: string }> {
    if (messages.length === 0) return [];

    const pairs: Array<Array<{ role: 'user' | 'assistant'; content: string }>> =
      [];

    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === 'user') {
        const userMsg = messages[i];
        const assistantMsg = i + 1 < messages.length ? messages[i + 1] : null;

        if (assistantMsg && assistantMsg.role === 'assistant') {
          pairs.push([userMsg, assistantMsg]);
          i++;
        } else {
          pairs.push([userMsg]);
        }
      }
    }

    const trimmedPairs = pairs.slice(-maxPairs);
    return trimmedPairs.flat();
  }

  ensureTokenSafety(
    system: string,
    contextTokens: number,
    conversationTokens: number,
    expectedReplyTokens: number = 4000,
  ): { safe: boolean; totalEstimate: number; limit: number } {
    const limit = 190000;
    const totalEstimate =
      this.estimateTokens(system) +
      contextTokens +
      conversationTokens +
      expectedReplyTokens;

    return {
      safe: totalEstimate < limit,
      totalEstimate,
      limit,
    };
  }
}
