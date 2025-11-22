import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ModuleDocument = Module & Document;

@Schema({ timestamps: true })
export class Module {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  tier: string;

  @Prop({ required: true })
  coverImage: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  systemPrompt?: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ default: 0 })
  position: number;

  @Prop({ default: false })
  isRecommended: boolean;

  @Prop()
  emptyStateText?: string;

  @Prop({ default: 0.7 })
  temperature?: number;
}

export const ModuleSchema = SchemaFactory.createForClass(Module);
