import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { ProvidersModule } from '../providers/providers.module';
import { ModulesModule } from '../modules/modules.module';

@Module({
  imports: [ProvidersModule, ModulesModule],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
