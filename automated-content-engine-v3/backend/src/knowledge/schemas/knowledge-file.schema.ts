import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KnowledgeFileDocument = KnowledgeFile & Document;

@Schema({ timestamps: true })
export class KnowledgeFile {
  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ required: true })
  size: number;

  @Prop()
  description: string; // Optional description from Admin

  @Prop()
  extractedText: string; // The raw text content extracted from the file

  // Future: @Prop() embedding: number[];
}

export const KnowledgeFileSchema = SchemaFactory.createForClass(KnowledgeFile);
