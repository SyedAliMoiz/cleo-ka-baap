import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ArtifactDocument = Artifact & Document;

export enum ArtifactType {
  RESEARCH = 'research',
  THREAD_DRAFT = 'thread_draft',
  THREAD_FINAL = 'thread_final',
  HOOK = 'hook',
}

@Schema({ timestamps: true })
export class Artifact {
  @Prop({ required: true })
  clientId: string;

  @Prop({ required: true, enum: ArtifactType })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string; // JSON or Text

  @Prop()
  metadata: Record<string, any>; // Extra data (module used, timestamp, etc)
}

export const ArtifactSchema = SchemaFactory.createForClass(Artifact);
