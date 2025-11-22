import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ModuleConfigDocument = ModuleConfig & Document;

@Schema({ timestamps: true })
export class ModuleConfig {
  @Prop({ required: true, unique: true })
  key: string; // e.g., 'topic-generator', 'deep-research', 'hook-polisher'

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  provider: string; // 'openai', 'anthropic', 'perplexity', 'deep-research'

  @Prop({ required: true })
  model: string; // 'gpt-4o', 'claude-3-5', 'llama-3'

  @Prop({ required: true })
  systemPrompt: string;

  // Future: KnowledgeBase IDs
  // @Prop({ type: [String] })
  // knowledgeBaseIds: string[];
}

export const ModuleConfigSchema = SchemaFactory.createForClass(ModuleConfig);
