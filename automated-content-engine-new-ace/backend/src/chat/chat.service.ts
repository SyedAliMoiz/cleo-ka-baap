import Anthropic from '@anthropic-ai/sdk';
import { TextBlock } from '@anthropic-ai/sdk/resources/messages';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ModulesService } from '../modules/modules.service';
import { ChatMessage, ChatMessageDocument } from './schemas/message.schema';
import { ChatSession, ChatSessionDocument } from './schemas/session.schema';
import { RetrievalService } from '../rag/services/retrieval.service';
import { ContextComposerService } from '../rag/services/context-composer.service';

const ACE_RULES = `
ACE Rules (Non-Overridable):
- Always follow the module's system instructions.
- Prefer grounded facts from the provided REFERENCE CONTEXT.
- If the context does not cover a claim, you may use general knowledge but say so explicitly.
- Match the module's target audience, tone, and format.
- Be concise, specific, and practically useful. Avoid boilerplate.
- If the user asks for a LinkedIn post or Twitter thread, output in that format directly.
`.trim();

const KNOWLEDGE_INSTRUCTION = `
You have access to a specialized knowledge base for this module. 
When provided with reference context, integrate it naturally into your reasoning and outputs.
If the reference material does not contain relevant details for the current question, 
you may use your general knowledge while being clear about what comes from the knowledge base vs. your general understanding.
`.trim();

@Injectable()
export class ChatService {
  private readonly apiKey: string | undefined;
  private readonly model: string = 'claude-sonnet-4-5';
  private readonly anthropic: Anthropic;

  constructor(
    @InjectModel(ChatSession.name)
    private chatSessionModel: Model<ChatSessionDocument>,
    @InjectModel(ChatMessage.name)
    private chatMessageModel: Model<ChatMessageDocument>,
    private configService: ConfigService,
    private modulesService: ModulesService,
    private retrievalService: RetrievalService,
    private contextComposerService: ContextComposerService,
  ) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.anthropic = new Anthropic({
      apiKey: this.apiKey,
    });
  }

  async createSession(
    userId: string,
    moduleSlug: string,
  ): Promise<ChatSessionDocument> {
    const session = new this.chatSessionModel({
      userId,
      moduleSlug,
      title: `New ${moduleSlug} Chat`,
    });

    if (session) await session.save();

    return session;
  }

  async getUserSessionsByModule(
    userId: string,
    moduleSlug: string,
  ): Promise<ChatSessionDocument[]> {
    return this.chatSessionModel
      .find({ userId, moduleSlug })
      .sort({ createdAt: -1 })
      .exec();
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.chatSessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    if (String(session.userId) !== String(userId)) {
      throw new Error('Forbidden');
    }

    // Delete all messages associated with the session
    await this.chatMessageModel.deleteMany({ sessionId });

    // Delete the session itself
    await this.chatSessionModel.findByIdAndDelete(sessionId);
  }

  async getSessionMessages(sessionId: string): Promise<ChatMessageDocument[]> {
    return this.chatMessageModel
      .find({ sessionId })
      .sort({ createdAt: 1 })
      .exec();
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    userMessage: string,
  ): Promise<ChatMessageDocument[]> {
    const session = await this.chatSessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    if (String(session.userId) !== String(userId)) {
      throw new Error('Forbidden');
    }

    const userMsg = new this.chatMessageModel({
      sessionId,
      role: 'user',
      content: userMessage,
    });
    await userMsg.save();

    if (session.title === `New ${session.moduleSlug} Chat`) {
      const title =
        userMessage.length > 50
          ? userMessage.substring(0, 50) + '...'
          : userMessage;
      await this.chatSessionModel.findByIdAndUpdate(sessionId, {
        title,
      });
    }

    const conversationHistory = await this.getSessionMessages(sessionId);

    const assistantResponse = await this.getGptResponse(
      session.moduleSlug,
      conversationHistory,
      userMessage,
    );

    const assistantMsg = new this.chatMessageModel({
      sessionId,
      role: 'assistant',
      content: assistantResponse,
    });
    await assistantMsg.save();

    return await this.getSessionMessages(sessionId);
  }

  private async getGptResponse(
    moduleSlug: string,
    conversationHistory: ChatMessageDocument[],
    userMessage: string,
  ): Promise<string> {
    let moduleSystemPrompt: string | undefined = undefined;
    let moduleTemperature: number = 0.7;
    try {
      const module = await this.modulesService.findBySlug(moduleSlug);
      moduleSystemPrompt = module.systemPrompt ?? undefined;
      moduleTemperature = module.temperature ?? 0.7;
    } catch {
      //
    }

    const systemPrompt = [moduleSystemPrompt, ACE_RULES, KNOWLEDGE_INSTRUCTION]
      .filter(Boolean)
      .join('\n\n');

    if (!this.apiKey) {
      return this.getMockResponse();
    }

    try {
      console.log(`🔍 Retrieving relevant context for module: ${moduleSlug}`);

      const retrievalResult = await this.retrievalService.retrieve(
        moduleSlug,
        userMessage,
        {
          topK: 5,
          scoreThreshold: 0.45,
          rerank: true,
          rerankTopK: 3,
        },
      );

      const composedContext = this.contextComposerService.compose(
        retrievalResult,
        {
          maxTokens: 8000,
          includeSource: true,
          deduplication: true,
          template: 'default',
        },
      );

      const messages: Array<{ role: 'user' | 'assistant'; content: string }> =
        [];

      if (composedContext.chunksUsed > 0) {
        messages.push({
          role: 'assistant',
          content: this.contextComposerService.buildAssistantContextMessage(
            composedContext.context,
          ),
        });

        console.log(
          `📖 Using ${composedContext.chunksUsed} retrieved chunks (${composedContext.totalTokens} tokens)`,
        );
        console.log(`📚 Sources: ${composedContext.sources.join(', ')}`);
      } else {
        console.log(
          `📖 No relevant context found - responding with general knowledge`,
        );
      }

      const trimmedHistory = this.contextComposerService.trimMessagesToLimit(
        conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        8,
      );

      messages.push(...trimmedHistory.slice(0, -1));
      messages.push({
        role: 'user',
        content: userMessage,
      });

      // const conversationTokens =
      //   this.contextComposerService.estimateConversationTokens(
      //     systemPrompt,
      //     messages,
      //   );

      const nPairs = Math.floor(trimmedHistory.length / 2);
      console.log(
        `[ACE] module=${moduleSlug} topK=5 rerank=true chunksUsed=${composedContext.chunksUsed} ctxTokens=${composedContext.totalTokens} msgPairs=${nPairs}`,
      );

      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4000,
        temperature: moduleTemperature,
        system: systemPrompt,
        messages,
      });

      return (response.content[0] as TextBlock).text;
    } catch (error) {
      console.error('Chat response error:', error);

      if (
        error?.message?.includes('vector') ||
        error?.message?.includes('embedding')
      ) {
        console.warn(
          '⚠️  RAG system error, falling back to conversation without retrieval',
        );
        try {
          const trimmedHistory =
            this.contextComposerService.trimMessagesToLimit(
              conversationHistory.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              8,
            );

          const messages = [...trimmedHistory.slice(0, -1)];
          messages.push({
            role: 'user',
            content: userMessage,
          });

          const response = await this.anthropic.messages.create({
            model: this.model,
            max_tokens: 4000,
            temperature: moduleTemperature,
            system: systemPrompt,
            messages,
          });

          return (response.content[0] as TextBlock).text;
        } catch (fallbackError) {
          console.error('Fallback also failed:', fallbackError);
          return this.getMockResponse();
        }
      }

      if (
        error?.message?.includes('token') ||
        error?.message?.includes('length')
      ) {
        return 'I apologize, but your request is too long for me to process. Please try with a shorter message or break it into smaller parts.';
      }

      return this.getMockResponse();
    }
  }

  private getMockResponse(): string {
    return "Sorry, I can't help with that request.";
  }
}
