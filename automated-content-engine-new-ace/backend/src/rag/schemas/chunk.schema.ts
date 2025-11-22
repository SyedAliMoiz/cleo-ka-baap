import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChunkDocument = Chunk & Document;

@Schema({ timestamps: true })
export class Chunk {
  @Prop({ required: true })
  moduleSlug: string;

  @Prop({ required: true })
  fileId: string;

  @Prop({ required: true })
  filename: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  chunkIndex: number;

  @Prop({ required: true })
  vectorId: string;

  @Prop()
  tokens: number;

  @Prop()
  domain?: string;

  @Prop()
  personaRole?: string;

  @Prop()
  subtopic?: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const ChunkSchema = SchemaFactory.createForClass(Chunk);
