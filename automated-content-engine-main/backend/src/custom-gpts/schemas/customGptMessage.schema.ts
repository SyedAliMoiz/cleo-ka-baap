import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CustomGptMessageDocument = CustomGptMessage & Document;

@Schema({ timestamps: true })
export class CustomGptMessage {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'CustomGptSession' })
  sessionId: string;

  @Prop({ enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @Prop()
  content: string;

  @Prop()
  createdAt?: Date;
}

export const CustomGptMessageSchema =
  SchemaFactory.createForClass(CustomGptMessage);
