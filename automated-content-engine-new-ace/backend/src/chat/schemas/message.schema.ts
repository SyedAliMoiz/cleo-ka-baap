import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
  })
  sessionId: string;

  @Prop({ enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @Prop()
  content: string;

  @Prop()
  createdAt?: Date;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
