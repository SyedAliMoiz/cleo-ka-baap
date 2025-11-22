'use client';

import { apiHelpers } from './apiClient';
import { Article } from './newsService';

/**
 * Interface for research response
 */
export interface ResearchResponse {
  research: string;
  topic: string;
  timestamp: string;
}

/**
 * Interface for research cache entry
 */
export interface ResearchCacheEntry {
  research: string;
  topic: string;
  articleUrl?: string;
  timestamp: string;
  expiresAt: Date;
}

/**
 * Service for handling research operations using Perplexity API
 */
export class ResearchService {
  private static cache: Map<string, ResearchCacheEntry> = new Map();
  private static readonly CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  /**
   * Get research for a topic with optional article context
   * @param topic The topic to research
   * @param article Optional article for context
   * @returns Research response
   */
  static async getResearchForTopic(topic: string, article?: Article): Promise<ResearchResponse> {
    // Generate cache key
    const cacheKey = article ? `${topic}-${article.url}` : topic;
    
    // Check cache first
    const cachedEntry = this.cache.get(cacheKey);
    if (cachedEntry && new Date() < new Date(cachedEntry.expiresAt)) {
      console.log('Using cached research for:', topic);
      return {
        research: cachedEntry.research,
        topic: cachedEntry.topic,
        timestamp: cachedEntry.timestamp
      };
    }
    
    try {
      console.log('Fetching research for:', topic);
      
      // Clean the article object if it exists to ensure it only has the expected properties
      let cleanedArticle: Article | undefined;
      if (article) {
        // Only include the properties defined in the ArticleDto
        cleanedArticle = {
          title: article.title,
          url: article.url,
          summary: article.summary,
          publishedAt: article.publishedAt,
          source: article.source,
        };
      }
      
      // Call the backend API using apiHelpers
      const response = await apiHelpers.post<ResearchResponse>('/api/perplexity/research', {
        topic,
        article: cleanedArticle
      });
      
      // Store in cache
      this.cache.set(cacheKey, {
        research: response.research,
        topic: response.topic,
        articleUrl: article?.url,
        timestamp: response.timestamp,
        expiresAt: new Date(Date.now() + this.CACHE_EXPIRY)
      });
      
      return response;
    } catch (error) {
      console.error('Error fetching research:', error);
      throw new Error('Failed to fetch research. Please try again later.');
    }
  }

  /**
   * Clear the research cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
} 