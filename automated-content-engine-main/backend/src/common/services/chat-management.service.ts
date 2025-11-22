import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HookPolisherChat } from '../../hooks/schemas/hook-polisher-chat.schema';
import { LinkedInPostChat } from '../../linkedin-posts/schemas/linkedin-post-chat.schema';

export interface ChatDeletionResult {
  success: boolean;
  message: string;
  deletedChats?: Array<{
    type: 'hook-polisher' | 'linkedin-post';
    id: string;
    title?: string;
  }>;
  unlinkedChats?: Array<{
    type: 'hook-polisher' | 'linkedin-post';
    id: string;
    title?: string;
  }>;
}

@Injectable()
export class ChatManagementService {
  private readonly logger = new Logger(ChatManagementService.name);

  constructor(
    @InjectModel(HookPolisherChat.name) private hookPolisherChatModel: Model<HookPolisherChat>,
    @InjectModel(LinkedInPostChat.name) private linkedInPostChatModel: Model<LinkedInPostChat>,
  ) {}

  /**
   * Delete a hook polisher chat and handle its relationships
   */
  async deleteHookPolisherChat(chatId: string): Promise<ChatDeletionResult> {
    try {
      const chat = await this.hookPolisherChatModel.findById(chatId).exec();
      if (!chat) {
        throw new Error('Hook polisher chat not found');
      }

      const deletedChats: ChatDeletionResult['deletedChats'] = [];

      // Delete the hook polisher chat
      await this.hookPolisherChatModel.findByIdAndDelete(chatId);
      deletedChats.push({
        type: 'hook-polisher',
        id: chatId,
        title: `Hook Polisher Chat (${chat.originalHook?.substring(0, 50)}...)`,
      });

      this.logger.log(`Hook polisher chat ${chatId} deleted successfully`);

      return {
        success: true,
        message: 'Hook polisher chat deleted successfully',
        deletedChats,
      };
    } catch (error) {
      this.logger.error(`Error deleting hook polisher chat ${chatId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete a LinkedIn post chat and handle its relationships
   */
  async deleteLinkedInPostChat(chatId: string): Promise<ChatDeletionResult> {
    try {
      const chat = await this.linkedInPostChatModel.findById(chatId).exec();
      if (!chat) {
        throw new Error('LinkedIn post chat not found');
      }

      const deletedChats: ChatDeletionResult['deletedChats'] = [];

      // Delete the LinkedIn post chat
      await this.linkedInPostChatModel.findByIdAndDelete(chatId);
      deletedChats.push({
        type: 'linkedin-post',
        id: chatId,
        title: `LinkedIn Post Chat (${chat.originalThread?.substring(0, 50)}...)`,
      });

      this.logger.log(`LinkedIn post chat ${chatId} deleted successfully`);

      return {
        success: true,
        message: 'LinkedIn post chat deleted successfully',
        deletedChats,
      };
    } catch (error) {
      this.logger.error(`Error deleting LinkedIn post chat ${chatId}: ${error.message}`, error.stack);
      throw error;
    }
  }
} 