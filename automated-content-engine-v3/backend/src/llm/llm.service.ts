import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ProvidersService } from '../providers/providers.service';
import { ModulesService } from '../modules/modules.service';

@Injectable()
export class LlmService {
  constructor(
    private providersService: ProvidersService,
    private modulesService: ModulesService,
  ) {}

  async runModule(moduleKey: string, inputContext: string): Promise<string> {
    const moduleConfig = await this.modulesService.findByKey(moduleKey);
    if (!moduleConfig) {
      throw new Error(`Module ${moduleKey} not found`);
    }

    const apiKey = await this.providersService.getKey(moduleConfig.provider);
    if (!apiKey) {
      throw new Error(`API Key for ${moduleConfig.provider} not configured`);
    }

    // Routing logic based on provider
    switch (moduleConfig.provider) {
      case 'openai':
        return this.callOpenAI(apiKey, moduleConfig.model, moduleConfig.systemPrompt, inputContext);
      case 'anthropic':
        return this.callAnthropic(apiKey, moduleConfig.model, moduleConfig.systemPrompt, inputContext);
      case 'perplexity':
        return this.callPerplexity(apiKey, moduleConfig.model, moduleConfig.systemPrompt, inputContext);
      // case 'deep-research':
      //    return this.runDeepResearch(...)
      default:
        throw new Error(`Provider ${moduleConfig.provider} not supported`);
    }
  }

  private async callOpenAI(apiKey: string, model: string, system: string, user: string): Promise<string> {
     // Mock implementation for now to avoid external deps in this phase
     // In real world: import OpenAI from 'openai';
     console.log(`[OpenAI] Model: ${model}, System: ${system}, User: ${user.substring(0, 50)}...`);
     return `[Mock OpenAI Output] Processed input via ${model}`;
  }

  private async callAnthropic(apiKey: string, model: string, system: string, user: string): Promise<string> {
     console.log(`[Anthropic] Model: ${model}, System: ${system}, User: ${user.substring(0, 50)}...`);
     return `[Mock Anthropic Output] Processed input via ${model}`;
  }

  private async callPerplexity(apiKey: string, model: string, system: string, user: string): Promise<string> {
     console.log(`[Perplexity] Model: ${model}, System: ${system}, User: ${user.substring(0, 50)}...`);
     return `[Mock Perplexity Output] Research results for: ${user}`;
  }
}
