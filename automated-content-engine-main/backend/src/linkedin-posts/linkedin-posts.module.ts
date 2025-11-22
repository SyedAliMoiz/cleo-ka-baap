import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LinkedInPostChatController } from './controllers/linkedin-post-chat.controller';
import { LinkedInPostChatService } from './services/linkedin-post-chat.service';
import { LinkedInPostGateway } from './gateways/linkedin-post.gateway';
import { LinkedInPostChat, LinkedInPostChatSchema } from './schemas/linkedin-post-chat.schema';
import { AIModule } from '../ai/ai.module';
import { PromptsModule } from '../prompts/prompts.module';
import { ClientsModule } from '../clients/clients.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LinkedInPostChat.name, schema: LinkedInPostChatSchema },
    ]),
    AIModule,
    PromptsModule,
    ClientsModule,
    CommonModule,
  ],
  controllers: [LinkedInPostChatController],
  providers: [LinkedInPostChatService, LinkedInPostGateway],
  exports: [LinkedInPostChatService],
})
export class LinkedInPostsModule {} 