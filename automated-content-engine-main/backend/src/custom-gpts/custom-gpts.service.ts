import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { Model } from 'mongoose';
import {
  CustomGptMessage,
  CustomGptMessageDocument,
} from './schemas/customGptMessage.schema';
import {
  CustomGptSession,
  CustomGptSessionDocument,
} from './schemas/customGptSession.schema';
import { GPT_TYPES } from './gpts/gpts';

@Injectable()
export class CustomGptsService {
  private readonly logger = new Logger(CustomGptsService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly gptPrompts: Record<string, string>;

  constructor(
    @InjectModel(CustomGptSession.name)
    private customGptSessionModel: Model<CustomGptSessionDocument>,
    @InjectModel(CustomGptMessage.name)
    private customGptMessageModel: Model<CustomGptMessageDocument>,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.model = this.configService.get<string>(
      'ANTHROPIC_MODEL',
      'claude-sonnet-4-20250514',
    );

    this.gptPrompts = GPT_TYPES as Record<string, string>;
  }

  getAvailableGptTypes(): string[] {
    return Object.keys(this.gptPrompts);
  }

  getGptConfigurations(): string[] {
    return Object.keys(this.gptPrompts);
  }

  async createSession(gptType: string): Promise<CustomGptSessionDocument> {
    if (!this.gptPrompts[gptType]) {
      throw new Error(`Invalid GPT type: ${gptType}`);
    }

    const session = new this.customGptSessionModel({
      gptType,
      title: `New ${gptType} Chat`,
    });

    await session.save();

    return session;
  }

  async getSessionsByGptType(
    gptType: string,
  ): Promise<CustomGptSessionDocument[]> {
    return this.customGptSessionModel
      .find({ gptType })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getSessionMessages(
    sessionId: string,
  ): Promise<CustomGptMessageDocument[]> {
    return this.customGptMessageModel
      .find({ sessionId })
      .sort({ createdAt: 1 })
      .exec();
  }

  async sendMessage(
    sessionId: string,
    userMessage: string,
  ): Promise<CustomGptMessageDocument[]> {
    const session = await this.customGptSessionModel.findById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const userMsg = new this.customGptMessageModel({
      sessionId,
      role: 'user',
      content: userMessage,
    });
    await userMsg.save();

    if (session.title === `New ${session.gptType} Chat`) {
      const title =
        userMessage.length > 50
          ? userMessage.substring(0, 50) + '...'
          : userMessage;
      await this.customGptSessionModel.findByIdAndUpdate(sessionId, {
        title,
      });
    }

    const conversationHistory = await this.getSessionMessages(sessionId);

    const assistantResponse = await this.getGptResponse(
      session.gptType,
      conversationHistory,
      userMessage,
    );

    const assistantMsg = new this.customGptMessageModel({
      sessionId,
      role: 'assistant',
      content: assistantResponse,
    });
    await assistantMsg.save();

    return await this.getSessionMessages(sessionId);
  }

  private async getGptResponse(
    gptType: string,
    conversationHistory: CustomGptMessageDocument[],
    userMessage: string,
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getMockResponse();
    }

    try {
      const messages = conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      messages.push({
        role: 'user',
        content: userMessage,
      });

      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: this.model,
          max_tokens: 2000,
          temperature: 0.7,
          system: this.gptPrompts[gptType],
          messages,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.content[0].text;
    } catch (error) {
      this.logger.error(`Error calling Claude API: ${error.message}`);

      return this.getMockResponse();
    }
  }

  private getMockResponse(): string {
    return "Sorry, I can't help with that request.";
  }
}
