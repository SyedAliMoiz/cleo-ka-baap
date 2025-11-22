import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { AnthropicService } from '../ai/services/anthropic.service';
import { ConfigService } from '@nestjs/config';
import {
  GenerateThreadRequestDto,
  GenerateThreadResponseDto,
  RegeneratePostRequestDto,
  RegeneratePostResponseDto,
  ConversationalEditRequestDto,
  ConversationalEditResponseDto,
  MessageDto,
  ThreadPostDto,
  SaveThreadRequestDto,
  SaveThreadResponseDto,
} from './dto/thread-writer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ThreadWriterChat,
  ThreadWriterChatDocument,
} from './schemas/thread-writer-chat.schema';
import { PromptsService } from '../prompts/prompts.service';
import { ClientsService } from '../clients/clients.service';
import { PromptFeature } from '../prompts/schemas/prompt.schema';
import { ThreadWriterGateway } from './gateways/thread-writer.gateway';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ThreadWriterService {
  private readonly logger = new Logger(ThreadWriterService.name);

  constructor(
    private readonly anthropicService: AnthropicService,
    private readonly configService: ConfigService,
    private readonly promptsService: PromptsService,
    private readonly clientsService: ClientsService,
    @InjectModel(ThreadWriterChat.name) private threadWriterChatModel: Model<ThreadWriterChatDocument>,
    @Inject(forwardRef(() => ThreadWriterGateway))
    private readonly threadWriterGateway: ThreadWriterGateway,
  ) {}

  /**
   * Generate a complete X thread based on the provided data
   * @param generateThreadRequest The thread generation request
   * @returns Promise with the generated thread as a single text
   */
  async generateThread(
    generateThreadRequest: GenerateThreadRequestDto,
  ): Promise<GenerateThreadResponseDto> {
    try {
      const {
        topic,
        clientId,
        research,
        selectedArticle,
        selectedAngle,
        selectedHook,
      } = generateThreadRequest;
      const maxTokens = generateThreadRequest.maxTokens || 2048;
      const temperature = generateThreadRequest.temperature || 0.7;

      this.logger.log(
        `Generating thread for topic '${topic}' with angle '${selectedAngle?.title}' and hook '${selectedHook?.text.substring(0, 30)}...'`,
      );

      // Fetch the client information from the database
      const client = await this.clientsService.findOne(clientId);

      // Map the client data to the format needed for prompts
      const clientInfo = {
        id: client['_id'].toString(),
        name: client.name,
        bio: client.bio,
        nicheTags: client.nicheTags,
        businessInfo: client.businessInfo,
        industry: client.company, // Map company to industry
        voice: client.voice,
      };

      this.logger.debug(
        `Fetched client info for ID ${clientId}: ${JSON.stringify(clientInfo)}`,
      );

      // Prepare variables for the prompt template
      const variables = {
        hook: selectedHook.text,
        research: research,
        clientVoice: clientInfo.voice,
        topic: topic,
        articleTitle: selectedArticle?.title || '',
        articleUrl: selectedArticle?.url || '',
        articleSummary: selectedArticle?.summary || '',
        articlePublishedAt: selectedArticle?.publishedAt || '',
        articleSource: selectedArticle?.source || '',
        angleTitle: selectedAngle?.title || '',
        angleExplanation: selectedAngle?.explanation || '',
        clientName: clientInfo?.name || '',
        clientBio: clientInfo?.bio || '',
        clientBusinessInfo: clientInfo?.businessInfo || '',
        clientIndustry: clientInfo?.industry || '',
        clientNicheTags: clientInfo?.nicheTags?.join(', ') || '',
      };

      // Use database-driven prompts via PromptsService
      const promptData = await this.promptsService.renderFullPromptByFeature(
        PromptFeature.GENERATE_THREAD,
        variables,
      );

      this.logger.debug(
        `Generated thread prompt with length: ${promptData.userPrompt.length}`,
      );

      // Log all variables being sent to Claude API
      this.logger.debug(`Sending to Claude API for thread generation:
        Topic: ${topic}
        Client Name: ${clientInfo.name}
        Client Bio: ${clientInfo.bio?.substring(0, 50)}...
        Client Business Info: ${clientInfo.businessInfo?.substring(0, 50)}...
        Client Industry: ${clientInfo.industry || 'N/A'}
        Client Voice: ${clientInfo.voice?.substring(0, 50) || 'N/A'}...
        Selected Angle: ${selectedAngle.title}
        Selected Hook: ${selectedHook.text.substring(0, 50)}...
        Research Length: ${research.length} characters
        Selected Article: ${selectedArticle ? selectedArticle.title : 'None'}
        Max Tokens: ${maxTokens}
        Temperature: ${temperature}
      `);

      // Log the full prompt for thread generation
      this.logger.debug(`
=== THREAD GENERATION SYSTEM PROMPT ===
${promptData.systemPrompt ? promptData.systemPrompt : '(No system prompt configured)'}
=== END SYSTEM PROMPT ===

=== THREAD GENERATION USER PROMPT ===
${promptData.userPrompt}
=== END USER PROMPT ===

=== FULL COMBINED PROMPT SENT TO AI ===
${promptData.fullPrompt}
=== END FULL PROMPT ===
      `);

      // Call Claude to generate the thread using the proper API method with separate system prompt
      const response = await this.anthropicService.createThread({
        messages: [{ role: 'user', content: promptData.userPrompt }],
        system: promptData.systemPrompt,
        maxTokens,
        temperature,
      });

      // Return the thread text directly from Claude's response
      return { thread: response.content[0].text.trim() };
    } catch (error) {
      this.logger.error(
        `Error generating thread: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Regenerate an entire thread
   * @param regeneratePostRequest The thread regeneration request
   * @returns The regenerated thread content
   */
  async regeneratePost(
    regeneratePostRequest: RegeneratePostRequestDto,
  ): Promise<RegeneratePostResponseDto> {
    try {
      const { threadData } = regeneratePostRequest;

      this.logger.log(
        `Regenerating thread for topic '${threadData.topic}' with client ID '${threadData.clientId}'`,
      );

      // Use the same approach as generate thread but regenerate the content
      return this.generateThread(threadData);
    } catch (error) {
      this.logger.error(
        `Error regenerating thread: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Edit a thread conversationally based on user messages
   * @param conversationalEditRequest The conversational edit request
   * @returns The updated thread and conversation
   */
  async conversationalThreadEdit(
    conversationalEditRequest: ConversationalEditRequestDto,
  ): Promise<ConversationalEditResponseDto> {
    try {
      const { threadData, thread, userMessage, conversationHistory } =
        conversationalEditRequest;

      // Fetch the client information from the database
      const client = await this.clientsService.findOne(threadData.clientId);

      // Map the client data to the format needed for prompts
      const clientInfo = {
        id: client['_id'].toString(),
        name: client.name,
        bio: client.bio,
        nicheTags: client.nicheTags,
        businessInfo: client.businessInfo,
        industry: client.company, // Map company to industry
        voice: client.voice,
      };

      this.logger.debug(`Fetched client info for ID ${threadData.clientId}`);

      // Log all variables being sent to Claude API
      this.logger.debug(`Sending to Claude API for conversational edit:
        Topic: ${threadData.topic}
        Client ID: ${threadData.clientId}
        Selected Angle: ${threadData.selectedAngle.title}
        Selected Hook: ${threadData.selectedHook.text.substring(0, 50)}...
        Thread Length: ${thread.length} characters
        User Message: ${userMessage}
        Conversation History: ${conversationHistory.length} messages
      `);

      // Prepare conversation messages and system prompt
      let messages: any[] = [];
      let systemPrompt: string;
      let promptData: any; // Declare at function level for later use
      
      // If conversation history is provided, extract system prompt from it
      if (conversationHistory && conversationHistory.length > 0) {
        // Extract system prompt from stored conversation history
        const systemMessage = conversationHistory.find(msg => msg.role === 'system' && msg.isHidden);
        if (!systemMessage) {
          throw new Error('System prompt not found in conversation history - thread may be corrupted');
        }
        systemPrompt = systemMessage.content;
        
        // Map existing conversation, excluding hidden messages
        messages = conversationHistory
          .filter(msg => !msg.isHidden) // Only include visible messages
          .map((msg: MessageDto) => ({
            role: msg.role,
            content: msg.content,
          }));
        
        this.logger.debug(
          `Using stored system prompt and existing conversation history with ${messages.length} messages for Claude context`,
        );
      } else {
        // First conversation - generate system prompt and recreate the original thread generation context
        const variables = {
          hook: threadData.selectedHook.text,
          research: threadData.research,
          clientVoice: clientInfo.voice,
          topic: threadData.topic,
          articleTitle: threadData.selectedArticle?.title || '',
          articleUrl: threadData.selectedArticle?.url || '',
          articleSummary: threadData.selectedArticle?.summary || '',
          articlePublishedAt: threadData.selectedArticle?.publishedAt || '',
          articleSource: threadData.selectedArticle?.source || '',
          angleTitle: threadData.selectedAngle?.title || '',
          angleExplanation: threadData.selectedAngle?.explanation || '',
          clientName: clientInfo?.name || '',
          clientBio: clientInfo?.bio || '',
          clientBusinessInfo: clientInfo?.businessInfo || '',
          clientIndustry: clientInfo?.industry || '',
          clientNicheTags: clientInfo?.nicheTags?.join(', ') || '',
        };

        promptData = await this.promptsService.renderFullPromptByFeature(
          PromptFeature.GENERATE_THREAD,
          variables,
        );
        
        systemPrompt = promptData.systemPrompt;
        
        // Add the original thread generation prompt as the first message
        messages.push({
          role: 'user',
          content: promptData.userPrompt,
        });

        // Add Claude's original response (the generated thread) as the second message
        messages.push({
          role: 'assistant',
          content: thread,
        });
      }

      // Add the user's new message
      messages.push({
        role: 'user',
        content: userMessage,
      });

      this.logger.debug(
        `Sending ${messages.length} messages to Claude for conversational edit with ${conversationHistory && conversationHistory.length > 0 ? 'stored' : 'generated'} system prompt`,
      );
      
      // Log all messages being sent to Claude for debugging
      this.logger.debug('=== MESSAGES BEING SENT TO CLAUDE ===');
      this.logger.debug(`System Prompt (passed separately): ${systemPrompt.substring(0, 150)}...`);
      messages.forEach((msg, index) => {
        this.logger.debug(`Message ${index + 1} (${msg.role}): ${msg.content.substring(0, 150)}...`);
      });
      this.logger.debug('=== END MESSAGES TO CLAUDE ===');

      const response = await this.anthropicService.createThread({
        messages: messages,
        system: systemPrompt,
        maxTokens: 2048,
        temperature: 0.7,
      });

      const assistantResponse = response.content[0].text;

      // Update conversation history
      let updatedHistory: MessageDto[];
      
      if (!conversationHistory || conversationHistory.length === 0) {
        // First conversation - include both system and user prompts as hidden, and the conversation
        // Note: We already have promptData from the else block above where it was generated
        updatedHistory = [
          { role: 'system', content: systemPrompt, isHidden: true }, // System prompt, hidden from frontend
          { role: 'user', content: promptData.userPrompt, isHidden: true }, // User prompt, hidden from frontend
          { role: 'assistant', content: thread }, // Generated thread should be visible, not hidden
          { role: 'user', content: userMessage },
          { role: 'assistant', content: assistantResponse },
        ];
      } else {
        // Continuing conversation - add user message and assistant response
        updatedHistory = [
        ...conversationHistory,
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantResponse },
      ];
      }

      return {
        response: assistantResponse,
        thread: assistantResponse.trim(),
        conversationHistory: updatedHistory,
      };
    } catch (error) {
      this.logger.error(
        `Error in conversational thread edit: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Create a new thread writer chat for chained prompts workflow
   * @param data The thread generation data
   * @returns Promise with the created chat document
   */
  async createThreadWriterChat(data: {
    topic: string;
    clientId: string;
    research: string;
    selectedArticle?: any;
    selectedAngle?: any;
    selectedHook?: any;
  }): Promise<ThreadWriterChatDocument> {
    // Fetch the client information
    const client = await this.clientsService.findOne(data.clientId);

    // Prepare variables for the first step prompt
    const variables = {
      hook: data.selectedHook?.text || '',
      research: data.research,
      clientVoice: client.voice || '',
      topic: data.topic,
      articleTitle: data.selectedArticle?.title || '',
      articleUrl: data.selectedArticle?.url || '',
      articleSummary: data.selectedArticle?.summary || '',
      articlePublishedAt: data.selectedArticle?.publishedAt || '',
      articleSource: data.selectedArticle?.source || '',
      angleTitle: data.selectedAngle?.title || '',
      angleExplanation: data.selectedAngle?.explanation || '',
      clientName: client.name || '',
      clientBio: client.bio || '',
      clientBusinessInfo: client.businessInfo || '',
      clientIndustry: client.company || '',
      clientNicheTags: client.nicheTags?.join(', ') || '',
    };

    // Generate the system and user prompts for step 1
    const step1PromptData = await this.promptsService.renderFullPromptByFeature(
      PromptFeature.THREAD_GENERATION_STEP1,
      variables,
    );

    // Store both system and user prompts as hidden messages from the start
    const initialConversationHistory = [
      {
        role: 'system' as const,
        content: step1PromptData.systemPrompt,
        timestamp: new Date(),
        isSystemMessage: true,
        isProcessingStepResponse: false,
        isHidden: true,
      },
      {
        role: 'user' as const,
        content: step1PromptData.userPrompt,
        timestamp: new Date(),
        isSystemMessage: true,
        isProcessingStepResponse: false,
        isHidden: true,
      },
    ];

    const chat = new this.threadWriterChatModel({
      topic: data.topic,
      clientId: data.clientId,
      research: data.research,
      selectedArticle: data.selectedArticle,
      selectedAngle: data.selectedAngle,
      selectedHook: data.selectedHook,
      conversationHistory: initialConversationHistory,
      lastActivity: new Date(),
    });

    const savedChat = await chat.save();
    const chatId = (savedChat as any)._id.toString();

    this.logger.debug(
      `Thread writer chat created with ID: ${chatId}. System and user prompts stored in conversation history.`,
    );

    return savedChat;
  }

  /**
   * Execute the 5-step chained prompts for thread generation
   * @param chat The thread writer chat document
   * @param data The thread generation data
   * @param chatId The chat ID
   */
  private async executeChainedPrompts(
    chat: ThreadWriterChatDocument,
    data: {
      topic: string;
      clientId: string;
      research: string;
      selectedArticle?: any;
      selectedAngle?: any;
      selectedHook?: any;
    },
    chatId: string,
  ): Promise<void> {
    try {
      this.logger.log(`Starting chained prompts execution for thread chat ${chatId}`);

      // Fetch the client information
      const client = await this.clientsService.findOne(data.clientId);

      // Prepare variables for all steps
      const baseVariables = {
        hook: data.selectedHook?.text || '',
        research: data.research,
        clientVoice: client.voice || '',
        topic: data.topic,
        articleTitle: data.selectedArticle?.title || '',
        articleUrl: data.selectedArticle?.url || '',
        articleSummary: data.selectedArticle?.summary || '',
        articlePublishedAt: data.selectedArticle?.publishedAt || '',
        articleSource: data.selectedArticle?.source || '',
        angleTitle: data.selectedAngle?.title || '',
        angleExplanation: data.selectedAngle?.explanation || '',
        clientName: client.name || '',
        clientBio: client.bio || '',
        clientBusinessInfo: client.businessInfo || '',
        clientIndustry: client.company || '',
        clientNicheTags: client.nicheTags?.join(', ') || '',
      };

      // Step 1: Thread Generation
      this.threadWriterGateway.emitProcessingUpdate(chatId, 'thread-generation');
      await this.executeStep(chatId, 1, PromptFeature.THREAD_GENERATION_STEP1, baseVariables);

      // Step 2: Fact Checker
      await this.executeStep(chatId, 2, PromptFeature.THREAD_GENERATION_STEP2_FACT_CHECK, baseVariables);

      // Step 3: Apply Transition
      await this.executeStep(chatId, 3, PromptFeature.THREAD_GENERATION_STEP3_APPLY_TRANSITION, baseVariables);

      // Step 4: Evaluate Thread
      await this.executeStep(chatId, 4, PromptFeature.THREAD_GENERATION_STEP4_EVALUATE_THREAD, baseVariables);

      // Step 5: Apply Changes (final thread)
      await this.executeStep(chatId, 5, PromptFeature.THREAD_GENERATION_STEP5_APPLY_CHANGES, baseVariables);

      // Mark processing as complete
      await this.threadWriterChatModel.findByIdAndUpdate(
        chatId,
        { $set: { processingComplete: true } },
        { new: true },
      );

      // Emit processing complete
      this.threadWriterGateway.emitProcessingComplete(chatId);

      this.logger.log(`All chained prompts completed for thread chat ${chatId}`);
    } catch (error) {
      this.logger.error(
        `Error executing chained prompts for thread chat ${chatId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Execute a single step in the chained prompts workflow
   * @param chatId The chat ID
   * @param stepNumber The step number (1-5)
   * @param promptFeature The prompt feature to use
   * @param variables The variables for the prompt
   */
  private async executeStep(
    chatId: string,
    stepNumber: number,
    promptFeature: PromptFeature,
    variables: any,
  ): Promise<void> {
    this.logger.log(`Step ${stepNumber}: Starting for thread chat ${chatId}`);

    // Get step names for WebSocket updates
    const stepNames = {
      1: 'thread-generation',
      2: 'fact-check', 
      3: 'apply-transition',
      4: 'evaluate-thread',
      5: 'apply-changes'
    };

    const stepTitles = {
      1: 'Thread Generation',
      2: 'Fact Checker',
      3: 'Apply Transition', 
      4: 'Evaluate Thread',
      5: 'Apply Changes'
    };

    // Emit that this step is starting (but only for steps 2-5, step 1 is handled in executeChainedPrompts)
    if (stepNumber > 1) {
      this.threadWriterGateway.emitProcessingUpdate(
        chatId,
        stepNames[stepNumber] as any,
      );
    }

    const promptData = await this.promptsService.renderFullPromptByFeature(
      promptFeature,
      variables,
    );

    // Log complete prompt details for step 1 to verify client context injection
    if (stepNumber === 1) {
      this.logger.log(`=== STEP 1 COMPLETE PROMPT LOGGING FOR CHAT ${chatId} ===`);
      this.logger.log(`Client Context Variables:`);
      this.logger.log(`- Client Name: ${variables.clientName}`);
      this.logger.log(`- Client Voice: ${variables.clientVoice}`);
      this.logger.log(`- Client Bio: ${variables.clientBio}`);
      this.logger.log(`- Client Business Info: ${variables.clientBusinessInfo}`);
      this.logger.log(`- Client Industry: ${variables.clientIndustry}`);
      this.logger.log(`- Client Niche Tags: ${variables.clientNicheTags}`);
      this.logger.log(`Topic: ${variables.topic}`);
      this.logger.log(`Hook: ${variables.hook}`);
      this.logger.log(`Article Title: ${variables.articleTitle}`);
      this.logger.log(`Angle Title: ${variables.angleTitle}`);
      this.logger.log(`Angle Explanation: ${variables.angleExplanation}`);
      this.logger.log(`Research (first 500 chars): ${variables.research?.substring(0, 500)}...`);
      this.logger.log(`=== RENDERED SYSTEM PROMPT ===`);
      this.logger.log(promptData.systemPrompt);
      this.logger.log(`=== RENDERED USER PROMPT ===`);
      this.logger.log(promptData.userPrompt);
      this.logger.log(`=== END STEP 1 PROMPT LOGGING ===`);
    }

    // Refetch chat to avoid version conflicts
    let currentChat = await this.findThreadWriterChatById(chatId);
    if (!currentChat) {
      throw new Error(`Thread chat ${chatId} not found during step ${stepNumber}`);
    }

    // For steps 2-5, add the user prompt as hidden
    if (stepNumber > 1) {
      currentChat.conversationHistory.push({
        role: 'user',
        content: promptData.userPrompt,
        timestamp: new Date(),
        isSystemMessage: true,
        isProcessingStepResponse: false,
        isHidden: true,
      });
    }

    // Retrieve the stored system prompt from conversation history
    const systemMessage = currentChat.conversationHistory.find(
      msg => msg.role === 'system' && msg.isHidden
    );
    
    if (!systemMessage) {
      throw new Error('System prompt not found in conversation history - thread may be corrupted');
    }

    // Call Claude with the conversational context
    const response = await this.anthropicService.conversationalHookPolish({
      hook: variables.hook,
      threadContext: variables.research,
      research: variables.research,
      angle: variables.angleTitle,
      userMessage: promptData.userPrompt,
      systemPrompt: systemMessage.content,
      conversationHistory: currentChat.conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
        isHidden: msg.isHidden,
      })),
    });

    // Add AI response
    currentChat.conversationHistory.push({
      role: 'assistant',
      content: response.response,
      timestamp: new Date(),
      isSystemMessage: false,
      isProcessingStepResponse: true,
      isHidden: false,
    });

    // If this is the final step, store the generated thread
    if (stepNumber === 5) {
      currentChat.generatedThread = response.response;
    }

    // Save the updated chat
    await this.threadWriterChatModel.findByIdAndUpdate(
      chatId,
      {
        $set: {
          conversationHistory: currentChat.conversationHistory,
          generatedThread: currentChat.generatedThread,
        },
      },
      { new: true },
    );

    // Emit WebSocket update for this step
    const processingStepData = {
      step: stepNames[stepNumber], // Send the step identifier, not the title
      stepNumber: stepNumber,
      response: response.response, // Use 'response' for consistency with hook polisher
      timestamp: new Date(),
    };

    this.threadWriterGateway.emitProcessingUpdate(
      chatId,
      stepNames[stepNumber] as any,
      processingStepData,
    );

    this.logger.log(`Step ${stepNumber} completed for thread chat ${chatId}`);
  }

  /**
   * Find a thread writer chat by ID
   * @param id The chat ID
   * @returns The thread writer chat document or null
   */
  async findThreadWriterChatById(id: string): Promise<ThreadWriterChatDocument | null> {
    return this.threadWriterChatModel.findById(id);
  }

  /**
   * Get all thread writer chats
   * @returns List of all thread writer chats
   */
  async getAllThreadWriterChats(): Promise<ThreadWriterChatDocument[]> {
    return this.threadWriterChatModel.find().sort({ lastActivity: -1, createdAt: -1 });
  }

  /**
   * Delete a thread writer chat by ID
   * @param id The chat ID
   */
  async deleteThreadWriterChat(id: string): Promise<void> {
    const result = await this.threadWriterChatModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Thread writer chat not found');
    }
  }

  /**
   * Trigger chained prompts for a thread writer chat
   * @param chatId The chat ID
   * @param data The thread generation data
   */
  async triggerChainedPrompts(
    chatId: string,
    data: {
      topic: string;
      clientId: string;
      research: string;
      selectedArticle?: any;
      selectedAngle?: any;
      selectedHook?: any;
    },
  ): Promise<void> {
    this.logger.debug(`Triggering chained prompts for thread chat ${chatId}`);
    const chat = await this.findThreadWriterChatById(chatId);
    if (!chat) {
      this.logger.error(
        `Thread chat ${chatId} not found when triggering chained prompts`,
      );
      throw new Error('Thread chat not found');
    }

    // Execute chained prompts in background
    this.executeChainedPrompts(chat, data, chatId).catch((error) => {
      this.logger.error(
        `Error in background chained prompts for thread chat ${chatId}: ${error.message}`,
        error.stack,
      );
    });
  }

  /**
   * Add a conversational message to a thread writer chat
   * @param id The chat ID
   * @param message The user message
   * @returns The AI response
   */
  async addMessageToThreadWriterChat(
    id: string,
    message: string,
  ): Promise<{ response: string }> {
    const chat = await this.findThreadWriterChatById(id);
    if (!chat) {
      throw new Error('Thread chat not found');
    }

    // Add user message
    chat.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      isSystemMessage: false,
      isProcessingStepResponse: false,
      isHidden: false,
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
      hook: (chat.selectedHook as any)?.text || '',
      threadContext: chat.research,
      research: chat.research,
      angle: (chat.selectedAngle as any)?.title || '',
      userMessage: message,
      systemPrompt: systemMessage.content,
      conversationHistory: conversationContext,
    });

    // Add AI response
    chat.conversationHistory.push({
      role: 'assistant',
      content: aiResponse.response,
      timestamp: new Date(),
      isSystemMessage: false,
      isProcessingStepResponse: false,
      isHidden: false,
    });

    chat.lastActivity = new Date();
    await chat.save();

    return { response: aiResponse.response };
  }
}
