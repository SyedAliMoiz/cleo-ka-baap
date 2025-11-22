import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ChatSessionDocument = ChatSession & Document;

@Schema({ timestamps: true })
export class ChatSession {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: string;

  @Prop({ required: true })
  moduleSlug: string;

  @Prop()
  title: string;

  @Prop()
  createdAt?: Date;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);
