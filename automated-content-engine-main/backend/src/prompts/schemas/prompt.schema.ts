import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PromptDocument = Prompt & Document;

export interface PromptVariable {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'object' | 'array';
}

export enum PromptFeature {
  RANK_ARTICLES = 'rank_articles',
  GENERATE_ANGLES = 'generate_angles',
  GENERATE_HOOKS = 'generate_hooks',
  GENERATE_THREAD = 'generate_thread',
  COMPLETE_PROMPT = 'complete_prompt',
  POLISH_HOOKS_STEP1 = 'polish_hooks_step1',
  POLISH_HOOKS_STEP2_FACT_CHECK = 'polish_hooks_step2_fact_check',
  POLISH_HOOKS_STEP3_HOOK_FACT_CHECK = 'polish_hooks_step3_hook_fact_check',
  LINKEDIN_POST_GENERATION_STEP1 = 'linkedin_post_generation_step1',
  LINKEDIN_POST_GENERATION_STEP2_FACT_CHECK = 'linkedin_post_generation_step2_fact_check',
  LINKEDIN_POST_GENERATION_STEP3_EVALUATE = 'linkedin_post_generation_step3_evaluate',
  LINKEDIN_POST_GENERATION_STEP4_OPTIMIZE = 'linkedin_post_generation_step4_optimize',
  THREAD_GENERATION_STEP1 = 'thread_generation_step1',
  THREAD_GENERATION_STEP2_FACT_CHECK = 'thread_generation_step2_fact_check',
  THREAD_GENERATION_STEP3_APPLY_TRANSITION = 'thread_generation_step3_apply_transition',
  THREAD_GENERATION_STEP4_EVALUATE_THREAD = 'thread_generation_step4_evaluate_thread',
  THREAD_GENERATION_STEP5_APPLY_CHANGES = 'thread_generation_step5_apply_changes',
}

@Schema({ timestamps: true })
export class Prompt {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: PromptFeature })
  feature: PromptFeature;

  @Prop({ required: true })
  template: string;

  @Prop({ required: false })
  systemPrompt: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: false })
  category: string;

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        description: { type: String, required: true },
        required: { type: Boolean, default: true },
        type: {
          type: String,
          enum: ['string', 'object', 'array'],
          default: 'string',
        },
      },
    ],
    default: [],
  })
  availableVariables: PromptVariable[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDefault: boolean;
}

export const PromptSchema = SchemaFactory.createForClass(Prompt); 
