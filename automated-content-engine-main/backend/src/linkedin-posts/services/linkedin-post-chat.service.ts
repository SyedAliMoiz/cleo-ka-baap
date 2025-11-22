import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LinkedInPostChat, LinkedInPostChatDocument } from '../schemas/linkedin-post-chat.schema';
import { AnthropicService } from '../../ai/services/anthropic.service';
import { PromptsService } from '../../prompts/prompts.service';
import { PromptFeature } from '../../prompts/schemas/prompt.schema';
import { LinkedInPostGateway } from '../gateways/linkedin-post.gateway';
import { ClientsService } from '../../clients/clients.service';

@Injectable()
export class LinkedInPostChatService {
  private readonly logger = new Logger(LinkedInPostChatService.name);

  constructor(
    @InjectModel(LinkedInPostChat.name)
    private linkedInPostChatModel: Model<LinkedInPostChatDocument>,
    private anthropicService: AnthropicService,
    private promptsService: PromptsService,
    private linkedInPostGateway: LinkedInPostGateway,
    private clientsService: ClientsService,
  ) {}

  async createChat(data: {
    thread: string;
    specificInstructions?: string;
    threadId?: string;
    clientId?: string;
  }): Promise<LinkedInPostChatDocument> {
    // Get client context if clientId exists
    let clientContext = '';
    this.logger.debug(`[CREATE CHAT] ClientId provided: ${data.clientId}`);
    
    if (data.clientId) {
      try {
        const client = await this.clientsService.findOne(data.clientId);
        this.logger.debug(`[CREATE CHAT] Client found: ${client ? 'YES' : 'NO'}`);
        
        if (client) {
          this.logger.debug(`[CREATE CHAT] Client details - name: ${client.name}, bio length: ${client.bio?.length || 0}`);
          clientContext = this.buildClientContext(client);
          this.logger.debug(`[CREATE CHAT] Client context built for ${client.name}: ${clientContext.length} characters`);
          
          if (clientContext.length === 0) {
            this.logger.warn(`[CREATE CHAT] Client context is empty for client ${client.name}. Client data might be incomplete.`);
          }
        } else {
          this.logger.warn(`[CREATE CHAT] Client with ID ${data.clientId} not found in database`);
        }
      } catch (error) {
        this.logger.warn(`[CREATE CHAT] Could not fetch client ${data.clientId}: ${error.message}`);
      }
    } else {
      this.logger.debug(`[CREATE CHAT] No clientId provided`);
    }

    // Render the initial system prompt with variable injections
    const promptData = await this.promptsService.renderFullPromptByFeature(
      PromptFeature.LINKEDIN_POST_GENERATION_STEP1,
      {
        thread: data.thread,
        specificInstructions: data.specificInstructions || '',
        clientContext,
      },
    );

    const newChat = new this.linkedInPostChatModel({
      originalThread: data.thread,
      specificInstructions: data.specificInstructions,
      threadId: data.threadId,
      clientId: data.clientId,
      systemPrompt: promptData.systemPrompt, // Store the rendered system prompt
      conversationHistory: [
        // Store the initial user prompt in conversation history
        {
          role: 'user',
          content: promptData.userPrompt,
          timestamp: new Date(),
          isSystemMessage: true, // Hide from frontend initially
          isProcessingStepResponse: false,
        }
      ],
      generatedPosts: [],
      processingComplete: false,
    });

    return await newChat.save();
  }

  async findById(chatId: string): Promise<LinkedInPostChatDocument | null> {
    return await this.linkedInPostChatModel.findById(chatId).lean();
  }

  async findByThread(thread: string): Promise<LinkedInPostChatDocument | null> {
    return await this.linkedInPostChatModel.findOne({ originalThread: thread }).lean();
  }

  async findByThreadId(threadId: string): Promise<LinkedInPostChatDocument | null> {
    return await this.linkedInPostChatModel.findOne({ threadId }).lean();
  }

  async findAll(): Promise<LinkedInPostChatDocument[]> {
    return await this.linkedInPostChatModel
      .find({})
      .sort({ lastActivity: -1 })
      .lean();
  }

  async executeChainedPrompts(chatId: string, data: {
    thread: string;
    specificInstructions?: string;
  }): Promise<void> {
    try {
      this.logger.log(`Starting LinkedIn post processing for chat: ${chatId}`);

      // Get the chat to access clientId
      const chatForClientData = await this.findById(chatId);
      if (!chatForClientData) {
        throw new Error(`Chat ${chatId} not found`);
      }

      // Get client context if clientId exists
      let clientContext = '';
      this.logger.debug(`Chat data - clientId: ${chatForClientData.clientId}`);
      
      if (chatForClientData.clientId) {
        try {
          const client = await this.clientsService.findOne(chatForClientData.clientId);
          this.logger.debug(`Client found: ${client ? 'YES' : 'NO'}`);
          
          if (client) {
            this.logger.debug(`Client details - name: ${client.name}, bio length: ${client.bio?.length || 0}`);
            clientContext = this.buildClientContext(client);
            this.logger.debug(`Client context built for ${client.name}: ${clientContext.length} characters`);
            
            if (clientContext.length === 0) {
              this.logger.warn(`Client context is empty for client ${client.name}. Client data might be incomplete.`);
            }
          } else {
            this.logger.warn(`Client with ID ${chatForClientData.clientId} not found in database`);
          }
        } catch (error) {
          this.logger.warn(`Could not fetch client ${chatForClientData.clientId}: ${error.message}`);
        }
      } else {
        this.logger.debug(`No clientId provided for chat ${chatId}`);
      }

      // Log all variables being used in LinkedIn post generation
      this.logger.debug(`LinkedIn post generation variables for chat ${chatId}:
        Thread Length: ${data.thread?.length || 0} characters
        Specific Instructions: ${data.specificInstructions || 'N/A'}
        Client Context Length: ${clientContext.length} characters
        Thread Content Preview: ${data.thread?.substring(0, 200)}...
      `);

      // Step 1: Process the thread
      this.logger.log(`Step 1: Starting thread processing for chat ${chatId}`);

      const step1PromptData = await this.promptsService.renderFullPromptByFeature(
        PromptFeature.LINKEDIN_POST_GENERATION_STEP1,
        {
          thread: data.thread,
          specificInstructions: data.specificInstructions || '',
          clientContext,
        },
      );

      // Log the full prompt for LinkedIn post step 1
      this.logger.debug(`
=== LINKEDIN POST STEP 1 SYSTEM PROMPT ===
${step1PromptData.systemPrompt ? step1PromptData.systemPrompt : '(No system prompt configured)'}
=== END SYSTEM PROMPT ===

=== LINKEDIN POST STEP 1 USER PROMPT ===
${step1PromptData.userPrompt}
=== END USER PROMPT ===

=== FULL COMBINED PROMPT SENT TO AI ===
${step1PromptData.fullPrompt}
=== END FULL PROMPT ===
      `);

      // Refetch chat to avoid version conflicts
      let currentChat = await this.findById(chatId);
      if (!currentChat) {
        throw new Error(`Chat ${chatId} not found during step 1`);
      }

      // Store only the USER prompt in conversation history
      currentChat.conversationHistory.push({
        role: 'user',
        content: step1PromptData.userPrompt,
        timestamp: new Date(),
        isSystemMessage: true, // Hide backend prompts from frontend
        isProcessingStepResponse: false, // Backend prompt, not a response
      });

      // Log the system prompt to verify it's being passed correctly
      const systemPromptToUse = currentChat.systemPrompt || step1PromptData.systemPrompt;
      this.logger.log(`=== LINKEDIN POST STEP 1 SYSTEM PROMPT VERIFICATION ===`);
      this.logger.log(`System prompt length: ${systemPromptToUse?.length || 0}`);
      this.logger.log(`System prompt preview: ${systemPromptToUse?.substring(0, 500)}...`);
      this.logger.log(`=== END LINKEDIN POST SYSTEM PROMPT VERIFICATION ===`);

      // Use conversational method - pass system prompt for step 1
      const step1Response = await this.anthropicService.conversationalHookPolish({
        hook: data.thread, // Using thread as hook since it's the main content
        threadContext: data.specificInstructions,
        research: '', // Not applicable for LinkedIn posts
        angle: '', // Not applicable for LinkedIn posts
        userMessage: step1PromptData.userPrompt,
        systemPrompt: systemPromptToUse, // Pass the system prompt
        conversationHistory: [], // Empty for first step
      });

      this.logger.debug(
        `STEP 1 RESPONSE RECEIVED:\n${JSON.stringify(step1Response, null, 2)}`,
      );

      // Store the raw response
      currentChat.conversationHistory.push({
        role: 'assistant',
        content: step1Response.response,
        timestamp: new Date(),
        isSystemMessage: false,
        isProcessingStepResponse: true, // Mark as processing step response
      });

      // Use findByIdAndUpdate to avoid version conflicts
      await this.linkedInPostChatModel.findByIdAndUpdate(
        chatId,
        {
          $set: {
            conversationHistory: currentChat.conversationHistory,
          },
        },
        { new: true },
      );

      this.logger.log(`Step 1 completed: Thread processing done for chat ${chatId}`);

      // Emit step 1 completion with data
      const step1Data = {
        step: 'processing',
        timestamp: new Date(),
        prompt: step1PromptData.userPrompt,
        response: step1Response.response,
        responseTimestamp: new Date(),
      };
      this.linkedInPostGateway.emitProcessingUpdate(chatId, 'processing', step1Data);

      this.linkedInPostGateway.emitProcessingUpdate(chatId, 'fact-check');

      // Step 2: Fact-check the content
      this.logger.log(`Step 2: Starting fact-check for chat ${chatId}`);

      const step2PromptData = await this.promptsService.renderFullPromptByFeature(
        PromptFeature.LINKEDIN_POST_GENERATION_STEP2_FACT_CHECK,
        {
          thread: data.thread,
          specificInstructions: data.specificInstructions || '',
          clientContext,
        },
      );

      // Log the full prompt for LinkedIn post step 2
      this.logger.debug(`
=== LINKEDIN POST STEP 2 FACT-CHECK SYSTEM PROMPT ===
${step2PromptData.systemPrompt ? step2PromptData.systemPrompt : '(No system prompt configured)'}
=== END SYSTEM PROMPT ===

=== LINKEDIN POST STEP 2 FACT-CHECK USER PROMPT ===
${step2PromptData.userPrompt}
=== END USER PROMPT ===

=== FULL COMBINED PROMPT SENT TO AI ===
${step2PromptData.fullPrompt}
=== END FULL PROMPT ===
      `);

      // Refetch chat again to avoid version conflicts
      currentChat = await this.findById(chatId);
      if (!currentChat) {
        throw new Error(`Chat ${chatId} not found during step 2`);
      }

      // Store only the USER prompt in conversation history
      currentChat.conversationHistory.push({
        role: 'user',
        content: step2PromptData.userPrompt,
        timestamp: new Date(),
        isSystemMessage: true, // Hide backend prompts from frontend
        isProcessingStepResponse: false, // Backend prompt, not a response
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

      // Use conversational method with system prompt for step 2
      const step2Response = await this.anthropicService.conversationalHookPolish({
        hook: data.thread,
        threadContext: data.specificInstructions,
        research: '',
        angle: '',
        userMessage: step2PromptData.userPrompt,
        systemPrompt: currentChat.systemPrompt || step2PromptData.systemPrompt, // Pass the system prompt
        conversationHistory: step2ConversationHistory,
      });

      this.logger.debug(
        `STEP 2 RESPONSE RECEIVED:\n${JSON.stringify(step2Response, null, 2)}`,
      );

      currentChat.conversationHistory.push({
        role: 'assistant',
        content: step2Response.response,
        timestamp: new Date(),
        isSystemMessage: false,
        isProcessingStepResponse: true, // Mark as processing step response
      });

      // Use findByIdAndUpdate to avoid version conflicts
      await this.linkedInPostChatModel.findByIdAndUpdate(
        chatId,
        {
          $set: {
            conversationHistory: currentChat.conversationHistory,
          },
        },
        { new: true },
      );

      this.logger.log(`Step 2 completed: Fact-check done for chat ${chatId}`);

      // Emit step 2 completion with data
      const step2Data = {
        step: 'fact-check',
        timestamp: new Date(),
        prompt: step2PromptData.userPrompt,
        response: step2Response.response,
        responseTimestamp: new Date(),
      };
      this.linkedInPostGateway.emitProcessingUpdate(chatId, 'fact-check', step2Data);

      this.linkedInPostGateway.emitProcessingUpdate(chatId, 'evaluation');

      // Step 3: Evaluate the post
      this.logger.log(`Step 3: Starting evaluation for chat ${chatId}`);

      const step3PromptData = await this.promptsService.renderFullPromptByFeature(
        PromptFeature.LINKEDIN_POST_GENERATION_STEP3_EVALUATE,
        {
          thread: data.thread,
          specificInstructions: data.specificInstructions || '',
          clientContext,
        },
      );

      // Log the full prompt for LinkedIn post step 3
      this.logger.debug(`
=== LINKEDIN POST STEP 3 EVALUATION SYSTEM PROMPT ===
${step3PromptData.systemPrompt ? step3PromptData.systemPrompt : '(No system prompt configured)'}
=== END SYSTEM PROMPT ===

=== LINKEDIN POST STEP 3 EVALUATION USER PROMPT ===
${step3PromptData.userPrompt}
=== END USER PROMPT ===

=== FULL COMBINED PROMPT SENT TO AI ===
${step3PromptData.fullPrompt}
=== END FULL PROMPT ===
      `);

      // Refetch chat again to avoid version conflicts
      currentChat = await this.findById(chatId);
      if (!currentChat) {
        throw new Error(`Chat ${chatId} not found during step 3`);
      }

      // Store only the USER prompt in conversation history
      currentChat.conversationHistory.push({
        role: 'user',
        content: step3PromptData.userPrompt,
        timestamp: new Date(),
        isSystemMessage: true, // Hide backend prompts from frontend
        isProcessingStepResponse: false, // Backend prompt, not a response
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

      // Use conversational method with system prompt for step 3
      const step3Response = await this.anthropicService.conversationalHookPolish({
        hook: data.thread,
        threadContext: data.specificInstructions,
        research: '',
        angle: '',
        userMessage: step3PromptData.userPrompt,
        systemPrompt: currentChat.systemPrompt || step3PromptData.systemPrompt, // Pass the system prompt
        conversationHistory: currentChat.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          isHidden: msg.isHidden,
        })),
      });

      this.logger.debug(
        `STEP 3 RESPONSE RECEIVED:\n${JSON.stringify(step3Response, null, 2)}`,
      );

      currentChat.conversationHistory.push({
        role: 'assistant',
        content: step3Response.response,
        timestamp: new Date(),
        isSystemMessage: false,
        isProcessingStepResponse: true, // Mark as processing step response
      });

      // Use findByIdAndUpdate to avoid version conflicts
      await this.linkedInPostChatModel.findByIdAndUpdate(
        chatId,
        {
          $set: {
            conversationHistory: currentChat.conversationHistory,
          },
        },
        { new: true },
      );

      this.logger.log(`Step 3 completed: Evaluation done for chat ${chatId}`);

      // Emit step 3 completion with data
      const step3Data = {
        step: 'evaluation',
        timestamp: new Date(),
        prompt: step3PromptData.userPrompt,
        response: step3Response.response,
        responseTimestamp: new Date(),
      };
      this.linkedInPostGateway.emitProcessingUpdate(chatId, 'evaluation', step3Data);

      this.linkedInPostGateway.emitProcessingUpdate(chatId, 'optimization');

      // Step 4: Apply changes/optimization
      this.logger.log(`Step 4: Starting optimization for chat ${chatId}`);

      const step4PromptData = await this.promptsService.renderFullPromptByFeature(
        PromptFeature.LINKEDIN_POST_GENERATION_STEP4_OPTIMIZE,
        {
          thread: data.thread,
          specificInstructions: data.specificInstructions || '',
          clientContext,
        },
      );

      // Log the full prompt for LinkedIn post step 4
      this.logger.debug(`
=== LINKEDIN POST STEP 4 OPTIMIZATION SYSTEM PROMPT ===
${step4PromptData.systemPrompt ? step4PromptData.systemPrompt : '(No system prompt configured)'}
=== END SYSTEM PROMPT ===

=== LINKEDIN POST STEP 4 OPTIMIZATION USER PROMPT ===
${step4PromptData.userPrompt}
=== END USER PROMPT ===

=== FULL COMBINED PROMPT SENT TO AI ===
${step4PromptData.fullPrompt}
=== END FULL PROMPT ===
      `);

      // Refetch chat again to avoid version conflicts
      currentChat = await this.findById(chatId);
      if (!currentChat) {
        throw new Error(`Chat ${chatId} not found during step 4`);
      }

      // Store only the USER prompt in conversation history
      currentChat.conversationHistory.push({
        role: 'user',
        content: step4PromptData.userPrompt,
        timestamp: new Date(),
        isSystemMessage: true, // Hide backend prompts from frontend
        isProcessingStepResponse: false, // Backend prompt, not a response
      });

      // Debug: Log conversation history being passed to step 4 (what actually gets sent to Claude)
      const step4ConversationHistory = currentChat.conversationHistory
        .filter(msg => !msg.isHidden && msg.role !== 'system') // Same filtering as in AnthropicService
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
      
      this.logger.debug(`Step 4 - Conversation history being passed to Claude (filtered):
        Total messages: ${step4ConversationHistory.length}
        Messages: ${JSON.stringify(step4ConversationHistory.map(msg => ({
          role: msg.role,
          contentLength: msg.content.length,
          contentPreview: msg.content.substring(0, 100) + '...'
        })), null, 2)}
      `);

      // Use conversational method with system prompt for step 4
      const step4Response = await this.anthropicService.conversationalHookPolish({
        hook: data.thread,
        threadContext: data.specificInstructions,
        research: '',
        angle: '',
        userMessage: step4PromptData.userPrompt,
        systemPrompt: currentChat.systemPrompt || step4PromptData.systemPrompt, // Pass the system prompt
        conversationHistory: currentChat.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          isHidden: msg.isHidden,
        })),
      });

      this.logger.debug(
        `STEP 4 RESPONSE RECEIVED:\n${JSON.stringify(step4Response, null, 2)}`,
      );

      currentChat.conversationHistory.push({
        role: 'assistant',
        content: step4Response.response,
        timestamp: new Date(),
        isSystemMessage: false,
        isProcessingStepResponse: true, // Mark as processing step response
      });

      currentChat.lastActivity = new Date();
      currentChat.processingComplete = true;

      // Use findByIdAndUpdate to avoid version conflicts
      await this.linkedInPostChatModel.findByIdAndUpdate(
        chatId,
        {
          $set: {
            conversationHistory: currentChat.conversationHistory,
            lastActivity: currentChat.lastActivity,
            processingComplete: currentChat.processingComplete,
          },
        },
        { new: true },
      );

      this.logger.log(`Step 4 completed: Optimization done for chat ${chatId}`);

      // Emit step 4 completion with data
      const step4Data = {
        step: 'optimization',
        timestamp: new Date(),
        prompt: step4PromptData.userPrompt,
        response: step4Response.response,
        responseTimestamp: new Date(),
      };
      this.linkedInPostGateway.emitProcessingUpdate(chatId, 'optimization', step4Data);

      // Emit final completion
      this.linkedInPostGateway.emitProcessingUpdate(chatId, 'complete');

      this.logger.log(`LinkedIn post processing completed for chat: ${chatId}`);
    } catch (error) {
      this.logger.error(`Error in executeChainedPrompts for chat ${chatId}:`, error);
      throw error;
    }
  }

  async sendMessage(chatId: string, message: string): Promise<string> {
    try {
      const chat = await this.linkedInPostChatModel.findById(chatId);
      
      if (!chat) {
        throw new Error('LinkedIn post chat not found');
      }

      // Add user message
      chat.conversationHistory.push({
        role: 'user',
        content: message,
        timestamp: new Date(),
        isSystemMessage: false,
        isProcessingStepResponse: false,
      });

      // Prepare conversation history for AI (exclude hidden system messages)
      const conversationForAI = chat.conversationHistory
        .filter(msg => !msg.isHidden)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Use the new conversational method with system prompt
      const aiResponse = await this.anthropicService.conversationalLinkedInPostChat({
        userMessage: message,
        conversationHistory: conversationForAI,
        systemPrompt: chat.systemPrompt || '', // Pass the stored system prompt
      });

      // Add AI response (show it in frontend for conversational interactions)
      chat.conversationHistory.push({
        role: 'assistant',
        content: aiResponse.response,
        timestamp: new Date(),
        isSystemMessage: false, // Show conversational AI responses in frontend
        isProcessingStepResponse: false, // Regular conversation, not processing step
      });

      chat.lastActivity = new Date();
      await chat.save();
      
      return aiResponse.response;
    } catch (error) {
      this.logger.error(`Error in sendMessage for chat ${chatId}:`, error);
      throw error;
    }
  }

  private buildClientContext(client: any): string {
    const contextParts: string[] = [];
    
    this.logger.debug(`[BUILD CLIENT CONTEXT] Processing client: ${client.name}`);
    this.logger.debug(`[BUILD CLIENT CONTEXT] Client fields - name: ${!!client.name}, industry: ${!!client.industry}, bio: ${!!client.bio}, businessInfo: ${!!client.businessInfo}, voice: ${!!client.voice}, voiceAnalysis: ${!!client.voiceAnalysis}, tags: ${client.tags?.length || 0}, nicheTags: ${client.nicheTags?.length || 0}, goals: ${!!client.goals}, website: ${!!client.website}`);
    
    if (client.name) {
      contextParts.push(`Client Name: ${client.name}`);
    }
    
    if (client.industry) {
      contextParts.push(`Industry: ${client.industry}`);
    }
    
    if (client.bio) {
      contextParts.push(`Bio: ${client.bio}`);
    }
    
    if (client.businessInfo) {
      contextParts.push(`Business Info: ${client.businessInfo}`);
    }
    
    if (client.voice) {
      contextParts.push(`Voice & Tone: ${client.voice}`);
    }
    
    if (client.voiceAnalysis) {
      contextParts.push(`Voice Analysis: ${client.voiceAnalysis}`);
    }
    
    if (client.tags && client.tags.length > 0) {
      contextParts.push(`Tags: ${client.tags.join(', ')}`);
    }
    
    if (client.nicheTags && client.nicheTags.length > 0) {
      contextParts.push(`Niche Tags: ${client.nicheTags.join(', ')}`);
    }
    
    if (client.goals) {
      contextParts.push(`Goals: ${client.goals}`);
    }
    
    if (client.website) {
      contextParts.push(`Website: ${client.website}`);
    }
    
    const finalContext = contextParts.join('\n');
    this.logger.debug(`[BUILD CLIENT CONTEXT] Final context parts: ${contextParts.length}, total length: ${finalContext.length}`);
    
    return finalContext;
  }

  async deleteChat(id: string): Promise<{ success: boolean; message: string; unlinkedChats?: string[] }> {
    try {
      const chat = await this.findById(id);
      if (!chat) {
        throw new Error('LinkedIn post chat not found');
      }

      const unlinkedChats: string[] = [];

      // If this chat was linked to a thread, we don't delete the thread but just note the unlinking
      if (chat.threadId) {
        unlinkedChats.push(`Thread ${chat.threadId}`);
        this.logger.debug(`LinkedIn post chat ${id} was linked to thread ${chat.threadId}, will be unlinked`);
      }

      // Delete the LinkedIn post chat
      await this.linkedInPostChatModel.findByIdAndDelete(id);

      this.logger.log(`LinkedIn post chat ${id} deleted successfully`);

      return {
        success: true,
        message: 'LinkedIn post chat deleted successfully',
        unlinkedChats: unlinkedChats.length > 0 ? unlinkedChats : undefined,
      };
    } catch (error) {
      this.logger.error(`Error deleting LinkedIn post chat ${id}: ${error.message}`, error.stack);
      throw error;
    }
  }
} 