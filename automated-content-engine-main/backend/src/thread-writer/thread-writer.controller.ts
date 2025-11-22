import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
} from '@nestjs/common';
import { ThreadWriterService } from './thread-writer.service';
import {
  ConversationalEditRequestDto,
  ConversationalEditResponseDto,
  GenerateThreadRequestDto,
  GenerateThreadResponseDto,
  RegeneratePostRequestDto,
  RegeneratePostResponseDto,
  SaveThreadRequestDto,
  SaveThreadResponseDto,
} from './dto/thread-writer.dto';
import { NewsService } from '../news/news.service';
import { NewsRequestDto, NewsResponseDto } from '../news/dto/news.dto';
import { ClientsService } from '../clients/clients.service';

@Controller('api/thread-writer')
export class ThreadWriterController {
  private readonly logger = new Logger(ThreadWriterController.name);

  constructor(
    private readonly threadWriterService: ThreadWriterService,
    private readonly newsService: NewsService,
    private readonly clientsService: ClientsService,
  ) {}

  /**
   * Generate a complete X thread
   * @param generateThreadRequestDto The thread generation request
   * @returns Thread with multiple posts
   */
  @Post('thread')
  async generateThread(
    @Body() generateThreadRequestDto: GenerateThreadRequestDto,
  ): Promise<GenerateThreadResponseDto> {
    try {
      this.logger.log(
        `Generating thread for topic: ${generateThreadRequestDto.topic}`,
      );
      return await this.threadWriterService.generateThread(
        generateThreadRequestDto,
      );
    } catch (error) {
      this.logger.error(
        `Error generating thread: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to generate thread: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Regenerate a specific post in a thread
   * @param regeneratePostRequestDto The post regeneration request
   * @returns The regenerated post content
   */
  @Post('regenerate-post')
  async regeneratePost(
    @Body() regeneratePostRequestDto: RegeneratePostRequestDto,
  ): Promise<RegeneratePostResponseDto> {
    try {
      this.logger.log(
        `Regenerating thread for topic: ${regeneratePostRequestDto.threadData.topic}`,
      );
      return await this.threadWriterService.regeneratePost(
        regeneratePostRequestDto,
      );
    } catch (error) {
      this.logger.error(
        `Error regenerating post: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to regenerate post: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Edit a thread conversationally
   * @param conversationalEditRequestDto The conversational edit request
   * @returns Updated thread and conversation
   */
  @Post('conversational-edit')
  async conversationalThreadEdit(
    @Body() conversationalEditRequestDto: ConversationalEditRequestDto,
  ): Promise<ConversationalEditResponseDto> {
    try {
      this.logger.log(
        `Processing conversational edit for topic: ${conversationalEditRequestDto.threadData.topic}`,
      );
      return await this.threadWriterService.conversationalThreadEdit(
        conversationalEditRequestDto,
      );
    } catch (error) {
      this.logger.error(
        `Error processing conversational edit: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to process conversational edit: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create a new thread writer chat for chained prompts workflow
   * @param createChatDto The thread generation data
   * @returns The created chat ID
   */
  @Post('chats/create')
  async createThreadWriterChat(@Body() createChatDto: {
    topic: string;
    clientId: string;
    research: string;
    selectedArticle?: any;
    selectedAngle?: any;
    selectedHook?: any;
  }): Promise<{ chatId: string }> {
    try {
      this.logger.log(
        `Creating thread writer chat for topic: ${createChatDto.topic}`,
      );
      const chat = await this.threadWriterService.createThreadWriterChat(createChatDto);
      return { chatId: (chat as any)._id.toString() };
    } catch (error) {
      this.logger.error(
        `Error creating thread writer chat: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to create thread writer chat: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all thread writer chats
   * @returns List of all thread writer chats
   */
  @Get('chats')
  async getAllThreadWriterChats(): Promise<any[]> {
    try {
      this.logger.log('Getting all thread writer chats');
      const chats = await this.threadWriterService.getAllThreadWriterChats();
      this.logger.debug(`Retrieved ${chats.length} thread writer chats`);
      
      // Transform raw chat data to frontend-expected format
      const formattedChats = await Promise.all(chats.map(async (chat) => {
        let clientName = 'Thread Writer Chat';
        let clientId = chat.clientId || 'unknown';
        
        // Look up client name if clientId exists
        if (chat.clientId) {
          try {
            const client = await this.clientsService.findOne(chat.clientId);
            clientName = client.name;
          } catch (error) {
            this.logger.warn(`Could not find client ${chat.clientId}: ${error.message}`);
          }
        }
        
        return {
          _id: chat._id,
          title: `Thread: ${chat.topic}`,
          clientId,
          clientName,
          tweets: chat.generatedThread ? 
            chat.generatedThread.split('\n---\n').map((content: string, index: number) => ({
              content: content.trim(),
              position: index
            })) : [],
          createdAt: (chat as any).createdAt || chat.lastActivity,
          status: 'active'
        };
      }));
      
      return formattedChats;
    } catch (error) {
      this.logger.error(
        `Error getting all thread writer chats: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get thread writer chats: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a thread writer chat by ID
   * @param id The chat ID
   * @returns The thread writer chat data
   */
  @Get('chats/:id')
  async getThreadWriterChat(@Param('id') id: string): Promise<any> {
    try {
      this.logger.log(`Getting thread writer chat: ${id}`);
      
      const chat = await this.threadWriterService.findThreadWriterChatById(id);
      if (!chat) {
        throw new Error('Thread writer chat not found');
      }

      // Check if processing is incomplete and trigger chained prompts if needed
      if (!chat.processingComplete) {
        this.logger.debug(
          `Processing incomplete for chat ${id}, triggering chained prompts`,
        );

        // Trigger chained prompts in background
        this.threadWriterService.triggerChainedPrompts(id, {
          topic: chat.topic,
          clientId: chat.clientId,
          research: chat.research,
          selectedArticle: chat.selectedArticle,
          selectedAngle: chat.selectedAngle,
          selectedHook: chat.selectedHook,
        });
      }

      // Filter out system prompts before sending to frontend
      const filteredConversationHistory = chat.conversationHistory.filter(msg => 
        !msg.isSystemMessage
      );

      return {
        topic: chat.topic,
        clientId: chat.clientId,
        research: chat.research,
        selectedArticle: chat.selectedArticle,
        selectedAngle: chat.selectedAngle,
        selectedHook: chat.selectedHook,
        generatedThread: chat.generatedThread,
        conversationHistory: filteredConversationHistory,
        lastActivity: chat.lastActivity,
        processingComplete: chat.processingComplete,
      };
    } catch (error) {
      this.logger.error(
        `Error getting thread writer chat ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to get thread writer chat: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Add a conversational message to a thread writer chat
   * @param id The chat ID
   * @param messageDto The message data
   * @returns The AI response
   */
  @Post('chats/:id/message')
  async addMessageToThreadWriterChat(
    @Param('id') id: string,
    @Body() messageDto: { message: string },
  ): Promise<{ response: string }> {
    try {
      this.logger.log(`Adding message to thread writer chat: ${id}`);
      return await this.threadWriterService.addMessageToThreadWriterChat(
        id,
        messageDto.message,
      );
    } catch (error) {
      this.logger.error(
        `Error adding message to thread writer chat ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to add message to thread writer chat: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a thread writer chat
   * @param id The chat ID
   * @returns Success confirmation
   */
  @Delete('chats/:id')
  async deleteThreadWriterChat(@Param('id') id: string): Promise<{ success: boolean }> {
    try {
      this.logger.log(`Deleting thread writer chat: ${id}`);
      await this.threadWriterService.deleteThreadWriterChat(id);
      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error deleting thread writer chat ${id}: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to delete thread writer chat: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetch news articles for a given topic and client
   * @param clientId The client ID
   * @param newsRequestDto The request body with topic and optional parameters
   * @returns News articles response
   */
  @Post('news/:clientId')
  async getNewsForTopic(
    @Param('clientId') clientId: string,
    @Body() newsRequestDto: NewsRequestDto,
  ): Promise<NewsResponseDto> {
    try {
      this.logger.log(
        `Fetching news for topic: ${newsRequestDto.topic}, client: ${clientId}, sort: ${newsRequestDto.sortOrder || 'latest'}, days: ${newsRequestDto.dayRange || 7}`,
      );
      if (newsRequestDto.customInstructions) {
        this.logger.log(
          `Using custom instructions: ${newsRequestDto.customInstructions}`,
        );
      }
      return await this.newsService.fetchNews(
        newsRequestDto.topic,
        clientId,
        newsRequestDto.maxResults || 40,
        newsRequestDto.customInstructions,
        newsRequestDto.sortOrder || 'latest',
        newsRequestDto.dayRange || 7,
      );
    } catch (error) {
      this.logger.error(`Error fetching news: ${error.message}`, error.stack);
      throw new HttpException(
        `Failed to fetch news: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
