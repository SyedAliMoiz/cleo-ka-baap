import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProviderDocument = Provider & Document;

export enum ProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  PERPLEXITY = 'perplexity',
  GOOGLE = 'google',
  GROK = 'grok',
}

@Schema({ timestamps: true })
export class Provider {
  @Prop({ required: true, enum: ProviderType, unique: true })
  type: string;

  @Prop({ required: true })
  apiKey: string; // In a real prod app, this should be encrypted

  @Prop()
  isActive: boolean;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);
