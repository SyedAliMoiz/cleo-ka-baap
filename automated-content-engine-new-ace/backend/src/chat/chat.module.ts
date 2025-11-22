import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatSession, ChatSessionSchema } from './schemas/session.schema';
import { ChatMessage, ChatMessageSchema } from './schemas/message.schema';
import { ModulesModule } from '../modules/modules.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
    ModulesModule,
    KnowledgeModule,
    RagModule,
  ],
  providers: [ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
