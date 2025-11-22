import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { CustomGptsService } from './custom-gpts.service';

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  gptType: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}

@Controller('custom-gpts')
export class CustomGptsController {
  constructor(private readonly customGptsService: CustomGptsService) {}

  @Get('list')
  getAvailableGptTypes(): string[] {
    return this.customGptsService.getAvailableGptTypes();
  }

  @Get('configurations')
  getGptConfigurations(): string[] {
    return this.customGptsService.getGptConfigurations();
  }

  @Post('session')
  async createSession(@Body() createSessionDto: CreateSessionDto) {
    const session = await this.customGptsService.createSession(
      createSessionDto.gptType,
    );
    return {
      sessionId: session._id?.toString() || '',
      gptType: session.gptType,
      title: session.title,
      createdAt: session.createdAt,
    };
  }

  @Get('sessions/:gptType')
  async getSessionsByGptType(@Param('gptType') gptType: string) {
    const sessions = await this.customGptsService.getSessionsByGptType(gptType);
    return sessions.map((session) => ({
      sessionId: session._id?.toString() || '',
      gptType: session.gptType,
      title: session.title,
      createdAt: session.createdAt,
    }));
  }

  @Get(':sessionId/messages')
  async getSessionMessages(@Param('sessionId') sessionId: string) {
    const messages = await this.customGptsService.getSessionMessages(sessionId);
    return messages.map((message) => ({
      id: message._id?.toString() || '',
      sessionId: message.sessionId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    }));
  }

  @Post(':sessionId/message')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    const messages = await this.customGptsService.sendMessage(
      sessionId,
      sendMessageDto.message,
    );
    return messages.map((message) => ({
      id: message._id?.toString() || '',
      sessionId: message.sessionId,
      role: message.role,
      content: message.content,
      createdAt: message.createdAt,
    }));
  }
}
