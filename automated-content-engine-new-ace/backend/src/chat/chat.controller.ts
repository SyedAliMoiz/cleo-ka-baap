import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { Protected } from '../auth/decorators/auth.decorators';
import { ChatService } from './chat.service';
import { AuthRequest } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // Sessions for a given module slug
  @Protected()
  @Get(':slug/sessions')
  getSessions(@Req() req: AuthRequest, @Param('slug') slug: string) {
    return this.chatService.getUserSessionsByModule(req.user.sub, slug);
  }

  @Protected()
  @Post(':slug/sessions')
  createSession(@Req() req: AuthRequest, @Param('slug') slug: string) {
    return this.chatService.createSession(req.user.sub, slug);
  }

  @Protected()
  @Get('sessions/:sessionId/messages')
  getMessages(@Param('sessionId') sessionId: string) {
    return this.chatService.getSessionMessages(sessionId);
  }

  @Protected()
  @Post('sessions/:sessionId/messages')
  sendMessage(
    @Req() req: AuthRequest,
    @Param('sessionId') sessionId: string,
    @Body('message') message: string,
  ) {
    return this.chatService.sendMessage(req.user.sub, sessionId, message);
  }

  @Protected()
  @Delete('sessions/:sessionId')
  deleteSession(
    @Req() req: AuthRequest,
    @Param('sessionId') sessionId: string,
  ) {
    return this.chatService.deleteSession(req.user.sub, sessionId);
  }
}
