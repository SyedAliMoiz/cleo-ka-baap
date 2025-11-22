import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomGptSessionDocument = CustomGptSession & Document;

@Schema({ timestamps: true })
export class CustomGptSession {
  @Prop({ required: true })
  gptType: string;

  @Prop()
  title: string;

  @Prop()
  createdAt?: Date;
}

export const CustomGptSessionSchema =
  SchemaFactory.createForClass(CustomGptSession);
