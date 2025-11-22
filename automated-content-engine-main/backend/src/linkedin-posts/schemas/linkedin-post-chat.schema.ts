import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LinkedInPostChatDocument = LinkedInPostChat & Document;

@Schema()
export class ConversationMessage {
  @Prop({ required: true, enum: ['user', 'assistant', 'system'] })
  role: 'user' | 'assistant' | 'system';

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ default: false })
  isSystemMessage: boolean; // Flag to hide system/initial messages from frontend

  @Prop({ default: false })
  isProcessingStepResponse?: boolean; // Flag to identify processing step responses

  @Prop({ default: false })
  isHidden?: boolean; // Flag to hide system context messages (used for system prompts)
}

export const ConversationMessageSchema =
  SchemaFactory.createForClass(ConversationMessage);

@Schema()
export class GeneratedPost {
  @Prop({ required: true })
  content: string;

  @Prop()
  explanation?: string;
}

export const GeneratedPostSchema = SchemaFactory.createForClass(GeneratedPost);

@Schema({ timestamps: true })
export class LinkedInPostChat {
  @Prop({ required: true })
  originalThread: string;

  @Prop()
  specificInstructions?: string;

  @Prop()
  threadId?: string; // Optional link to thread chat

  @Prop()
  clientId?: string; // Client this chat belongs to

  @Prop()
  systemPrompt?: string; // Store the rendered system prompt with variable injections

  @Prop({ type: [ConversationMessageSchema], default: [] })
  conversationHistory: ConversationMessage[];

  @Prop({ type: [GeneratedPostSchema], default: [] })
  generatedPosts: GeneratedPost[];

  @Prop({ default: 'active', enum: ['active', 'archived'] })
  status: string;

  @Prop({ default: false })
  processingComplete: boolean;

  @Prop({ default: Date.now })
  lastActivity: Date;
}

export const LinkedInPostChatSchema =
  SchemaFactory.createForClass(LinkedInPostChat); 