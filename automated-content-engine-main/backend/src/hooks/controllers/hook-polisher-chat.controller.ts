import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Logger,
  Delete,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { HookPolisherChatService } from '../services/hook-polisher-chat.service';
import { ClientsService } from '../../clients/clients.service';
import {
  HookPolishRequestDto,
  HookPolishResponseDto,
  ConversationalHookPolishRequestDto,
} from '../../ai/dto/anthropic.dto';
import { ChatManagementService } from '../../common/services/chat-management.service';

@Controller('api/hook-polisher-chats')
@UseGuards(JwtAuthGuard)
export class HookPolisherChatController {
  private readonly logger = new Logger(HookPolisherChatController.name);

  constructor(
    private readonly hookPolisherChatService: HookPolisherChatService,
    private readonly clientsService: ClientsService,
    private readonly chatManagementService: ChatManagementService,
  ) {}

  @Get()
  async getAllChats() {
    try {
      const chats = await this.hookPolisherChatService.findAll();
      this.logger.debug(`Retrieved ${chats.length} hook polisher chats`);
      
      // Transform raw chat data to frontend-expected format
      const formattedChats = await Promise.all(chats.map(async (chat) => {
        let clientName = 'Hook Polisher Chat';
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
          title: this.generateChatTitle(chat.originalHook),
          clientId,
          clientName,
          hooks: chat.polishedHooks || [],
          createdAt: (chat as any).createdAt || chat.lastActivity,
        };
      }));
      
      return formattedChats;
    } catch (error) {
      this.logger.error(
        `Error getting all hook polisher chats: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private generateChatTitle(originalHook: string): string {
    if (!originalHook) return 'Hook Polish Chat';
    
    // Create a meaningful title from the first 50 chars of the hook
    const title = originalHook.length > 50 
      ? originalHook.substring(0, 50) + '...'
      : originalHook;
    
    return title.replace(/\n/g, ' ').trim();
  }

  @Post('create-or-get')
  async createOrGetChat(
    @Body()
    createDto: {
      hook: string;
      threadContext?: string;
      research?: string;
      angle?: string;
      threadId?: string;
      clientId?: string;
    },
  ) {
    try {
      // Check if there's already a hook polisher chat for this thread
      if (createDto.threadId) {
        const existingChat = await this.hookPolisherChatService.findByThreadId(
          createDto.threadId,
        );
        if (existingChat) {
          this.logger.debug(
            `Found existing hook polisher chat for thread ${createDto.threadId}: ${(existingChat as any)._id}`,
          );
          return {
            chatId: (existingChat as any)._id.toString(),
            isNew: false,
          };
        }
      }

      // Create new chat
      const newChat = await this.hookPolisherChatService.createChat({
        hook: createDto.hook,
        threadContext: createDto.threadContext,
        research: createDto.research,
        angle: createDto.angle,
        threadId: createDto.threadId,
        clientId: createDto.clientId,
      });

      this.logger.debug(
        `Created new hook polisher chat: ${(newChat as any)._id}`,
      );

      return {
        chatId: (newChat as any)._id.toString(),
        isNew: true,
      };
    } catch (error) {
      this.logger.error(
        `Error creating/getting hook polisher chat: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get(':id')
  async getChat(@Param('id') id: string) {
    try {
      const chat = await this.hookPolisherChatService.findById(id);
      if (!chat) {
        throw new Error('Hook polisher chat not found');
      }

      // Check if processing is incomplete and trigger chained prompts if needed
      this.logger.debug(
        `Chat ${id} state: processingComplete=${chat.processingComplete}, polishedHooksCount=${chat.polishedHooks?.length || 0}`,
      );

      if (!chat.processingComplete) {
        this.logger.debug(
          `Processing incomplete for chat ${id}, triggering chained prompts`,
        );

        // Trigger chained prompts in background
        this.hookPolisherChatService.triggerChainedPrompts(id, {
          hook: chat.originalHook,
          threadContext: chat.threadContext,
          research: chat.research,
          angle: chat.angle,
        });
      } else {
        this.logger.debug(`Processing already complete for chat ${id}`);
      }

      // Filter out system prompts before sending to frontend (security)
      // Only send assistant responses and actual user messages, NOT backend prompts
      const filteredConversationHistory = chat.conversationHistory.filter(msg => 
        !msg.isSystemMessage // Exclude backend system prompts
      );

      // Get client name if clientId exists
      let clientName: string | null = null;
      if (chat.clientId) {
        try {
          const client = await this.clientsService.findOne(chat.clientId);
          clientName = client.name;
        } catch (error) {
          this.logger.warn(`Could not find client ${chat.clientId}: ${error.message}`);
        }
      }

      const responseData = {
        originalHook: chat.originalHook,
        threadContext: chat.threadContext,
        research: chat.research,
        angle: chat.angle,
        polishedHooks: chat.polishedHooks,
        conversationHistory: filteredConversationHistory, // Only non-system messages
        lastActivity: chat.lastActivity,
        clientId: chat.clientId,
        clientName,
      };

      this.logger.debug(
        `Returning filtered chat data: conversationHistory length = ${responseData.conversationHistory?.length || 0} (system prompts excluded)`,
      );
      
      // Debug: Check isProcessingStepResponse flags in filtered data
      const processingStepResponses = responseData.conversationHistory?.filter(msg => (msg as any).isProcessingStepResponse) || [];
      this.logger.debug(`Found ${processingStepResponses.length} processing step responses in filtered data`);

      return responseData;
    } catch (error) {
      this.logger.error(
        `Error getting hook polisher chat ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Post(':id/message')
  async sendMessage(
    @Param('id') id: string,
    @Body() messageDto: { message: string },
  ) {
    try {
      const result = await this.hookPolisherChatService.addMessage(
        id,
        messageDto.message,
      );

      return {
        response: result.response,
        polishedHooks: result.polishedHooks,
      };
    } catch (error) {
      this.logger.error(
        `Error sending message to hook polisher chat ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Delete(':id')
  async deleteChat(@Param('id') id: string) {
    try {
      this.logger.log(`Attempting to delete hook polisher chat: ${id}`);
      const result = await this.chatManagementService.deleteHookPolisherChat(id);
      this.logger.log(`Hook polisher chat ${id} deleted successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error deleting hook polisher chat ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}