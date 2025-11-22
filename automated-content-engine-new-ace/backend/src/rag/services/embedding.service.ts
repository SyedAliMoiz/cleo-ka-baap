import Anthropic from '@anthropic-ai/sdk';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmbeddingService {
  private readonly anthropic: Anthropic;
  private readonly model = 'text-embedding-3-large';
  private readonly dimensions = 1536;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = new Anthropic({ apiKey });
  }

  private l2normalize(vector: number[]): number[] {
    const norm =
      Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map((val) => val / norm);
  }

  async embed(text: string): Promise<number[]> {
    try {
      const cleanText = text.replace(/\n/g, ' ').trim();

      if (!cleanText) {
        console.warn('⚠️  Empty text provided to embed()');
        return new Array(this.dimensions).fill(0);
      }

      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.configService.get<string>('OPENAI_API_KEY')}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: cleanText,
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Embedding API error: ${response.status} ${error}`);
      }

      const data = await response.json();
      const rawVector = data.data[0].embedding;
      return this.l2normalize(rawVector);
    } catch (error) {
      console.error('❌ Embedding generation failed:', error);
      throw error;
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const batchSize = 100;
    const batches: string[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    const allEmbeddings: number[][] = [];

    for (const batch of batches) {
      const cleanTexts = batch.map((t) => t.replace(/\n/g, ' ').trim());

      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.configService.get<string>('OPENAI_API_KEY')}`,
          },
          body: JSON.stringify({
            model: this.model,
            input: cleanTexts,
            dimensions: this.dimensions,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(
            `Batch embedding API error: ${response.status} ${error}`,
          );
        }

        const data = await response.json();
        const batchEmbeddings = data.data.map((item: any) =>
          this.l2normalize(item.embedding),
        );
        allEmbeddings.push(...batchEmbeddings);
      } catch (error) {
        console.error('❌ Batch embedding failed:', error);
        throw error;
      }
    }

    return allEmbeddings;
  }

  async embedQuery(query: string): Promise<number[]> {
    const cleanQuery = query.replace(/\n/g, ' ').trim();

    if (!cleanQuery) {
      console.warn('⚠️  Empty query provided to embedQuery()');
      return new Array(this.dimensions).fill(0);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.configService.get<string>('OPENAI_API_KEY')}`,
        },
        body: JSON.stringify({
          model: this.model,
          input: cleanQuery,
          dimensions: this.dimensions,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(
          `Query embedding API error: ${response.status} ${error}`,
        );
      }

      const data = await response.json();
      const rawVector = data.data[0].embedding;
      return this.l2normalize(rawVector);
    } catch (error) {
      console.error('❌ Query embedding failed:', error);
      throw error;
    }
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  getDimensions(): number {
    return this.dimensions;
  }
}
