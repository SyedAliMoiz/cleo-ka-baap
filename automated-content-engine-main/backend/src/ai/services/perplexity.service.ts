import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { ArticleDto } from '../dto/anthropic.dto';

@Injectable()
export class PerplexityService {
  private readonly logger = new Logger(PerplexityService.name);
  private readonly apiKey: string | undefined;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly temperature: number;

  constructor(private configService: ConfigService) {
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

    // Specifically log if PERPLEXITY_API_KEY exists (without revealing the key)
    const hasPerplexityKey = !!process.env.PERPLEXITY_API_KEY;
    this.logger.debug(
      `PERPLEXITY_API_KEY exists in process.env: ${hasPerplexityKey}`,
    );

    // Get API key from config service
    this.apiKey = this.configService.get<string>('PERPLEXITY_API_KEY');

    // If not found via ConfigService, try directly from process.env as a fallback
    if (!this.apiKey && process.env.PERPLEXITY_API_KEY) {
      this.logger.log(
        'Falling back to direct process.env access for PERPLEXITY_API_KEY',
      );
      this.apiKey = process.env.PERPLEXITY_API_KEY;
    }

    this.model = 'sonar-pro';
    this.maxTokens = 8000;
    this.temperature = 0.25;

    if (!this.apiKey) {
      this.logger.warn(
        'PERPLEXITY_API_KEY is not defined in environment variables or is empty',
      );
    } else {
      this.logger.log(
        'Successfully loaded PERPLEXITY_API_KEY from environment variables',
      );
    }
  }

  /**
   * Send a query to the Perplexity API
   * @param query The query to send to the API
   * @param options Additional options to customize the request
   * @returns The API response
   */
  async query(userPrompt: string, options: any = {}) {
    if (!this.apiKey) {
      throw new Error('Perplexity API key is not configured');
    }

    // Default system prompt for best research output
    const systemPrompt =
      options.systemPrompt ||
      'You are an expert research assistant. Provide comprehensive, factual, and well-cited research reports. Base your answer strictly on the information provided and credible, up-to-date sources. Structure your answer with clear headings, key insights, statistics, and references.';

    // Compose messages array with system + user
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    // Log ALL variables being sent to the API
    this.logger.debug(`
      ===== PERPLEXITY API REQUEST - FULL DETAILS =====
      ENDPOINT: https://api.perplexity.ai/chat/completions
      MODEL: ${this.model}
      MAX_TOKENS: ${this.maxTokens}
      TEMPERATURE: ${this.temperature}

      SYSTEM PROMPT: 
      ${systemPrompt}

      USER PROMPT (${userPrompt.length} chars): 
      ${userPrompt.substring(0, 500)}${userPrompt.length > 500 ? '...[truncated for log]' : ''}

      FULL MESSAGES ARRAY:
      ${JSON.stringify(messages, null, 2)}

      OTHER OPTIONS: ${JSON.stringify(options, null, 2)}
      ===== END PERPLEXITY API REQUEST =====
    `);

    try {
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: this.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          messages,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      // Log response metadata (not the full content to avoid huge logs)
      this.logger.debug(`
        ===== PERPLEXITY API RESPONSE - METADATA =====
        STATUS: ${response.status}
        STATUS TEXT: ${response.statusText}
        RESPONSE TIME: ${response.headers['x-response-time'] || 'N/A'}
        CONTENT LENGTH: ${response.data.choices?.[0]?.message?.content?.length || 'Unknown'} characters
        USAGE TOKENS: ${JSON.stringify(response.data.usage || 'Unknown')}
        ===== END PERPLEXITY API RESPONSE =====
      `);

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error calling Perplexity API: ${error.message}`,
        error.stack,
      );
      if (error.response?.data) {
        this.logger.error(
          `API error response: ${JSON.stringify(error.response.data)}`,
        );
      }
      throw new Error(
        `Failed to get response from Perplexity: ${error.message}`,
      );
    }
  }

  /**
   * Generate detailed research based solely on article context.
   * @param article - Article object (title, summary, fullText, author, date, etc.)
   * @returns Research content
   */
  /**
   * Generate detailed research based solely on ArticleDto context.
   * @param article - ArticleDto object
   * @returns Research content
   */
  async generateResearch(article: ArticleDto) {
    if (!article) {
      throw new Error('Article context must be provided.');
    }

    // Log complete article details
    this.logger.debug(`
      ===== GENERATE RESEARCH - ARTICLE DETAILS =====
      TITLE: ${article.title}
      URL: ${article.url}
      SOURCE: ${article.source || 'N/A'}
      PUBLISHED: ${article.publishedAt || 'N/A'}
      SUMMARY LENGTH: ${article.summary?.length || 0} characters
      SUMMARY: ${article.summary?.substring(0, 300)}${article.summary?.length > 300 ? '...[truncated for log]' : ''}
      FULL ARTICLE OBJECT: ${JSON.stringify(article, null, 2)}
      ===== END ARTICLE DETAILS =====
    `);

    // Build user prompt using only available fields
    const userPrompt = `
    You are given an article to analyze and expand on for in-depth research purposes.

    Title: ${article.title}
    Source: ${article.source || 'N/A'}
    Published At: ${article.publishedAt}
    URL: ${article.url}
    Summary: ${article.summary}

    Instructions:
    - Analyze the key arguments, findings, and claims in this article.
    - Provide additional research, context, and expert opinions relevant to this article.
    - Include up-to-date statistics, major trends, and references to credible sources where appropriate.
    - Present your answer in well-organized sections (such as Introduction, Key Points, Further Context, Conclusion).
    - If helpful, cite additional sources for new facts or trends you mention.
    - Do NOT add unrelated information or speculate outside the article's context.
    `;

    const systemPrompt =
      'You are an expert research assistant. Provide comprehensive, accurate, and well-cited research reports. Follow the instructions carefully, and organize your answer with clear headings.';

    try {
      const response = await this.query(userPrompt, { systemPrompt });

      // Log the research result metadata
      this.logger.debug(`
        ===== RESEARCH GENERATION RESULT =====
        ARTICLE TITLE: ${article.title}
        RESEARCH LENGTH: ${response.choices[0].message.content.length} characters
        RESEARCH PREVIEW: ${response.choices[0].message.content.substring(0, 300)}${response.choices[0].message.content.length > 300 ? '...[truncated for log]' : ''}
        TIMESTAMP: ${new Date().toISOString()}
        ===== END RESEARCH GENERATION RESULT =====
      `);

      return {
        research: response.choices[0].message.content,
        articleTitle: article.title,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error generating research: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to generate research: ${error.message}`);
    }
  }
}
