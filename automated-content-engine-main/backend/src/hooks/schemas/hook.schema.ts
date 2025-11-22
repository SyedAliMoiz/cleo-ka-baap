import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type HookDocument = Hook & Document;

export enum HookType {
  QUESTION = 'question',
  STATISTIC = 'statistic',
  STORY = 'story',
  QUOTE = 'quote',
  CONTROVERSIAL = 'controversial',
  CHALLENGE = 'challenge',
  BENEFIT = 'benefit',
  PAIN_POINT = 'pain_point',
  CURIOSITY = 'curiosity',
  ANNOUNCEMENT = 'announcement',
  CUSTOM = 'custom',
}

export enum HookStatus {
  DRAFT = 'draft',
  GENERATED = 'generated',
  SELECTED = 'selected',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

@Schema({ timestamps: true })
export class Hook {
  @Prop({ required: true })
  content: string;

  @Prop({
    type: String,
    enum: Object.values(HookType),
    default: HookType.QUESTION,
  })
  type: string;

  @Prop({
    type: String,
    enum: Object.values(HookStatus),
    default: HookStatus.DRAFT,
  })
  status: string;

  @Prop({ type: Number, default: 0 })
  characterCount: number;

  @Prop({ type: Boolean, default: false })
  hasEmoji: boolean;

  @Prop({ type: Boolean, default: false })
  hasHashtags: boolean;

  @Prop({ type: Number, default: 0 })
  engagementScore: number;

  @Prop({ type: Date })
  generatedAt: Date;

  @Prop({ type: Boolean, default: false })
  isFavorited: boolean;

  @Prop({ type: Object })
  metadata: {
    targetAudience?: string;
    emotionTarget?: string;
    keyTopic?: string;
    aiPrompt?: string;
    variationNumber?: number;
    hashtagsUsed?: string[];
  };

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  notes: string;
}

export const HookSchema = SchemaFactory.createForClass(Hook);
