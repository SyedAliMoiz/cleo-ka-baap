import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
  @Prop({ required: true })
  userId: string; // Owner of the client

  @Prop({ required: true })
  name: string;

  @Prop()
  website: string;

  @Prop()
  industry: string;

  @Prop()
  niche: string;

  @Prop()
  targetAudience: string;

  // Stored Reports from Step 1
  @Prop()
  businessReport: string; // Markdown or JSON content

  @Prop()
  voiceGuide: string; // Markdown or JSON content
}

export const ClientSchema = SchemaFactory.createForClass(Client);
