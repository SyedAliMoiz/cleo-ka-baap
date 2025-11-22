import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ThreadWriterChatDocument = ThreadWriterChat & Document;

@Schema({ _id: false })
export class ConversationMessage {
  @Prop({ required: true, enum: ['user', 'assistant', 'system'] })
  role: 'user' | 'assistant' | 'system';

  @Prop({ required: true })
  content: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ default: false })
  isSystemMessage: boolean;

  @Prop({ default: false })
  isProcessingStepResponse: boolean;

  @Prop({ default: false })
  isHidden: boolean;
}

const ConversationMessageSchema = SchemaFactory.createForClass(ConversationMessage);

@Schema({ timestamps: true })
export class ThreadWriterChat {
  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  clientId: string;

  @Prop({ required: true })
  research: string;

  @Prop({ type: Object })
  selectedArticle?: object;

  @Prop({ type: Object })
  selectedAngle?: object;

  @Prop({ type: Object })
  selectedHook?: object;

  @Prop({ type: [ConversationMessageSchema], default: [] })
  conversationHistory: ConversationMessage[];

  @Prop()
  generatedThread?: string;

  @Prop({ default: 'active', enum: ['active', 'archived'] })
  status: string;

  @Prop({ default: false })
  processingComplete: boolean;

  @Prop({ default: Date.now })
  lastActivity: Date;
}

export const ThreadWriterChatSchema = SchemaFactory.createForClass(ThreadWriterChat); 