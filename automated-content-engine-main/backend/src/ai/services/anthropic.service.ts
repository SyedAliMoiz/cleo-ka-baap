import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import {
  ContentAngleDto,
  HookDto,
  MessageDto,
  ToolDto,
  CompleteRequestDto,
  RankArticlesRequestDto,
  GenerateAnglesRequestDto,
  GenerateHooksRequestDto,
  ThreadRequestDto,
  HookPolishResponseDto,
  ConversationalHookPolishRequestDto,
} from '../dto/anthropic.dto';
import { ClientsService } from '../../clients/clients.service';
import { PromptsService } from '../../prompts/prompts.service';
import { PromptFeature } from '../../prompts/schemas/prompt.schema';

@Injectable()
export class AnthropicService {
  private readonly logger = new Logger(AnthropicService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(
    private configService: ConfigService,
    private clientsService: ClientsService,
    private promptsService: PromptsService,
  ) {
    // Enhanced debugging for environment variables
    const allEnvKeys = Object.keys(process.env).filter(
      (key) =>
      !key.includes('SECRET') &&
      !key.includes('KEY') &&
        !key.includes('PASSWORD'),
    );
    this.logger.debug(
      `Available environment variables: ${allEnvKeys.join(', ')}`,
    );

    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!this.apiKey) {
      this.logger.warn(
        'ANTHROPIC_API_KEY is not defined in environment variables',
      );
    } else {
      this.logger.debug('ANTHROPIC_API_KEY is defined');
    }

    this.model = this.configService.get<string>(
      'ANTHROPIC_MODEL',
      'claude-sonnet-4-20250514',
    );
    this.maxTokens = +this.configService.get<number>(
      'ANTHROPIC_MAX_TOKENS',
      2048,
    );
    this.temperature = +this.configService.get<number>(
      'ANTHROPIC_TEMPERATURE',
      0.7,
    );

    this.logger.log(
      `Using ${this.model} model with max tokens: ${this.maxTokens}, temperature: ${this.temperature}`,
    );
  }

  /**
   * Complete a prompt using the Anthropic Claude API
   * @param completeDto The complete request DTO
   * @returns Promise with the API response
   */
  async completePrompt(completeDto: CompleteRequestDto) {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not defined');
    }

    // Log detailed information about the Claude API request
    this.logger.debug(`
===== CLAUDE API COMPLETE PROMPT REQUEST - FULL DETAILS =====
ENDPOINT: https://api.anthropic.com/v1/messages
MODEL: ${this.model}
MAX TOKENS: ${completeDto.maxTokens || this.maxTokens}
TEMPERATURE: ${completeDto.temperature || this.temperature}
SYSTEM: ${completeDto.system ? `"${completeDto.system.substring(0, 100)}${completeDto.system.length > 100 ? '...' : ''}"` : 'None'}
PROMPT LENGTH: ${completeDto.prompt.length} characters
PROMPT PREVIEW: 
${completeDto.prompt.substring(0, 500)}${completeDto.prompt.length > 500 ? '...[truncated for log]' : ''}
===== END CLAUDE API COMPLETE PROMPT REQUEST =====
`);

    const url = 'https://api.anthropic.com/v1/messages';
    
    // Retry logic for rate limiting
    const maxRetries = 3;
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        url,
        {
          model: this.model,
          messages: [{ role: 'user', content: completeDto.prompt }],
          max_tokens: completeDto.maxTokens || this.maxTokens,
          temperature: completeDto.temperature || this.temperature,
          system: completeDto.system,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          },
        );

      return {
        text: response.data.content[0].text,
        model: response.data.model,
        usage: response.data.usage,
      };
    } catch (error) {
        lastError = error;
        
        // Check if it's a rate limit error (429)
        if (error.response?.status === 429) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
          this.logger.warn(
            `Rate limit hit (attempt ${attempt}/${maxRetries}). Waiting ${waitTime}ms before retry...`
          );
          
          if (attempt < maxRetries) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
        
        // For non-rate-limit errors or final attempt, throw immediately
      this.logger.error(`Error calling Claude API: ${error.message}`);
      if (error.response?.data) {
          this.logger.error(
            `API error response: ${JSON.stringify(error.response.data)}`,
          );
      }
      throw error;
    }
    }
    
    // This should never be reached, but just in case
    throw lastError;
  }

  /**
   * Create a thread using the Anthropic Claude API
   * @param messages The messages to include in the thread
   * @param maxTokens The maximum number of tokens to generate
   * @param temperature The sampling temperature
   * @param tools Optional tools for the model to use
   * @param system Optional system message
   * @returns Promise with the API response
   */
  async createThread(threadDto: ThreadRequestDto) {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not defined');
    }

    // Log detailed information about the Claude API request
    this.logger.debug(`
===== CLAUDE API CREATE THREAD REQUEST - FULL DETAILS =====
ENDPOINT: https://api.anthropic.com/v1/messages
MODEL: ${this.model}
MAX TOKENS: ${threadDto.maxTokens || this.maxTokens}
TEMPERATURE: ${threadDto.temperature || this.temperature}
SYSTEM: ${threadDto.system ? `"${threadDto.system.substring(0, 100)}${threadDto.system.length > 100 ? '...' : ''}"` : 'None'}
MESSAGES COUNT: ${threadDto.messages.length}
TOOLS COUNT: ${threadDto.tools?.length || 0}
MESSAGES PREVIEW: 
${JSON.stringify(
  threadDto.messages.slice(0, 2).map((m) => ({
      role: m.role,
    content:
      m.content.substring(0, 100) + (m.content.length > 100 ? '...' : ''),
  })),
  null,
  2,
)}${threadDto.messages.length > 2 ? '\n... (additional messages truncated)' : ''}
TOOLS PREVIEW: ${
      threadDto.tools
        ? JSON.stringify(
            threadDto.tools.slice(0, 2).map((t) => ({ name: t.name })),
            null,
            2,
          )
        : 'None'
    }
===== END CLAUDE API CREATE THREAD REQUEST =====
`);

    const url = 'https://api.anthropic.com/v1/messages';
    try {
      const response = await axios.post(
        url,
        {
          model: this.model,
          messages: threadDto.messages,
          max_tokens: threadDto.maxTokens || this.maxTokens,
          temperature: threadDto.temperature || this.temperature,
          system: threadDto.system,
          tools: threadDto.tools,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Error calling Claude API: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(
          `API error response: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Rank articles based on client info and topic
   * @param rankDto The rank articles request DTO
   * @returns Promise with ranked articles
   */
  async rankArticles(rankDto: RankArticlesRequestDto) {
    try {
      // Fetch the client information from the database
      const client = await this.clientsService.findOne(rankDto.clientId);

      // Map the client data to ClientInfoDto format
      const clientInfo = {
        id: client['_id'].toString(),
        name: client.name,
        bio: client.bio,
        nicheTags: client.nicheTags,
        businessInfo: client.businessInfo,
        industry: client.company, // Map company to industry
        voice: client.voice,
      };

      this.logger.debug(
        `Fetched client info for ID ${rankDto.clientId}: ${JSON.stringify(clientInfo)}`,
      );

    // Create a sanitized DTO
    const sanitizedRankDto = {
      ...rankDto,
    };

    // Log detailed information about the Claude API request
    this.logger.debug(`
===== CLAUDE API RANK ARTICLES REQUEST - METADATA =====
ENDPOINT: https://api.anthropic.com/v1/messages
MODEL: ${this.model}
MAX TOKENS: 2048
TEMPERATURE: 0.3
CLIENT INFO: ${JSON.stringify(clientInfo)}
TOPIC: ${rankDto.topic}
ARTICLES COUNT: ${rankDto.articles.length}
===== END CLAUDE API REQUEST METADATA =====
`);

    const variables = {
      clientName: clientInfo.name || 'Not provided',
      clientBio: clientInfo.bio ? clientInfo.bio : 'Not provided',
      clientNicheTags: clientInfo.nicheTags?.length
        ? clientInfo.nicheTags.join(', ')
        : 'Not provided',
      clientBusinessInfo: clientInfo.businessInfo
        ? clientInfo.businessInfo
        : `Professional in the ${rankDto.topic} space`,
      clientIndustry: clientInfo.industry
        ? clientInfo.industry
        : 'Not provided',
      clientVoice: clientInfo.voice ? clientInfo.voice : 'Not provided',
      topic: rankDto.topic,
      articles: rankDto.articles
        .map(
          (article, index) =>
      `Article #${index + 1}:
Title: ${article.title}
URL: ${article.url}
Source: ${article.source}
Published: ${article.publishedAt}
Summary: ${article.summary}`,
        )
        .join('\n\n'),
    };

    const promptData = await this.promptsService.renderFullPromptByFeature(
      PromptFeature.RANK_ARTICLES,
      variables,
    );

    // Log the complete prompt breakdown
    this.logger.debug(`
===== RANK ARTICLES SYSTEM PROMPT =====
${promptData.systemPrompt ? promptData.systemPrompt : '(No system prompt configured)'}
===== END SYSTEM PROMPT =====

===== RANK ARTICLES USER PROMPT =====
${promptData.userPrompt}
===== END USER PROMPT =====

===== FULL COMBINED PROMPT SENT TO AI =====
${promptData.fullPrompt}
===== END FULL PROMPT =====
`);

    const url = 'https://api.anthropic.com/v1/messages';
    try {
      const response = await axios.post(
        url,
        {
          model: this.model,
          max_tokens: 2048,
          temperature: 0.3,
          system: promptData.systemPrompt || undefined,
          messages: [{ role: 'user', content: promptData.userPrompt }],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        },
      );

      // Extract the text from the response
      const text = response.data.content[0].text;

      try {
        // Extract JSON from the response - sometimes Claude might wrap it in ```json blocks
        let jsonText = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonText = jsonMatch[1];
        }

        // Parse the JSON
        const result = JSON.parse(jsonText);

        // Ensure we have the expected structure
        if (!result.rankedArticles || !Array.isArray(result.rankedArticles)) {
            throw new Error(
              'Invalid response format: missing rankedArticles array',
            );
        }

        // Map the ranked articles back to the original article data with ranking info
        const topArticles = result.rankedArticles.map((rankedArticle: any) => {
          // Get the original article data using the article index (Claude uses 1-based indexing)
          const originalArticle = rankDto.articles[rankedArticle.articleIndex - 1];
          
          if (!originalArticle) {
            this.logger.warn(`Article index ${rankedArticle.articleIndex} not found in original articles`);
            return null;
          }

          // Return the original article data combined with ranking info
          return {
            title: originalArticle.title,
            url: originalArticle.url,
            summary: originalArticle.summary,
            publishedAt: originalArticle.publishedAt,
            source: originalArticle.source,
            relevanceScore: rankedArticle.relevanceScore,
            relevanceExplanation: rankedArticle.explanation,
            rank: rankedArticle.rank || rankedArticle.articleIndex,
            explanation: rankedArticle.explanation
          };
        }).filter(Boolean); // Remove any null entries

        return {
          topArticles,
          clientId: rankDto.clientId,
          topic: rankDto.topic,
          timestamp: new Date().toISOString(),
        };
      } catch (parseError) {
        this.logger.error(
          `Error parsing JSON response: ${parseError.message}`,
        );
        throw new Error(`Failed to parse AI response for article ranking: ${parseError.message}`);
        }
      } catch (error) {
        this.logger.error(`Error calling Claude API: ${error.message}`);
        if (error.response?.data) {
          this.logger.error(
            `API error response: ${JSON.stringify(error.response.data)}`,
          );
        }
        throw error;
      }
    } catch (error) {
      this.logger.error(`Error calling Claude API: ${error.message}`);
      if (error.response?.data) {
        this.logger.error(
          `API error response: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Generate angles for a topic
   * @param topic The topic to generate angles for
   * @param clientInfo The client information
   * @param research The research to base angles on
   * @param selectedArticle Optional article to focus on
   * @param isManualMode Whether using manual research mode
   * @param manualResearch Optional manual research content
   * @param customInstructions Optional custom instructions
   * @returns Promise with generated angles
   */
  async generateAngles(anglesDto: GenerateAnglesRequestDto) {
    try {
      // Fetch the client information from the database
      const client = await this.clientsService.findOne(anglesDto.clientId);

      // Map the client data to ClientInfoDto format
      const clientInfo = {
        id: client['_id'].toString(),
        name: client.name,
        bio: client.bio,
        nicheTags: client.nicheTags,
        businessInfo: client.businessInfo,
        industry: client.company, // Map company to industry
        voice: client.voice,
      };

      this.logger.debug(
        `Fetched client info for ID ${anglesDto.clientId}: ${JSON.stringify(clientInfo)}`,
      );

      const variables = {
        clientName: clientInfo.name || 'Not provided',
        clientBio: clientInfo.bio ? `Bio: ${clientInfo.bio}` : '',
        clientNicheTags: clientInfo.nicheTags?.length
          ? `Niches: ${clientInfo.nicheTags.join(', ')}`
          : '',
        clientBusinessInfo: clientInfo.businessInfo
          ? `Business: ${clientInfo.businessInfo}`
          : `Business: Professional in the ${anglesDto.topic} space`,
        clientIndustry: clientInfo.industry
          ? `Industry: ${clientInfo.industry}`
          : '',
        clientVoice: clientInfo.voice ? `Voice: ${clientInfo.voice}` : '',
        topic: anglesDto.topic,
        research: anglesDto.isManualMode 
          ? `MANUAL RESEARCH:
${anglesDto.manualResearch}`
          : `RESEARCH:
${anglesDto.research}`,
        selectedArticle: anglesDto.selectedArticle
          ? `SELECTED ARTICLE:
Title: ${anglesDto.selectedArticle.title}
URL: ${anglesDto.selectedArticle.url || 'Not available'}
Source: ${anglesDto.selectedArticle.source || 'Not available'}
Published: ${anglesDto.selectedArticle.publishedAt || 'Not available'}
Summary: ${anglesDto.selectedArticle.summary}`
          : '',
        customInstructions: anglesDto.customInstructions 
          ? `CUSTOM INSTRUCTIONS:
${anglesDto.customInstructions}`
          : '',
      };

      const promptData = await this.promptsService.renderFullPromptByFeature(
        PromptFeature.GENERATE_ANGLES,
        variables,
      );

      this.logger.debug(
        'Generate angles prompt: ' + promptData.userPrompt.substring(0, 200) + '...',
      );

      this.logger.debug(
        `Prompt character count: ${promptData.userPrompt.length} characters`,
      );

      // Enhanced logging of all variables sent to Claude API
      this.logger.debug(`
===== CLAUDE API GENERATE ANGLES REQUEST - FULL DETAILS =====
ENDPOINT: https://api.anthropic.com/v1/messages
MODEL: ${this.model}
MAX TOKENS: 3000
TEMPERATURE: 0.7
CLIENT INFO: ${JSON.stringify(clientInfo, null, 2)}
TOPIC: ${anglesDto.topic}
RESEARCH LENGTH: ${anglesDto.research.length} characters
MANUAL RESEARCH LENGTH: ${anglesDto.manualResearch?.length || 0} characters
IS MANUAL MODE: ${anglesDto.isManualMode || false}
SELECTED ARTICLE: ${anglesDto.selectedArticle ? anglesDto.selectedArticle.title : 'None'}
CUSTOM INSTRUCTIONS LENGTH: ${anglesDto.customInstructions?.length || 0} characters
PROMPT LENGTH: ${promptData.userPrompt.length} characters
PROMPT PREVIEW: 
${promptData.userPrompt.substring(0, 500)}${promptData.userPrompt.length > 500 ? '...[truncated for log]' : ''}
===== END CLAUDE API GENERATE ANGLES REQUEST =====
`);

      // Log the complete prompt breakdown
      this.logger.debug(`
===== GENERATE ANGLES SYSTEM PROMPT =====
${promptData.systemPrompt ? promptData.systemPrompt : '(No system prompt configured)'}
===== END SYSTEM PROMPT =====

===== GENERATE ANGLES USER PROMPT =====
${promptData.userPrompt}
===== END USER PROMPT =====

===== FULL COMBINED PROMPT SENT TO AI =====
${promptData.fullPrompt}
===== END FULL PROMPT =====
`);

    const url = 'https://api.anthropic.com/v1/messages';
    try {
      const response = await axios.post(
        url,
        {
          model: this.model,
          max_tokens: 3000,
          temperature: 0.7,
          system: promptData.systemPrompt || undefined,
          messages: [{ role: 'user', content: promptData.userPrompt }],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        },
      );

      // Extract the text from the response
      const text = response.data.content[0].text;

      // Extract JSON from the response, handling various formats
        let jsonText = text;

      // Look for JSON in code blocks - the most common format
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonText = jsonMatch[1];
        }

      try {
        // Parse the JSON
        const result = JSON.parse(jsonText);

        // Ensure we have the expected structure
        if (!result.angles || !Array.isArray(result.angles)) {
          throw new Error('Invalid response format: missing angles array');
        }

        // Get the recommended angle
        const recommendedAngle = result.recommendedAngle || result.angles[0];

        return {
          angles: result.angles,
            recommendedAngle,
        };
      } catch (parseError) {
        this.logger.error(
          `Error parsing JSON response: ${parseError.message}`,
        );
        throw new Error(`Failed to parse AI response for angle generation: ${parseError.message}`);
        }
      } catch (error) {
      this.logger.error(`Error in generateAngles: ${error.message}`);
        if (error.response?.data) {
        this.logger.error(
          `API error response: ${JSON.stringify(error.response.data)}`,
        );
        }
        throw error;
      }
    } catch (error) {
    this.logger.error(`Error in generateAngles method: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate hooks for a topic and angle
   * @param topic The topic to generate hooks for
   * @param clientInfo The client information
   * @param selectedAngle The selected content angle
   * @param customInstructions Optional custom instructions
   * @returns Promise with generated hooks
   */
  async generateHooks(hooksDto: GenerateHooksRequestDto) {
    try {
      // Fetch the client information from the database
      const client = await this.clientsService.findOne(hooksDto.clientId);

      // Map the client data to ClientInfoDto format
      const clientInfo = {
        id: client['_id'].toString(),
        name: client.name,
        bio: client.bio,
        nicheTags: client.nicheTags,
        businessInfo: client.businessInfo,
        industry: client.company, // Map company to industry
        voice: client.voice,
      };

      this.logger.debug(
        `Fetched client info for ID ${hooksDto.clientId}: ${JSON.stringify(clientInfo)}`,
      );

      const variables = {
        clientName: clientInfo.name || 'Not provided',
        clientBio: clientInfo.bio ? clientInfo.bio : 'Not provided',
        clientNicheTags: clientInfo.nicheTags?.length
          ? clientInfo.nicheTags.join(', ')
          : 'Not provided',
        clientBusinessInfo: clientInfo.businessInfo
          ? clientInfo.businessInfo
          : `Professional in the ${hooksDto.topic} space`,
        clientIndustry: clientInfo.industry
          ? clientInfo.industry
          : 'Not provided',
        clientVoice: clientInfo.voice ? clientInfo.voice : 'Not provided',
        topic: hooksDto.topic,
        selectedAngleTitle: hooksDto.selectedAngle.title,
        selectedAngleExplanation: hooksDto.selectedAngle.explanation,
        selectedAngleScore: hooksDto.selectedAngle.engagementScore.toString(),
        research: hooksDto.research,
        selectedArticle: hooksDto.selectedArticle
          ? `Title: ${hooksDto.selectedArticle.title}
  URL: ${hooksDto.selectedArticle.url || 'Not available'}
  Source: ${hooksDto.selectedArticle.source || 'Not available'}
  Published: ${hooksDto.selectedArticle.publishedAt || 'Not available'}
Summary: ${hooksDto.selectedArticle.summary}`
          : 'None selected',
        customInstructions: hooksDto.customInstructions || 'None provided',
      };

      const promptData = await this.promptsService.renderFullPromptByFeature(
        PromptFeature.GENERATE_HOOKS,
        variables,
      );

      this.logger.debug(
        `Generated prompt for hooks generation with length: ${promptData.userPrompt.length}`,
      );

      // Log all variables being sent to Claude API
      this.logger.debug(`Sending to Claude API for hooks generation:
        Topic: ${hooksDto.topic}
        Client Name: ${clientInfo.name}
        Client Bio: ${clientInfo.bio?.substring(0, 50)}...
        Client Business Info: ${clientInfo.businessInfo?.substring(0, 50)}...
        Client Industry: ${clientInfo.industry || 'N/A'}
        Client Voice: ${clientInfo.voice?.substring(0, 50) || 'N/A'}...
        Selected Angle: ${hooksDto.selectedAngle.title}
        Research Length: ${hooksDto.research.length} characters
        Research Preview: ${hooksDto.research.substring(0, 200)}${hooksDto.research.length > 200 ? '...' : ''}
        Selected Article: ${hooksDto.selectedArticle ? hooksDto.selectedArticle.title : 'None - No article was provided'}
        Custom Instructions Length: ${hooksDto.customInstructions?.length || 0} characters
      `);

      // Log the full prompt for hooks generation
      this.logger.debug(`
=== GENERATE HOOKS SYSTEM PROMPT ===
${promptData.systemPrompt ? promptData.systemPrompt : '(No system prompt configured)'}
=== END SYSTEM PROMPT ===

=== GENERATE HOOKS USER PROMPT ===
${promptData.userPrompt}
=== END USER PROMPT ===

=== FULL COMBINED PROMPT SENT TO AI ===
${promptData.fullPrompt}
=== END FULL PROMPT ===
      `);

    const url = 'https://api.anthropic.com/v1/messages';

      const response = await axios.post(
        url,
        {
          model: this.model,
          max_tokens: 2048,
            temperature: 0.7,
          system: promptData.systemPrompt || undefined,
          messages: [{ role: 'user', content: promptData.userPrompt }],
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        },
      );

      // Extract the text from the response
      const text = response.data.content[0].text;

      // Extract JSON from the response, handling various formats
      let jsonText = text;

      // Look for JSON in code blocks - the most common format
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonText = jsonMatch[1];
      }

      try {
        // Parse the JSON
        const result = JSON.parse(jsonText);

        // Ensure we have the expected structure
        if (!result.hooks || !Array.isArray(result.hooks)) {
          throw new Error('Invalid response format: missing hooks array');
        }

        // Ensure we have a recommended hook
        const recommendedHook = result.recommendedHook || result.hooks[0];
        if (recommendedHook) {
        recommendedHook.isRecommended = true;
        }

        return {
            hooks: result.hooks,
          recommendedHook,
        };
      } catch (parseError) {
        this.logger.error(
          `Error parsing JSON response: ${parseError.message}`,
        );
        throw new Error(`Failed to parse AI response for hook generation: ${parseError.message}`);
        }
      } catch (error) {
        this.logger.error(`Error calling Claude API: ${error.message}`);
        if (error.response?.data) {
        this.logger.error(
          `API error response: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw error;
    }
  }



















  async complete(prompt: string, maxTokens?: number, temperature?: number) {
    return this.completePrompt({
      prompt,
      maxTokens,
      temperature,
    });
  }

  /**
   * Generate structured output using Claude API
   * @param prompt The prompt to send to Claude
   * @param maxTokens Maximum tokens in the response
   * @param temperature Temperature for generation
   * @param swipeFileBase64 Optional base64-encoded swipe file
   * @returns Promise with the parsed JSON response
   */
  async generateStructuredOutput<T>(
    prompt: string,
    maxTokens = 2048,
    temperature = 0.7,
    swipeFileBase64?: string,
  ): Promise<T> {
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not defined');
    }

    const url = 'https://api.anthropic.com/v1/messages';
    try {
      const response = await axios.post(
        url,
        {
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature: temperature,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
        },
      );

      const text = response.data.content[0].text;
      return JSON.parse(text) as T;
    } catch (error) {
      this.logger.error(`Error generating structured output: ${error.message}`);
      throw error;
    }
  }



  /**
   * Continue a conversation about hook polishing
   * @param polishDto The conversational hook polish request DTO
   * @returns Promise with updated conversation and polished hooks
   */
  async conversationalHookPolish(
    polishDto: ConversationalHookPolishRequestDto,
  ): Promise<HookPolishResponseDto> {
    try {
      if (!this.apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not defined');
      }

      // Use system prompt from DTO parameter
      const systemPrompt = polishDto.systemPrompt;
      if (systemPrompt) {
        this.logger.debug('Using system prompt from DTO parameter');
      } else {
        this.logger.debug('No system prompt provided in DTO');
      }

      // Filter conversation history to exclude hidden messages and system messages (system prompt handled separately)
      const conversationMessages: any[] = polishDto.conversationHistory
        .filter(msg => !msg.isHidden && msg.role !== 'system') // Exclude hidden messages and system messages
        .map((msg: MessageDto) => ({
          role: msg.role,
          content: msg.content,
        }));

      // Add the user's new message
      conversationMessages.push({
        role: 'user',
        content: polishDto.userMessage,
      });

      this.logger.debug(
        `Sending ${conversationMessages.length} messages to Claude for hook polishing with ${systemPrompt ? 'stored' : 'no'} system prompt`,
      );

      // Log all messages being sent to Claude for debugging
      this.logger.debug('=== HOOK POLISHER MESSAGES BEING SENT TO CLAUDE ===');
      if (systemPrompt) {
        this.logger.debug(`System Prompt (passed separately): ${systemPrompt.substring(0, 150)}...`);
      }
      conversationMessages.forEach((msg, index) => {
        this.logger.debug(`Message ${index + 1} (${msg.role}): ${msg.content.substring(0, 150)}...`);
      });
      this.logger.debug('=== END HOOK POLISHER MESSAGES TO CLAUDE ===');

      // Call Claude API with retry logic for rate limiting
      const url = 'https://api.anthropic.com/v1/messages';
      const maxRetries = 3;
      let lastError: any;
      let response: any;
      
      this.logger.debug(`[RETRY DEBUG] Starting API call with ${maxRetries} max retries`);
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          this.logger.debug(`[RETRY DEBUG] Attempt ${attempt}/${maxRetries} - Making API call`);
          response = await axios.post(
            url,
            {
              model: this.model,
              max_tokens: 2000,
              messages: conversationMessages,
              ...(systemPrompt && systemPrompt.trim() ? { system: systemPrompt } : {}), // Only include system if it's not empty
            },
            {
              headers: {
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
              },
            },
          );
          this.logger.debug(`[RETRY DEBUG] Attempt ${attempt}/${maxRetries} - SUCCESS!`);
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          this.logger.debug(`[RETRY DEBUG] Attempt ${attempt}/${maxRetries} - FAILED: ${error.response?.status} ${error.message}`);
          
          // Log the exact request that failed for debugging
          if (error.response?.status === 400) {
            this.logger.error(`400 Bad Request Error Details:
              Request URL: ${url}
              Request Body: ${JSON.stringify({
                model: this.model,
                max_tokens: 2000,
                messages: conversationMessages,
                ...(systemPrompt && systemPrompt.trim() ? { system: systemPrompt } : {}),
              }, null, 2)}
              Response Status: ${error.response?.status}
              Response Data: ${JSON.stringify(error.response?.data, null, 2)}
            `);
          }
          
          // Check if it's a rate limit error (429)
          if (error.response?.status === 429) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
            this.logger.warn(
              `Rate limit hit in conversational hook polish (attempt ${attempt}/${maxRetries}). Waiting ${waitTime}ms before retry...`
            );
            
            if (attempt < maxRetries) {
              this.logger.debug(`[RETRY DEBUG] Waiting ${waitTime}ms before next attempt`);
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            } else {
              this.logger.debug(`[RETRY DEBUG] Final attempt failed, will throw error`);
            }
          }
          
          // For non-rate-limit errors or final attempt, throw immediately
          this.logger.debug(`[RETRY DEBUG] Throwing error for attempt ${attempt}/${maxRetries}`);
          throw error;
        }
      }

      if (!response) {
        this.logger.debug(`[RETRY DEBUG] No response after all retries, throwing last error`);
        throw lastError;
      }
      
      this.logger.debug(`[RETRY DEBUG] Got successful response, processing...`);

      const assistantResponse = response.data.content[0].text;

      // Add assistant's response to conversation history
      conversationMessages.push({
        role: 'assistant',
        content: assistantResponse,
      });

      // For conversational hook polishing, we don't extract specific hooks
      // The response is conversational and may not contain structured hook data
      const polishedHooks: HookDto[] = [];

      // Prepare response
      return {
        polishedHooks,
        response: assistantResponse,
        conversationHistory: conversationMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Error in conversational hook polishing: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Continue a conversation about LinkedIn post generation
   * @param userMessage The user's message
   * @param conversationHistory The conversation history
   * @param systemPrompt The system prompt for LinkedIn post generation
   * @returns Promise with AI response
   */
  async conversationalLinkedInPostChat(options: {
    userMessage: string;
    conversationHistory: { role: string; content: string }[];
    systemPrompt: string;
  }): Promise<{ response: string }> {
    try {
      if (!this.apiKey) {
        throw new Error('ANTHROPIC_API_KEY is not defined');
      }

      // Prepare conversation messages
      const conversationMessages = [...options.conversationHistory];

      // Add the user's new message
      conversationMessages.push({
        role: 'user',
        content: options.userMessage,
      });

      this.logger.debug(
        `Sending ${conversationMessages.length} messages to Claude for LinkedIn post chat with system prompt`,
      );

      // Call Claude API with retry logic for rate limiting
      const url = 'https://api.anthropic.com/v1/messages';
      const maxRetries = 3;
      let lastError: any;
      let response: any;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          response = await axios.post(
            url,
            {
              model: this.model,
              max_tokens: 2000,
              messages: conversationMessages,
              ...(options.systemPrompt && options.systemPrompt.trim() ? { system: options.systemPrompt } : {}),
            },
            {
              headers: {
                'x-api-key': this.apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
              },
            },
          );
          break; // Success, exit retry loop
        } catch (error) {
          lastError = error;

          // Check if it's a rate limit error (429)
          if (error.response?.status === 429) {
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
            this.logger.warn(
              `Rate limit hit in LinkedIn post chat (attempt ${attempt}/${maxRetries}). Waiting ${waitTime}ms before retry...`
            );

            if (attempt < maxRetries) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }
          }

          // For non-rate-limit errors or final attempt, throw immediately
          throw error;
        }
      }

      if (!response) {
        throw lastError;
      }

      const assistantResponse = response.data.content[0].text;

      return {
        response: assistantResponse,
      };
    } catch (error) {
      this.logger.error(
        `Error in conversational LinkedIn post chat: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }




} 
