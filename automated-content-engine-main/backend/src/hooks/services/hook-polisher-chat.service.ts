import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Logger } from '@nestjs/common';
import {
  HookPolisherChat,
  HookPolisherChatDocument,
} from '../schemas/hook-polisher-chat.schema';
import { AnthropicService } from '../../ai/services/anthropic.service';
import { HookPolisherGateway } from '../gateways/hook-polisher.gateway';
import { PromptsService } from '../../prompts/prompts.service';
import { PromptFeature } from '../../prompts/schemas/prompt.schema';

@Injectable()
export class HookPolisherChatService {
  private readonly logger = new Logger(HookPolisherChatService.name);

  constructor(
    @InjectModel(HookPolisherChat.name)
    private hookPolisherChatModel: Model<HookPolisherChatDocument>,
    private anthropicService: AnthropicService,
    private hookPolisherGateway: HookPolisherGateway,
    private promptsService: PromptsService,
  ) {}

  async createChat(data: {
    hook: string;
    threadContext?: string;
    research?: string;
    angle?: string;
    threadId?: string;
    clientId?: string;
  }): Promise<HookPolisherChatDocument> {
    // Generate the system and user prompts immediately when creating the chat
    const polishPromptData = await this.promptsService.renderFullPromptByFeature(
      PromptFeature.POLISH_HOOKS_STEP1,
      {
        hook: data.hook,
        threadContext: data.threadContext || '',
        research: data.research || '',
        angle: data.angle || '',
      },
    );

    // Store both system and user prompts as hidden messages from the start
    const initialConversationHistory = [
      {
        role: 'system' as const,
        content: polishPromptData.systemPrompt,
        timestamp: new Date(),
        isSystemMessage: true, // Hide from frontend
        isProcessingStepResponse: false,
        isHidden: true, // Mark as hidden for filtering
      },
      {
        role: 'user' as const,
        content: polishPromptData.userPrompt,
        timestamp: new Date(),
        isSystemMessage: true, // Hide backend prompts from frontend
        isProcessingStepResponse: false, // Backend prompt, not a response
        isHidden: true, // Mark as hidden for filtering
      },
    ];

    const chat = new this.hookPolisherChatModel({
      originalHook: data.hook,
      threadContext: data.threadContext,
      research: data.research,
      angle: data.angle,
      threadId: data.threadId,
      clientId: data.clientId,
      polishedHooks: [],
      conversationHistory: initialConversationHistory,
      lastActivity: new Date(),
    });

    const savedChat = await chat.save();
    const chatId = (savedChat as any)._id.toString();

    this.logger.debug(
      `Chat created with ID: ${chatId}. System and user prompts stored in conversation history. Processing will start when user visits the chat.`,
    );

    return savedChat;
  }

  private async executeChainedPrompts(
    chat: HookPolisherChatDocument,
    data: {
      hook: string;
      threadContext?: string;
      research?: string;
      angle?: string;
    },
    chatId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Starting chained prompts execution for chat ${chatId}`);

      // Log all variables being used in hook polishing
      this.logger.debug(`Hook polishing variables for chat ${chatId}:
        Original Hook: ${data.hook?.substring(0, 100)}...
        Thread Context Length: ${data.threadContext?.length || 0} characters
        Research Length: ${data.research?.length || 0} characters
        Angle: ${data.angle || 'N/A'}
        Research Content Preview: ${data.research?.substring(0, 200)}...
      `);

      // Step 1: Polish the hook
      this.logger.log(`Step 1: Starting hook polishing for chat ${chatId}`);

      const polishPromptData = await this.promptsService.renderFullPromptByFeature(
        PromptFeature.POLISH_HOOKS_STEP1,
        {
          hook: data.hook,
          threadContext: data.threadContext || '',
          research: data.research || '',
          angle: data.angle || '',
        },
      );

      // Log the full prompt for hook polishing step 1
      this.logger.debug(`
=== HOOK POLISHING STEP 1 SYSTEM PROMPT ===
${polishPromptData.systemPrompt ? polishPromptData.systemPrompt : '(No system prompt configured)'}
=== END SYSTEM PROMPT ===

=== HOOK POLISHING STEP 1 USER PROMPT ===
${polishPromptData.userPrompt}
=== END USER PROMPT ===

=== FULL COMBINED PROMPT SENT TO AI ===
${polishPromptData.fullPrompt}
=== END FULL PROMPT ===
      `);

      // Refetch chat to avoid version conflicts
      let currentChat = await this.findById(chatId);
      if (!currentChat) {
        throw new Error(`Chat ${chatId} not found during step 1`);
      }

      this.logger.debug(
        `Before API call - conversation history length: ${currentChat.conversationHistory.length}`,
      );

      // Debug: Log conversation history being passed to step 1 (what actually gets sent to Claude)
      const step1ConversationHistory = currentChat.conversationHistory
        .filter(msg => !msg.isHidden && msg.role !== 'system') // Same filtering as in AnthropicService
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
      
      this.logger.debug(`Step 1 - Conversation history being passed to Claude (filtered):
        Total messages: ${step1ConversationHistory.length}
        Messages: ${JSON.stringify(step1ConversationHistory.map(msg => ({
          role: msg.role,
          contentLength: msg.content.length,
          contentPreview: msg.content.substring(0, 100) + '...'
        })), null, 2)}
      `);

      // Extract the system prompt from conversation history
      const systemMessage = currentChat.conversationHistory.find(
        msg => msg.role === 'system' && msg.isHidden
      );
      
      if (!systemMessage) {
        throw new Error('System prompt not found in conversation history - chat may be corrupted');
      }

      // Log the system prompt to verify it contains format instructions
      this.logger.log(`=== STEP 1 SYSTEM PROMPT VERIFICATION ===`);
      this.logger.log(`System prompt length: ${systemMessage.content.length}`);
      this.logger.log(`Contains HOOK_OUTPUT_FORMAT: ${systemMessage.content.includes('HOOK_OUTPUT_FORMAT')}`);
      this.logger.log(`Contains <HOOK id: ${systemMessage.content.includes('<HOOK id')}`);
      this.logger.log(`System prompt preview: ${systemMessage.content.substring(0, 500)}...`);
      this.logger.log(`=== END SYSTEM PROMPT VERIFICATION ===`);

      // Use conversational method - pass current conversation history AND system prompt
      const polishResponse = await this.anthropicService.conversationalHookPolish({
        hook: data.hook,
        threadContext: data.threadContext,
        research: data.research,
        angle: data.angle,
        userMessage: polishPromptData.userPrompt, // Only user prompt, not full combined
        systemPrompt: systemMessage.content, // Pass the extracted system prompt
        conversationHistory: currentChat.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          isHidden: msg.isHidden,
        })),
      });

      this.logger.debug(
        `STEP 1 RESPONSE RECEIVED:\n${JSON.stringify(polishResponse, null, 2)}`,
      );

      // No JSON parsing - just store the raw markdown response
      currentChat.conversationHistory.push({
        role: 'assistant',
        content: polishResponse.response,
        timestamp: new Date(),
        isSystemMessage: false,
        isProcessingStepResponse: true, // Mark as processing step response
      });

      // Store empty array for polishedHooks since we're not parsing JSON anymore
      currentChat.polishedHooks = [];

      this.logger.debug(
        `Before saving - conversation history length: ${currentChat.conversationHistory.length}`,
      );

      // Use findByIdAndUpdate to avoid version conflicts
      await this.hookPolisherChatModel.findByIdAndUpdate(
        chatId,
        {
          $set: {
            conversationHistory: currentChat.conversationHistory,
            polishedHooks: currentChat.polishedHooks,
          },
        },
        { new: true },
      );

      this.logger.debug(`After saving - checking database...`);

      // Verify the save worked by re-fetching the chat
      const savedChat = await this.findById(chatId);
      this.logger.debug(
        `Verification: fetched chat has ${savedChat?.conversationHistory?.length || 0} conversation messages`,
      );

      this.logger.log(
        `Step 1 completed: Hook polishing done for chat ${chatId}`,
      );

      // Emit step 1 completion with data
      const step1Data = {
        step: 'polishing',
        timestamp: new Date(),
        prompt: polishPromptData.userPrompt,
        response: polishResponse.response,
        responseTimestamp: new Date(),
      };
      this.hookPolisherGateway.emitProcessingUpdate(
        chatId,
        'polishing',
        step1Data,
      );

      this.hookPolisherGateway.emitProcessingUpdate(chatId, 'fact-check');

      // Step 2: Fact-check the information
      this.logger.log(
        `Step 2: Starting information fact-check for chat ${chatId}`,
      );

      const factCheckPromptData = await this.promptsService.renderFullPromptByFeature(
        PromptFeature.POLISH_HOOKS_STEP2_FACT_CHECK,
        {
          hook: data.hook,
          threadContext: data.threadContext || '',
          research: data.research || '',
          angle: data.angle || '',
        },
      );

      // Log the full prompt for hook polishing step 2
      this.logger.debug(`
=== HOOK POLISHING STEP 2 FACT-CHECK SYSTEM PROMPT ===
${factCheckPromptData.systemPrompt ? factCheckPromptData.systemPrompt : '(No system prompt configured)'}
=== END SYSTEM PROMPT ===

=== HOOK POLISHING STEP 2 FACT-CHECK USER PROMPT ===
${factCheckPromptData.userPrompt}
=== END USER PROMPT ===

=== FULL COMBINED PROMPT SENT TO AI ===
${factCheckPromptData.fullPrompt}
=== END FULL PROMPT ===
      `);

      // Refetch chat again to avoid version conflicts
      currentChat = await this.findById(chatId);
      if (!currentChat) {
        throw new Error(`Chat ${chatId} not found during step 2`);
      }

      // Store only the USER prompt in conversation history (not the full combined prompt)
      currentChat.conversationHistory.push({
        role: 'user',
        content: factCheckPromptData.userPrompt,
        timestamp: new Date(),
        isSystemMessage: true, // Hide backend prompts from frontend
        isProcessingStepResponse: false, // Backend prompt, not a response
        isHidden: true, // Mark as hidden for filtering
      });

      // Debug: Log conversation history being passed to step 2 (what actually gets sent to Claude)
      const step2ConversationHistory = currentChat.conversationHistory
        .filter(msg => !msg.isHidden && msg.role !== 'system') // Same filtering as in AnthropicService
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
      
      this.logger.debug(`Step 2 - Conversation history being passed to Claude (filtered):
        Total messages: ${step2ConversationHistory.length}
        Messages: ${JSON.stringify(step2ConversationHistory.map(msg => ({
          role: msg.role,
          contentLength: msg.content.length,
          contentPreview: msg.content.substring(0, 100) + '...'
        })), null, 2)}
      `);

      // Extract the system prompt from conversation history for step 2
      const systemMessage2 = currentChat.conversationHistory.find(
        msg => msg.role === 'system' && msg.isHidden
      );
      
      if (!systemMessage2) {
        throw new Error('System prompt not found in conversation history for step 2 - chat may be corrupted');
      }

      // Use conversational method - variables are redundant since conversation history has context
      const factCheckResponse = await this.anthropicService.conversationalHookPolish({
        hook: data.hook, // Required by DTO but redundant - already in conversation history
        threadContext: data.threadContext, // Redundant
        research: data.research, // Redundant  
        angle: data.angle, // Redundant
        userMessage: factCheckPromptData.userPrompt,
        systemPrompt: systemMessage2.content, // Pass the extracted system prompt
        conversationHistory: currentChat.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          isHidden: msg.isHidden,
        })),
      });
      this.logger.debug(
        `STEP 2 RESPONSE RECEIVED:\n${JSON.stringify(factCheckResponse, null, 2)}`,
      );

      currentChat.conversationHistory.push({
        role: 'assistant',
        content: factCheckResponse.response,
        timestamp: new Date(),
        isSystemMessage: false,
        isProcessingStepResponse: true, // Mark as processing step response
      });

      // Use findByIdAndUpdate to avoid version conflicts
      await this.hookPolisherChatModel.findByIdAndUpdate(
        chatId,
        {
          $set: {
            conversationHistory: currentChat.conversationHistory,
          },
        },
        { new: true },
      );
      this.logger.log(
        `Step 2 completed: Information fact-check done for chat ${chatId}`,
      );

      // Emit step 2 completion with data
      const step2Data = {
        step: 'fact-check',
        timestamp: new Date(),
        prompt: factCheckPromptData.userPrompt,
        response: factCheckResponse.response,
        responseTimestamp: new Date(),
      };
      this.hookPolisherGateway.emitProcessingUpdate(
        chatId,
        'fact-check',
        step2Data,
      );

      this.hookPolisherGateway.emitProcessingUpdate(chatId, 'hook-fact-check');

      // Step 3: Fact-check the hooks
      this.logger.log(`Step 3: Starting hook fact-check for chat ${chatId}`);

      const hookFactCheckPromptData = await this.promptsService.renderFullPromptByFeature(
        PromptFeature.POLISH_HOOKS_STEP3_HOOK_FACT_CHECK,
        {
          hook: data.hook,
          threadContext: data.threadContext || '',
          research: data.research || '',
          angle: data.angle || '',
        },
      );

      // Log the full prompt for hook polishing step 3
      this.logger.debug(`
=== HOOK POLISHING STEP 3 HOOK FACT-CHECK SYSTEM PROMPT ===
${hookFactCheckPromptData.systemPrompt ? hookFactCheckPromptData.systemPrompt : '(No system prompt configured)'}
=== END SYSTEM PROMPT ===

=== HOOK POLISHING STEP 3 HOOK FACT-CHECK USER PROMPT ===
${hookFactCheckPromptData.userPrompt}
=== END USER PROMPT ===

=== FULL COMBINED PROMPT SENT TO AI ===
${hookFactCheckPromptData.fullPrompt}
=== END FULL PROMPT ===
      `);

      // Refetch chat again to avoid version conflicts
      currentChat = await this.findById(chatId);
      if (!currentChat) {
        throw new Error(`Chat ${chatId} not found during step 3`);
      }

      // Store only the USER prompt in conversation history (not the full combined prompt)
      currentChat.conversationHistory.push({
        role: 'user',
        content: hookFactCheckPromptData.userPrompt,
        timestamp: new Date(),
        isSystemMessage: true, // Hide backend prompts from frontend
        isProcessingStepResponse: false, // Backend prompt, not a response
        isHidden: true, // Mark as hidden for filtering
      });

      // Debug: Log conversation history being passed to step 3 (what actually gets sent to Claude)
      const step3ConversationHistory = currentChat.conversationHistory
        .filter(msg => !msg.isHidden && msg.role !== 'system') // Same filtering as in AnthropicService
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
      
      this.logger.debug(`Step 3 - Conversation history being passed to Claude (filtered):
        Total messages: ${step3ConversationHistory.length}
        Messages: ${JSON.stringify(step3ConversationHistory.map(msg => ({
          role: msg.role,
          contentLength: msg.content.length,
          contentPreview: msg.content.substring(0, 100) + '...'
        })), null, 2)}
      `);

      // Extract the system prompt from conversation history for step 3
      const systemMessage3 = currentChat.conversationHistory.find(
        msg => msg.role === 'system' && msg.isHidden
      );
      
      if (!systemMessage3) {
        throw new Error('System prompt not found in conversation history for step 3 - chat may be corrupted');
      }

      // Use conversational method - variables are redundant since conversation history has context
      const hookFactCheckResponse = await this.anthropicService.conversationalHookPolish({
        hook: data.hook, // Required by DTO but redundant - already in conversation history
        threadContext: data.threadContext, // Redundant
        research: data.research, // Redundant
        angle: data.angle, // Redundant
        userMessage: hookFactCheckPromptData.userPrompt,
        systemPrompt: systemMessage3.content, // Pass the extracted system prompt
        conversationHistory: currentChat.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          isHidden: msg.isHidden,
        })),
      });
      this.logger.debug(
        `STEP 3 RESPONSE RECEIVED:\n${JSON.stringify(hookFactCheckResponse, null, 2)}`,
      );

      currentChat.conversationHistory.push({
        role: 'assistant',
        content: hookFactCheckResponse.response,
        timestamp: new Date(),
        isSystemMessage: false,
        isProcessingStepResponse: true, // Mark as processing step response
      });

      currentChat.lastActivity = new Date();

      // Use findByIdAndUpdate to avoid version conflicts
      await this.hookPolisherChatModel.findByIdAndUpdate(
        chatId,
        {
          $set: {
            conversationHistory: currentChat.conversationHistory,
            lastActivity: currentChat.lastActivity,
          },
        },
        { new: true },
      );
      this.logger.log(
        `Step 3 completed: Hook fact-check done for chat ${chatId}`,
      );

      // Emit step 3 completion with data
      const step3Data = {
        step: 'hook-fact-check',
        timestamp: new Date(),
        prompt: hookFactCheckPromptData.userPrompt,
        response: hookFactCheckResponse.response,
        responseTimestamp: new Date(),
      };
      this.hookPolisherGateway.emitProcessingUpdate(
        chatId,
        'hook-fact-check',
        step3Data,
      );

      // Mark processing as complete in the database
      await this.hookPolisherChatModel.findByIdAndUpdate(
        chatId,
        {
          $set: {
            processingComplete: true,
          },
        },
        { new: true },
      );

      // Processing complete
      this.logger.log(`All chained prompts completed for chat ${chatId}`);
      this.hookPolisherGateway.emitProcessingUpdate(chatId, 'complete');
      this.hookPolisherGateway.emitProcessingComplete(chatId);
    } catch (error) {
      this.logger.error(
        `Error executing chained prompts for chat ${chatId}: ${error.message}`,
        error.stack,
      );
      // Emit error or completion anyway
      this.hookPolisherGateway.emitProcessingUpdate(chatId, 'complete');
    }
  }

  async findByThreadId(
    threadId: string,
  ): Promise<HookPolisherChatDocument | null> {
    return this.hookPolisherChatModel
      .findOne({ threadId, status: 'active' })
      .exec();
  }

  async findById(id: string): Promise<HookPolisherChatDocument | null> {
    return this.hookPolisherChatModel.findById(id).exec();
  }

  async findAll(): Promise<HookPolisherChatDocument[]> {
    return this.hookPolisherChatModel
      .find({ status: { $ne: 'archived' } })
      .sort({ lastActivity: -1 })
      .exec();
  }

  async updateChatData(
    id: string,
    data: {
      conversationHistory?: any[];
      polishedHooks?: any[];
      lastActivity?: Date;
    },
  ): Promise<HookPolisherChatDocument | null> {
    return this.hookPolisherChatModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async addMessage(
    id: string,
    message: string,
  ): Promise<{ response: string; polishedHooks?: any[] }> {
    const chat = await this.findById(id);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Add user message
    chat.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      isSystemMessage: false,
      isProcessingStepResponse: false,
    });

    // Retrieve the stored system prompt from conversation history
    const systemMessage = chat.conversationHistory.find(
      msg => msg.role === 'system' && msg.isHidden
    );
    
    if (!systemMessage) {
      throw new Error('System prompt not found in chat history');
    }

    // Get conversation context (exclude system messages and hidden messages)
    const conversationContext = chat.conversationHistory
      .filter(msg => !msg.isSystemMessage && !msg.isHidden)
      .map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

    const aiResponse = await this.anthropicService.conversationalHookPolish({
      hook: chat.originalHook,
      threadContext: chat.threadContext,
      research: chat.research,
      angle: chat.angle,
      userMessage: message,
      systemPrompt: systemMessage.content, // Use stored system prompt
      conversationHistory: conversationContext,
    });

    // Add AI response (show it in frontend for conversational interactions)
    chat.conversationHistory.push({
      role: 'assistant',
      content: aiResponse.response,
      timestamp: new Date(),
      isSystemMessage: false, // Show conversational AI responses in frontend
      isProcessingStepResponse: false, // Regular conversation, not processing step
    });

    // Update polished hooks if provided
    if (aiResponse.polishedHooks && aiResponse.polishedHooks.length > 0) {
      chat.polishedHooks = aiResponse.polishedHooks;
    }

    chat.lastActivity = new Date();
    await chat.save();

    return {
      response: aiResponse.response,
      polishedHooks: aiResponse.polishedHooks,
    };
  }

  async archiveChat(id: string): Promise<HookPolisherChatDocument | null> {
    return this.hookPolisherChatModel
      .findByIdAndUpdate(id, { status: 'archived' }, { new: true })
      .exec();
  }

  private async buildPolishPrompt(data: {
    hook: string;
    threadContext?: string;
    research?: string;
    angle?: string;
  }): Promise<string> {
    const variables = {
      hook: data.hook,
      threadContext: data.threadContext || '',
      research: data.research || '',
      angle: data.angle || '',
    };

    const promptData = await this.promptsService.renderFullPromptByFeature(
      PromptFeature.POLISH_HOOKS_STEP1,
      variables,
    );

    return promptData.fullPrompt;
  }

  private async buildFactCheckPrompt(data: {
    hook: string;
    threadContext?: string;
    research?: string;
    angle?: string;
  }): Promise<string> {
    const variables = {
      hook: data.hook,
      threadContext: data.threadContext || '',
      research: data.research || '',
      angle: data.angle || '',
    };

    const promptData = await this.promptsService.renderFullPromptByFeature(
      PromptFeature.POLISH_HOOKS_STEP2_FACT_CHECK,
      variables,
    );

    return promptData.fullPrompt;
  }

  private async buildHookFactCheckPrompt(
    data: {
      hook: string;
      threadContext?: string;
      research?: string;
      angle?: string;
    },
    polishedHooks: any[], // Keep parameter for now to avoid breaking changes
  ): Promise<string> {
    // Since we're not parsing JSON anymore, Step 3 will reference Step 1's response
    // from conversation history rather than extracting polished hooks
    const variables = {
      hook: data.hook,
      threadContext: data.threadContext || '',
      research: data.research || '',
      angle: data.angle || '',
    };

    const promptData = await this.promptsService.renderFullPromptByFeature(
      PromptFeature.POLISH_HOOKS_STEP3_HOOK_FACT_CHECK,
      variables,
    );

    return promptData.fullPrompt;
  }

  async triggerChainedPrompts(
    chatId: string,
    data: {
      hook: string;
      threadContext?: string;
      research?: string;
      angle?: string;
    },
  ): Promise<void> {
    this.logger.debug(`Triggering chained prompts for chat ${chatId}`);
    const chat = await this.findById(chatId);
    if (!chat) {
      this.logger.error(
        `Chat ${chatId} not found when triggering chained prompts`,
      );
      throw new Error('Chat not found');
    }

    this.logger.debug(
      `Chat found, executing chained prompts for chat ${chatId}`,
    );
    // Execute chained prompts in background - don't await to avoid blocking HTTP response
    this.executeChainedPrompts(chat, data, chatId).catch((error) => {
      this.logger.error(
        `Error in background chained prompts for chat ${chatId}: ${error.message}`,
        error.stack,
      );
    });
  }

  async deleteChat(id: string): Promise<{ success: boolean; message: string; unlinkedChats?: string[] }> {
    try {
      const chat = await this.findById(id);
      if (!chat) {
        throw new Error('Hook polisher chat not found');
      }

      const unlinkedChats: string[] = [];

      // If this chat was linked to a thread, we don't delete the thread but just note the unlinking
      if (chat.threadId) {
        unlinkedChats.push(`Thread ${chat.threadId}`);
        this.logger.debug(`Hook polisher chat ${id} was linked to thread ${chat.threadId}, will be unlinked`);
      }

      // Delete the hook polisher chat
      await this.hookPolisherChatModel.findByIdAndDelete(id);

      this.logger.log(`Hook polisher chat ${id} deleted successfully`);

      return {
        success: true,
        message: 'Hook polisher chat deleted successfully',
        unlinkedChats: unlinkedChats.length > 0 ? unlinkedChats : undefined,
      };
    } catch (error) {
      this.logger.error(`Error deleting hook polisher chat ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
}
