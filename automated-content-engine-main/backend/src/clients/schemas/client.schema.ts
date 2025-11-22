import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ClientDocument = Client & Document;

@Schema({ timestamps: true })
export class Client {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  businessInfo: string;

  @Prop({ required: true })
  goals: string;

  @Prop({ default: '' })
  voice: string;

  @Prop({ default: '' })
  voiceAnalysis: string;

  @Prop({ default: '' })
  feedback: string;

  @Prop({ type: [String], default: [] })
  nicheTags: string[];

  @Prop()
  email: string;

  @Prop()
  company: string;

  @Prop()
  avatar: string;

  @Prop({ type: String, default: 'active' })
  status: string;

  @Prop({ required: true })
  bio: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  domains: string[];

  @Prop({ type: Object, default: {} })
  preferences: {
    tone?: string;
    style?: string;
    wordCount?: number;
    audience?: string;
    frequency?: string;
  };

  @Prop({ type: [{ type: Object }], default: [] })
  socialProfiles: {
    platform: string;
    username: string;
    url: string;
  }[];

  @Prop({ type: [{ type: Object }], default: [] })
  contentExamples: {
    url: string;
    title: string;
    type: string;
    notes: string;
  }[];

  @Prop({ type: [String], default: [] })
  competitors: string[];

  @Prop({ type: [String], default: [] })
  keywords: string[];

  @Prop({ type: Date })
  lastActive: Date;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
