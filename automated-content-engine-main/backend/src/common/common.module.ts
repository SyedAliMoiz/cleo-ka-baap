import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatManagementService } from './services/chat-management.service';
import { HookPolisherChat, HookPolisherChatSchema } from '../hooks/schemas/hook-polisher-chat.schema';
import { LinkedInPostChat, LinkedInPostChatSchema } from '../linkedin-posts/schemas/linkedin-post-chat.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: HookPolisherChat.name, schema: HookPolisherChatSchema },
      { name: LinkedInPostChat.name, schema: LinkedInPostChatSchema },
    ]),
  ],
  providers: [ChatManagementService],
  exports: [ChatManagementService],
})
export class CommonModule {} 