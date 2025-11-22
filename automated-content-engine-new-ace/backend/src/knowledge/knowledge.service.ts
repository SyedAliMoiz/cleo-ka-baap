import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  KnowledgeFile,
  KnowledgeFileDocument,
} from './schemas/knowledge-file.schema';
import { IngestionService } from '../rag/services/ingestion.service';

@Injectable()
export class KnowledgeService {
  constructor(
    @InjectModel(KnowledgeFile.name)
    private fileModel: Model<KnowledgeFileDocument>,
    private ingestionService: IngestionService,
  ) {}

  async ingestTxt(
    moduleSlug: string,
    file: Express.Multer.File,
  ): Promise<{
    fileId: string;
    wordCount: number;
    chunksCreated?: number;
    embeddingTokens?: number;
  }> {
    const text = file.buffer.toString('utf8');
    const wordCount = text.split(/\s+/).length;

    const created = await this.fileModel.create({
      moduleSlug,
      filename: file.originalname,
      text,
      size: file.size,
      mimeType: file.mimetype,
    });

    const fileId = (created._id as any).toString();

    console.log(
      `📁 Ingested file: ${file.originalname} (${wordCount} words) for module: ${moduleSlug}`,
    );

    try {
      const ingestionResult = await this.ingestionService.ingestDocument(
        moduleSlug,
        fileId,
        file.originalname,
        text,
      );

      console.log(
        `🔗 RAG indexing complete: ${ingestionResult.chunksCreated} chunks created, ${ingestionResult.embeddingTokens} embedding tokens`,
      );

      return {
        fileId,
        wordCount,
        chunksCreated: ingestionResult.chunksCreated,
        embeddingTokens: ingestionResult.embeddingTokens,
      };
    } catch (error) {
      console.error('❌ RAG ingestion failed:', error);
      return { fileId, wordCount };
    }
  }

  async getFilesByModule(moduleSlug: string): Promise<KnowledgeFile[]> {
    return this.fileModel.find({ moduleSlug }).sort({ createdAt: -1 }).exec();
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = await this.fileModel.findById(fileId);
    if (!file) {
      throw new NotFoundException('File not found');
    }

    try {
      await this.ingestionService.deleteFileChunks(file.moduleSlug, fileId);
      console.log(
        `🗑️  Deleted RAG chunks for file: ${file.filename} from module: ${file.moduleSlug}`,
      );
    } catch (error) {
      console.error('❌ Failed to delete RAG chunks:', error);
    }

    await this.fileModel.findByIdAndDelete(fileId);

    console.log(
      `🗑️  Deleted file: ${file.filename} from module: ${file.moduleSlug}`,
    );
  }

  async getFileById(fileId: string): Promise<KnowledgeFile> {
    const file = await this.fileModel.findById(fileId).lean();
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file as unknown as KnowledgeFile;
  }

  async getFileStats(moduleSlug: string): Promise<{
    fileCount: number;
    totalWords: number;
    totalSize: number;
  }> {
    const files = await this.fileModel.find({ moduleSlug });
    const totalWords = files.reduce((sum, file) => {
      return sum + (file.text ? file.text.split(/\s+/).length : 0);
    }, 0);

    return {
      fileCount: files.length,
      totalWords,
      totalSize: files.reduce((sum, file) => sum + (file.size || 0), 0),
    };
  }

  async getAllKnowledgeForModule(moduleSlug: string): Promise<string> {
    const files = await this.fileModel.find({ moduleSlug }).lean();

    if (files.length === 0) {
      console.log(`📚 No knowledge files found for module: ${moduleSlug}`);
      return '';
    }

    console.log(
      `📚 Found ${files.length} knowledge files for module: ${moduleSlug}`,
    );

    const knowledgeParts: string[] = [];
    let totalChars = 0;
    const maxChars = 50000;

    for (const file of files) {
      const content = `${file.text}\n\n`;

      if (totalChars + content.length > maxChars) {
        const remainingChars = maxChars - totalChars - 10;
        if (remainingChars > 100) {
          const truncatedContent = `${file.text.substring(0, remainingChars)}...\n\n`;
          knowledgeParts.push(truncatedContent);
        }
        break;
      }

      knowledgeParts.push(content);
      totalChars += content.length;
    }

    const knowledge = knowledgeParts.join('');
    console.log(
      `📝 Compiled knowledge: ${knowledge.length} characters from ${knowledgeParts.length} files`,
    );

    return knowledge;
  }
}
