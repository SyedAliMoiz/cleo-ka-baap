import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Logger,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { LinkedInPostChatService } from '../services/linkedin-post-chat.service';
import { ClientsService } from '../../clients/clients.service';
import { ChatManagementService } from '../../common/services/chat-management.service';

@Controller('api/linkedin-post-chats')
@UseGuards(JwtAuthGuard)
export class LinkedInPostChatController {
  private readonly logger = new Logger(LinkedInPostChatController.name);

  constructor(
    private readonly linkedInPostChatService: LinkedInPostChatService,
    private readonly clientsService: ClientsService,
    private readonly chatManagementService: ChatManagementService,
  ) {}

  @Get()
  async getAllChats() {
    try {
      const chats = await this.linkedInPostChatService.findAll();
      this.logger.log(`Retrieved ${chats.length} LinkedIn post chats`);
      
      // Transform raw chat data to frontend-expected format
      const formattedChats = await Promise.all(chats.map(async (chat) => {
        let clientName = 'LinkedIn Post Chat';
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
          title: this.generateChatTitle(chat.originalThread),
          clientId,
          clientName,
          originalThread: chat.originalThread,
          generatedPosts: chat.generatedPosts || [],
          createdAt: (chat as any).createdAt || chat.lastActivity,
        };
      }));
      
      return formattedChats;
    } catch (error) {
      this.logger.error(
        `Error getting all LinkedIn post chats: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  private generateChatTitle(originalThread: string): string {
    if (!originalThread) return 'LinkedIn Post Chat';
    
    // Create a meaningful title from the first 50 chars of the thread
    const title = originalThread.length > 50 
      ? originalThread.substring(0, 50) + '...'
      : originalThread;
    
    return title.replace(/\n/g, ' ').trim();
  }

  @Post('create-or-get')
  async createOrGetChat(
    @Body()
    createDto: {
      thread: string;
      specificInstructions?: string;
      threadId?: string;
      clientId?: string;
    },
  ) {
    try {
      this.logger.debug(`[CONTROLLER] Received create-or-get request with clientId: ${createDto.clientId}`);
      
      // Always create a new chat for LinkedIn post generation
      // Each LinkedIn post generation should be a fresh conversation
      const newChat = await this.linkedInPostChatService.createChat({
        thread: createDto.thread,
        specificInstructions: createDto.specificInstructions,
        threadId: createDto.threadId,
        clientId: createDto.clientId,
      });
      this.logger.log(`Created new LinkedIn post chat: ${newChat._id}`);
      
      // Trigger the chained processing automatically for new chats
      this.linkedInPostChatService.executeChainedPrompts(String(newChat._id), {
        thread: createDto.thread,
        specificInstructions: createDto.specificInstructions,
      }).catch((error) => {
        this.logger.error(
          `Error in background LinkedIn post processing for chat ${newChat._id}: ${error.message}`,
          error.stack,
        );
      });
      
      return { 
        chatId: newChat._id,
        isNew: true
      };
    } catch (error) {
      this.logger.error('Error in createOrGetChat:', error);
      throw error;
    }
  }

  @Get(':chatId')
  async getChat(@Param('chatId') chatId: string) {
    try {
      const chat = await this.linkedInPostChatService.findById(chatId);
      
      if (!chat) {
        throw new Error('LinkedIn post chat not found');
      }

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

      // Return chat data with client information
      return {
        ...chat.toObject ? chat.toObject() : chat,
        clientName,
      };
    } catch (error) {
      this.logger.error(`Error getting LinkedIn post chat ${chatId}:`, error);
      throw error;
    }
  }

  @Get(':chatId/trigger-processing')
  async triggerLinkedInPostProcessing(@Param('chatId') chatId: string) {
    try {
      this.logger.log(`Triggering LinkedIn post processing for chat: ${chatId}`);
      
      // Get the chat to retrieve the thread and instructions
      const chat = await this.linkedInPostChatService.findById(chatId);
      if (!chat) {
        throw new Error('LinkedIn post chat not found');
      }
      
      // Start the chained processing asynchronously
      this.linkedInPostChatService.executeChainedPrompts(chatId, {
        thread: chat.originalThread,
        specificInstructions: chat.specificInstructions,
      });
      
      return { message: 'LinkedIn post processing started' };
    } catch (error) {
      this.logger.error(`Error triggering LinkedIn post processing for chat ${chatId}:`, error);
      throw error;
    }
  }

  @Post(':chatId/message')
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() body: { message: string },
  ) {
    try {
      const response = await this.linkedInPostChatService.sendMessage(chatId, body.message);
      return { response };
    } catch (error) {
      this.logger.error(`Error sending message to LinkedIn post chat ${chatId}:`, error);
      throw error;
    }
  }

  @Delete(':id')
  async deleteChat(@Param('id') id: string) {
    try {
      this.logger.log(`Attempting to delete LinkedIn post chat: ${id}`);
      const result = await this.chatManagementService.deleteLinkedInPostChat(id);
      this.logger.log(`LinkedIn post chat ${id} deleted successfully`);
      return result;
    } catch (error) {
      this.logger.error(
        `Error deleting LinkedIn post chat ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
} 