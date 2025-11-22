import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TagExtractorService {
  constructor(private configService: ConfigService) {}

  async extractNicheTags(clientData: {
    name: string;
    businessInfo: string;
    goals: string;
    voice?: string;
    feedback?: string;
  }): Promise<string[]> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not defined in environment variables',
      );
    }

    try {
      // Create a prompt for Claude to extract niche tags
      const prompt = `
      You are a professional tag extractor for a content marketing platform. I'll provide you with information about a client, and your task is to extract 3-7 specific niche tags that accurately represent their business domain, target audience, and content strategy.

      The tags should be:
      - Specific and descriptive (e.g., "SaaS Marketing" is better than just "Marketing")
      - Relevant to content strategy
      - Useful for categorizing content
      - Between 1-3 words each
      
      Here's the client information:
      
      Name: ${clientData.name}
      
      Business Information:
      ${clientData.businessInfo}
      
      Goals:
      ${clientData.goals}
      
      ${clientData.voice ? `Voice Sample: ${clientData.voice}` : ''}
      ${clientData.feedback ? `Feedback: ${clientData.feedback}` : ''}
      
      Return ONLY a JSON array of strings containing the niche tags, with no additional explanation. For example:
      ["B2B SaaS", "FinTech", "Thought Leadership", "Executive Branding", "LinkedIn Marketing"]
      `;

      // Call Claude API
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        },
        {
          headers: {
            'anthropic-version': '2023-06-01',
            'x-api-key': apiKey,
            'content-type': 'application/json',
          },
        },
      );

      // Extract and parse the JSON response
      const content = response.data.content[0].text;
      // Clean up any potential markdown formatting or text before the JSON array
      const jsonMatch = content.match(/\[\s*"[^"]*"(?:\s*,\s*"[^"]*")*\s*\]/);

      if (jsonMatch) {
        const tagsArray = JSON.parse(jsonMatch[0]);
        return tagsArray;
      }

      // Fallback if the response isn't in the expected format
      return [];
    } catch (error) {
      console.error('Error extracting niche tags:', error);
      return [];
    }
  }
}
