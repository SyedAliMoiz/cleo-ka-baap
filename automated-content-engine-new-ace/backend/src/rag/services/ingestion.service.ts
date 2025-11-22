import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Chunk, ChunkDocument } from '../schemas/chunk.schema';
import { ChunkingService } from './chunking.service';
import { EmbeddingService } from './embedding.service';
import { VectorStoreService } from './vector-store.service';

export interface IngestionResult {
  fileId: string;
  chunksCreated: number;
  totalTokens: number;
  embeddingTokens: number;
  vectorsStored: number;
}

@Injectable()
export class IngestionService {
  constructor(
    @InjectModel(Chunk.name)
    private chunkModel: Model<ChunkDocument>,
    private chunkingService: ChunkingService,
    private embeddingService: EmbeddingService,
    private vectorStoreService: VectorStoreService,
  ) {}

  async ingestDocument(
    moduleSlug: string,
    fileId: string,
    filename: string,
    text: string,
  ): Promise<IngestionResult> {
    console.log(
      `📥 Starting ingestion for file: ${filename} (${text.length} chars)`,
    );

    const textChunks = this.chunkingService.chunk(text, {
      maxTokens: 400,
      overlapTokens: 80,
      minTokens: 50,
    });

    if (textChunks.length === 0) {
      console.warn(`⚠️  No chunks created for file: ${filename}`);
      return {
        fileId,
        chunksCreated: 0,
        totalTokens: 0,
        embeddingTokens: 0,
        vectorsStored: 0,
      };
    }

    console.log(`✂️  Created ${textChunks.length} chunks`);

    const chunkTexts = textChunks.map((c) => c.text);
    const embeddings = await this.embeddingService.embedBatch(chunkTexts);

    const chunkDocs: any[] = [];
    const vectorPoints: any[] = [];

    for (let i = 0; i < textChunks.length; i++) {
      const chunk = textChunks[i];
      const vectorId = uuidv4();

      const chunkDoc = {
        moduleSlug,
        fileId,
        filename,
        text: chunk.text,
        chunkIndex: i,
        tokens: chunk.tokens,
        vectorId,
      };

      chunkDocs.push(chunkDoc);

      vectorPoints.push({
        id: vectorId,
        vector: embeddings[i],
        payload: {
          text: chunk.text,
          moduleSlug,
          fileId,
          filename,
          chunkIndex: i,
        },
      });
    }

    const savedChunks = await this.chunkModel.insertMany(chunkDocs);
    console.log(`💾 Stored ${savedChunks.length} chunk records in MongoDB`);

    await this.vectorStoreService.upsertBatch(vectorPoints);
    console.log(`🔗 Stored ${vectorPoints.length} vectors in Qdrant`);

    const totalTokens = textChunks.reduce((sum, c) => sum + c.tokens, 0);
    const embeddingTokens = Math.ceil(totalTokens * 1.3);

    console.log(
      `✅ Ingestion complete: ${savedChunks.length} chunks, ${totalTokens} tokens`,
    );

    return {
      fileId,
      chunksCreated: savedChunks.length,
      totalTokens,
      embeddingTokens,
      vectorsStored: vectorPoints.length,
    };
  }

  async deleteFileChunks(moduleSlug: string, fileId: string): Promise<void> {
    console.log(`🗑️  Deleting chunks for file: ${fileId}`);

    const chunks = await this.chunkModel.find({ fileId }).lean();
    const vectorIds = chunks.map((chunk) => chunk.vectorId);

    const result = await this.chunkModel.deleteMany({ fileId });
    console.log(`💾 Deleted ${result.deletedCount} chunk records from MongoDB`);

    if (vectorIds.length > 0) {
      await this.vectorStoreService.delete(vectorIds);
      console.log(`🔗 Deleted ${vectorIds.length} vectors from Qdrant`);
    }
  }

  async deleteModuleChunks(moduleSlug: string): Promise<void> {
    console.log(`🗑️  Deleting all chunks for module: ${moduleSlug}`);

    const result = await this.chunkModel.deleteMany({ moduleSlug });
    console.log(`💾 Deleted ${result.deletedCount} chunk records from MongoDB`);

    await this.vectorStoreService.deleteByFilter({ moduleSlug });
    console.log(`🔗 Deleted vectors from Qdrant for module: ${moduleSlug}`);
  }

  async reindexModule(
    moduleSlug: string,
    files: Array<{ id: string; filename: string; text: string }>,
  ): Promise<{
    filesProcessed: number;
    totalChunks: number;
    totalTokens: number;
  }> {
    console.log(`🔄 Re-indexing module: ${moduleSlug} (${files.length} files)`);

    await this.deleteModuleChunks(moduleSlug);

    let totalChunks = 0;
    let totalTokens = 0;

    for (const file of files) {
      const result = await this.ingestDocument(
        moduleSlug,
        file.id,
        file.filename,
        file.text,
      );
      totalChunks += result.chunksCreated;
      totalTokens += result.totalTokens;
    }

    console.log(
      `✅ Re-indexing complete: ${files.length} files, ${totalChunks} chunks, ${totalTokens} tokens`,
    );

    return {
      filesProcessed: files.length,
      totalChunks,
      totalTokens,
    };
  }

  async getIngestionStats(moduleSlug: string): Promise<{
    totalChunks: number;
    totalFiles: number;
    totalTokens: number;
    vectorCount: number;
  }> {
    const chunks = await this.chunkModel.find({ moduleSlug }).lean();
    const uniqueFiles = new Set(chunks.map((c) => c.fileId));
    const totalTokens = chunks.reduce((sum, c) => sum + (c.tokens || 0), 0);
    const vectorCount = await this.vectorStoreService.count({ moduleSlug });

    return {
      totalChunks: chunks.length,
      totalFiles: uniqueFiles.size,
      totalTokens,
      vectorCount,
    };
  }
}
