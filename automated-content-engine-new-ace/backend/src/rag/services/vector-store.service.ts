import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorSearchResult {
  id: string;
  score: number;
  payload: {
    text: string;
    moduleSlug: string;
    fileId: string;
    filename: string;
    chunkIndex: number;
    domain?: string;
    personaRole?: string;
    subtopic?: string;
    [key: string]: any;
  };
}

export interface SearchFilter {
  moduleSlug?: string;
  fileId?: string;
  domain?: string;
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private client: QdrantClient;
  private readonly collectionName = 'ace_knowledge';
  private readonly vectorSize = 1536;

  constructor(private configService: ConfigService) {
    const qdrantUrl =
      this.configService.get<string>('QDRANT_URL') || 'http://localhost:6333';
    this.client = new QdrantClient({ url: qdrantUrl });
  }

  async onModuleInit() {
    await this.ensureCollection();
  }

  private async ensureCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (col) => col.name === this.collectionName,
      );

      if (!exists) {
        console.log(`📦 Creating Qdrant collection: ${this.collectionName}`);
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
        });

        await this.client.createPayloadIndex(this.collectionName, {
          field_name: 'moduleSlug',
          field_schema: 'keyword',
        });

        await this.client.createPayloadIndex(this.collectionName, {
          field_name: 'fileId',
          field_schema: 'keyword',
        });

        console.log('✅ Qdrant collection created with indices');
      }
    } catch (error) {
      console.error('❌ Failed to ensure Qdrant collection:', error);
      throw error;
    }
  }

  async upsert(
    id: string,
    vector: number[],
    payload: {
      text: string;
      moduleSlug: string;
      fileId: string;
      filename: string;
      chunkIndex: number;
      domain?: string;
      personaRole?: string;
      subtopic?: string;
      [key: string]: any;
    },
  ): Promise<void> {
    try {
      await this.client.upsert(this.collectionName, {
        wait: true,
        points: [
          {
            id,
            vector,
            payload,
          },
        ],
      });
    } catch (error) {
      console.error('❌ Vector upsert failed:', error);
      throw error;
    }
  }

  async upsertBatch(
    points: Array<{
      id: string;
      vector: number[];
      payload: {
        text: string;
        moduleSlug: string;
        fileId: string;
        filename: string;
        chunkIndex: number;
        domain?: string;
        personaRole?: string;
        subtopic?: string;
        [key: string]: any;
      };
    }>,
  ): Promise<void> {
    if (points.length === 0) return;

    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);

      try {
        await this.client.upsert(this.collectionName, {
          wait: true,
          points: batch,
        });
      } catch (error) {
        console.error(
          `❌ Batch upsert failed for batch starting at ${i}:`,
          error,
        );
        throw error;
      }
    }
  }

  async search(
    queryVector: number[],
    options: {
      topK?: number;
      filter?: SearchFilter;
      scoreThreshold?: number;
    } = {},
  ): Promise<VectorSearchResult[]> {
    const topK = options.topK ?? 10;
    const scoreThreshold = options.scoreThreshold ?? 0.0;

    const filter = this.buildFilter(options.filter);

    try {
      const searchResult = await this.client.search(this.collectionName, {
        vector: queryVector,
        limit: topK,
        score_threshold: scoreThreshold,
        filter,
        with_payload: true,
      });

      return searchResult.map((result) => ({
        id: String(result.id),
        score: result.score,
        payload: result.payload as VectorSearchResult['payload'],
      }));
    } catch (error) {
      console.error('❌ Vector search failed:', error);
      throw error;
    }
  }

  private buildFilter(filter?: SearchFilter): any {
    if (!filter) return undefined;

    const must: any[] = [];

    if (filter.moduleSlug) {
      must.push({
        key: 'moduleSlug',
        match: { value: filter.moduleSlug },
      });
    }

    if (filter.fileId) {
      must.push({
        key: 'fileId',
        match: { value: filter.fileId },
      });
    }

    if (filter.domain) {
      must.push({
        key: 'domain',
        match: { value: filter.domain },
      });
    }

    return must.length > 0 ? { must } : undefined;
  }

  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        points: ids,
      });
      console.log(`🗑️  Deleted ${ids.length} vectors from Qdrant`);
    } catch (error) {
      console.error('❌ Vector deletion failed:', error);
      throw error;
    }
  }

  async deleteByFilter(filter: SearchFilter): Promise<void> {
    const qdrantFilter = this.buildFilter(filter);

    if (!qdrantFilter) {
      console.warn('⚠️  No filter provided for deleteByFilter');
      return;
    }

    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: qdrantFilter,
      });
      console.log(`🗑️  Deleted vectors matching filter from Qdrant`);
    } catch (error) {
      console.error('❌ Vector deletion by filter failed:', error);
      throw error;
    }
  }

  async getCollectionInfo(): Promise<any> {
    try {
      return await this.client.getCollection(this.collectionName);
    } catch (error) {
      console.error('❌ Failed to get collection info:', error);
      return null;
    }
  }

  async count(filter?: SearchFilter): Promise<number> {
    try {
      const qdrantFilter = this.buildFilter(filter);
      const result = await this.client.count(this.collectionName, {
        filter: qdrantFilter,
        exact: true,
      });
      return result.count;
    } catch (error) {
      console.error('❌ Failed to count vectors:', error);
      return 0;
    }
  }
}
