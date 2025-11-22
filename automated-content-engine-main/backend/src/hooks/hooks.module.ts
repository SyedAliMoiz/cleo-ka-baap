import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Hook, HookSchema } from './schemas/hook.schema';
import { HookPolisherChatController } from './controllers/hook-polisher-chat.controller';
import { HookPolisherChatService } from './services/hook-polisher-chat.service';
import { HookPolisherChat, HookPolisherChatSchema } from './schemas/hook-polisher-chat.schema';
import { HookPolisherGateway } from './gateways/hook-polisher.gateway';
import { PromptsModule } from '../prompts/prompts.module';
import { AIModule } from '../ai/ai.module';
import { ClientsModule } from '../clients/clients.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Hook.name, schema: HookSchema },
      { name: HookPolisherChat.name, schema: HookPolisherChatSchema },
    ]),
    PromptsModule,
    AIModule,
    ClientsModule,
    CommonModule,
  ],
  controllers: [HookPolisherChatController],
  providers: [HookPolisherChatService, HookPolisherGateway],
  exports: [HookPolisherChatService, HookPolisherGateway],
})
export class HooksModule {}
