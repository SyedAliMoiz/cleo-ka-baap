import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { KnowledgeFile, KnowledgeFileDocument } from './schemas/knowledge-file.schema';
import * as fs from 'fs';

@Injectable()
export class KnowledgeService {
  constructor(@InjectModel(KnowledgeFile.name) private knowledgeFileModel: Model<KnowledgeFileDocument>) {}

  async create(file: Express.Multer.File, description?: string): Promise<KnowledgeFile> {
    // In a real app, we would use OCR/Text Extraction lib here (e.g., pdf-parse)
    // For now, we assume simple text files or just store the metadata + path

    let extractedText = "";
    if (file.mimetype === 'text/plain') {
        extractedText = fs.readFileSync(file.path, 'utf8');
    }

    const createdFile = new this.knowledgeFileModel({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      description,
      extractedText
    });
    return createdFile.save();
  }

  async findAll(): Promise<KnowledgeFile[]> {
    return this.knowledgeFileModel.find().exec();
  }

  async delete(id: string): Promise<any> {
    const file = await this.knowledgeFileModel.findById(id);
    if (file) {
        try {
            fs.unlinkSync(`./uploads/${file.filename}`);
        } catch (e) {
            console.error("Failed to delete file from disk", e);
        }
        return this.knowledgeFileModel.findByIdAndDelete(id).exec();
    }
    return null;
  }
}
