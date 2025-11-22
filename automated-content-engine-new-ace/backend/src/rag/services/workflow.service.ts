import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { TextBlock } from '@anthropic-ai/sdk/resources/messages';
import { RetrievalService, RetrievalOptions } from './retrieval.service';
import {
  ContextComposerService,
  CompositionOptions,
} from './context-composer.service';

export const ACE_RULES = `
ACE Rules (Non-Overridable):
- Always follow the module's system instructions.
- Prefer grounded facts from the provided REFERENCE CONTEXT.
- If the context does not cover a claim, you may use general knowledge but say so explicitly.
- Match the module's target audience, tone, and format.
- Be concise, specific, and practically useful. Avoid boilerplate.
- If the user asks for a LinkedIn post or Twitter thread, output in that format directly.
`.trim();

export const KNOWLEDGE_INSTRUCTION = `
You have access to a specialized knowledge base for this module. 
When provided with reference context, integrate it naturally into your reasoning and outputs.
If the reference material does not contain relevant details for the current question, 
you may use your general knowledge while being clear about what comes from the knowledge base vs. your general understanding.
`.trim();

export interface WorkflowStep {
  name: string;
  query: string;
  retrievalOptions?: RetrievalOptions;
  contextConfig?: CompositionOptions;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface WorkflowResult {
  stepResults: StepResult[];
  finalOutput: string;
  totalTokensUsed: number;
  totalRetrievalTokens: number;
}

export interface StepResult {
  stepName: string;
  output: string;
  retrievedChunks: number;
  contextTokens: number;
  responseTokens: number;
  sources: string[];
}

@Injectable()
export class WorkflowService {
  private readonly anthropic: Anthropic;
  private readonly model = 'claude-3-5-sonnet-latest';

  constructor(
    private configService: ConfigService,
    private retrievalService: RetrievalService,
    private contextComposerService: ContextComposerService,
  ) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (!apiKey) {
      console.warn(
        '⚠️  ANTHROPIC_API_KEY not set. Workflow service will not work.',
      );
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey || 'dummy-key',
    });
  }

  async executeWorkflow(
    moduleSlug: string,
    steps: WorkflowStep[],
    baseSystemPrompt?: string,
  ): Promise<WorkflowResult> {
    console.log(
      `🔄 Starting workflow with ${steps.length} steps for module: ${moduleSlug}`,
    );

    const stepResults: StepResult[] = [];
    let totalTokensUsed = 0;
    let totalRetrievalTokens = 0;
    const previousOutputs: string[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`\n📍 Step ${i + 1}/${steps.length}: ${step.name}`);

      const interpolatedQuery = this.interpolateQuery(
        step.query,
        previousOutputs,
      );

      const retrievalResult = await this.retrievalService.retrieve(
        moduleSlug,
        interpolatedQuery,
        step.retrievalOptions || {},
      );

      const composedContext = this.contextComposerService.compose(
        retrievalResult,
        step.contextConfig || {},
      );

      const stepSystemPrompt = step.systemPrompt || baseSystemPrompt || '';
      const systemPrompt = [stepSystemPrompt, ACE_RULES, KNOWLEDGE_INSTRUCTION]
        .filter(Boolean)
        .join('\n\n');

      const messages: Array<{ role: 'user' | 'assistant'; content: string }> =
        [];

      if (composedContext.chunksUsed > 0) {
        const safety = this.contextComposerService.ensureTokenSafety(
          systemPrompt,
          composedContext.totalTokens,
          0,
          step.maxTokens || 4000,
        );

        if (!safety.safe) {
          console.warn(
            `⚠️  Token limit exceeded (${safety.totalEstimate}/${safety.limit}), reducing context`,
          );
          const reducedContext = this.contextComposerService.compose(
            retrievalResult,
            {
              ...step.contextConfig,
              maxTokens: Math.floor(
                (step.contextConfig?.maxTokens || 8000) * 0.5,
              ),
            },
          );
          messages.push({
            role: 'assistant',
            content: this.contextComposerService.buildAssistantContextMessage(
              reducedContext.context,
            ),
          });
        } else {
          messages.push({
            role: 'assistant',
            content: this.contextComposerService.buildAssistantContextMessage(
              composedContext.context,
            ),
          });
        }
      }

      messages.push({
        role: 'user',
        content: interpolatedQuery,
      });

      const response = await this.callClaude(
        messages,
        systemPrompt,
        step.temperature || 0.7,
        step.maxTokens || 4000,
      );

      const stepResult: StepResult = {
        stepName: step.name,
        output: response.text,
        retrievedChunks: composedContext.chunksUsed,
        contextTokens: composedContext.totalTokens,
        responseTokens: response.tokensUsed,
        sources: composedContext.sources,
      };

      stepResults.push(stepResult);
      totalTokensUsed += response.tokensUsed + composedContext.totalTokens;
      previousOutputs.push(response.text);

      console.log(
        `✅ Step ${i + 1} completed: ${stepResult.retrievedChunks} chunks, ${stepResult.contextTokens} context tokens, ${stepResult.responseTokens} response tokens`,
      );
    }

    const finalOutput = stepResults[stepResults.length - 1].output;

    console.log(
      `\n🎉 Workflow completed: ${stepResults.length} steps, ${totalTokensUsed} total tokens`,
    );

    return {
      stepResults,
      finalOutput,
      totalTokensUsed,
      totalRetrievalTokens,
    };
  }

  async executeSimple(
    moduleSlug: string,
    query: string,
    systemPrompt?: string,
    retrievalOptions?: RetrievalOptions,
    contextConfig?: CompositionOptions,
  ): Promise<{
    output: string;
    sources: string[];
    contextTokens: number;
    chunksUsed: number;
  }> {
    const retrievalResult = await this.retrievalService.retrieve(
      moduleSlug,
      query,
      retrievalOptions || {},
    );

    const composedContext = this.contextComposerService.compose(
      retrievalResult,
      contextConfig || {},
    );

    const baseSystemPrompt = systemPrompt || '';
    const finalSystemPrompt = [
      baseSystemPrompt,
      ACE_RULES,
      KNOWLEDGE_INSTRUCTION,
    ]
      .filter(Boolean)
      .join('\n\n');

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (composedContext.chunksUsed > 0) {
      messages.push({
        role: 'assistant',
        content: this.contextComposerService.buildAssistantContextMessage(
          composedContext.context,
        ),
      });
    }

    messages.push({
      role: 'user',
      content: query,
    });

    const response = await this.callClaude(
      messages,
      finalSystemPrompt,
      0.7,
      4000,
    );

    return {
      output: response.text,
      sources: composedContext.sources,
      contextTokens: composedContext.totalTokens,
      chunksUsed: composedContext.chunksUsed,
    };
  }

  private async callClaude(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt: string,
    temperature: number,
    maxTokens: number,
  ): Promise<{ text: string; tokensUsed: number }> {
    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages,
      });

      const text = (response.content[0] as TextBlock).text;
      const tokensUsed = response.usage.output_tokens;

      return { text, tokensUsed };
    } catch (error) {
      console.error('❌ Claude API error:', error);
      throw new Error(`Claude API call failed: ${error.message}`);
    }
  }

  private interpolateQuery(query: string, previousOutputs: string[]): string {
    let interpolated = query;

    for (let i = 0; i < previousOutputs.length; i++) {
      const placeholder = `{step${i + 1}}`;
      const placeholderAlt = `{previous}`;

      if (interpolated.includes(placeholder)) {
        interpolated = interpolated.replace(
          new RegExp(placeholder, 'g'),
          previousOutputs[i],
        );
      }

      if (
        i === previousOutputs.length - 1 &&
        interpolated.includes(placeholderAlt)
      ) {
        interpolated = interpolated.replace(
          new RegExp(placeholderAlt, 'g'),
          previousOutputs[i],
        );
      }
    }

    return interpolated;
  }

  async runAnalysisSynthesisWorkflow(
    moduleSlug: string,
    topic: string,
    baseSystemPrompt?: string,
  ): Promise<WorkflowResult> {
    const steps: WorkflowStep[] = [
      {
        name: 'Analysis',
        query: `Analyze the following topic in detail: ${topic}`,
        retrievalOptions: { topK: 10, rerank: true },
        systemPrompt:
          'You are a detailed analyst. Provide comprehensive analysis.',
        temperature: 0.5,
      },
      {
        name: 'Synthesis',
        query: `Based on the previous analysis, synthesize key insights about: ${topic}\n\nPrevious analysis: {step1}`,
        retrievalOptions: { topK: 5 },
        systemPrompt:
          'You are a synthesis expert. Connect ideas and find patterns.',
        temperature: 0.7,
      },
      {
        name: 'Summary',
        query: `Create a concise executive summary of the key points.\n\nSynthesis: {step2}`,
        retrievalOptions: { topK: 3 },
        systemPrompt: 'You are a concise communicator. Distill to the essence.',
        temperature: 0.3,
      },
    ];

    return this.executeWorkflow(moduleSlug, steps, baseSystemPrompt);
  }

  async runResearchAnswerWorkflow(
    moduleSlug: string,
    question: string,
    baseSystemPrompt?: string,
  ): Promise<WorkflowResult> {
    const steps: WorkflowStep[] = [
      {
        name: 'Research',
        query: `Find all relevant information about: ${question}`,
        retrievalOptions: { topK: 15, rerank: true, rerankTopK: 8 },
        systemPrompt:
          'You are a thorough researcher. Gather all relevant facts.',
        temperature: 0.3,
      },
      {
        name: 'Answer',
        query: `Based on the research, provide a comprehensive answer to: ${question}\n\nResearch findings: {step1}`,
        retrievalOptions: { topK: 5 },
        systemPrompt:
          'You are a helpful assistant. Answer clearly and accurately.',
        temperature: 0.7,
      },
    ];

    return this.executeWorkflow(moduleSlug, steps, baseSystemPrompt);
  }
}
