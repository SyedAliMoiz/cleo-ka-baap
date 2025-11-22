import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Chunk, ChunkSchema } from './schemas/chunk.schema';
import { ChunkingService } from './services/chunking.service';
import { EmbeddingService } from './services/embedding.service';
import { VectorStoreService } from './services/vector-store.service';
import { RetrievalService } from './services/retrieval.service';
import { ContextComposerService } from './services/context-composer.service';
import { WorkflowService } from './services/workflow.service';
import { IngestionService } from './services/ingestion.service';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([{ name: Chunk.name, schema: ChunkSchema }]),
  ],
  providers: [
    ChunkingService,
    EmbeddingService,
    VectorStoreService,
    RetrievalService,
    ContextComposerService,
    WorkflowService,
    IngestionService,
  ],
  exports: [
    ChunkingService,
    EmbeddingService,
    VectorStoreService,
    RetrievalService,
    ContextComposerService,
    WorkflowService,
    IngestionService,
  ],
})
export class RagModule {}
