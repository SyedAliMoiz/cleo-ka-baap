import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnthropicService } from './services/anthropic.service';
import { AnthropicController } from './controllers/anthropic.controller';
import { PerplexityService } from './services/perplexity.service';
import { PerplexityController } from './controllers/perplexity.controller';
import { ClientsModule } from '../clients/clients.module';
import { PromptsModule } from '../prompts/prompts.module';

@Module({
  imports: [ConfigModule, ClientsModule, PromptsModule],
  providers: [AnthropicService, PerplexityService],
  controllers: [
    AnthropicController,
    PerplexityController,
  ],
  exports: [AnthropicService, PerplexityService],
})
export class AIModule {}
