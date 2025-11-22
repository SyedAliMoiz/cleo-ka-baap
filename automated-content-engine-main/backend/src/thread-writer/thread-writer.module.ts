import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThreadWriterController } from './thread-writer.controller';
import { ThreadWriterService } from './thread-writer.service';
import { ThreadWriterGateway } from './gateways/thread-writer.gateway';
import { AIModule } from '../ai/ai.module';
import { ThreadWriterChat, ThreadWriterChatSchema } from './schemas/thread-writer-chat.schema';
import { NewsModule } from '../news/news.module';
import { PromptsModule } from '../prompts/prompts.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    AIModule, // This module provides the AnthropicService
    MongooseModule.forFeature([
      { name: ThreadWriterChat.name, schema: ThreadWriterChatSchema },
    ]),
    NewsModule, // Import NewsModule to use NewsService
    PromptsModule, // Import PromptsModule to use PromptsService  
    ClientsModule, // Import ClientsModule to use ClientsService
  ],
  controllers: [ThreadWriterController],
  providers: [ThreadWriterService, ThreadWriterGateway],
  exports: [ThreadWriterService, ThreadWriterGateway],
})
export class ThreadWriterModule {}
