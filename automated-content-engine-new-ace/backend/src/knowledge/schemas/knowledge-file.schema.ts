import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type KnowledgeFileDocument = KnowledgeFile & Document;

@Schema({ timestamps: true })
export class KnowledgeFile {
  @Prop({ required: true })
  moduleSlug: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  text: string;

  @Prop()
  size?: number;

  @Prop()
  mimeType?: string;
}

export const KnowledgeFileSchema = SchemaFactory.createForClass(KnowledgeFile);
