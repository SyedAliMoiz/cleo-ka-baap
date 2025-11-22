/**
 * Service for fetching news articles from Google News API via backend
 */
import { apiHelpers } from "./apiClient";

// Define Article interface for standardized response
export interface Article {
  title: string;
  url: string;
  summary: string;
  publishedAt: Date;
  source?: string;
}

// Interface for the response
export interface ArticleResponse {
  clientId: string;
  topic: string;
  articles: Article[];
  topArticles: Article[];
  timestamp: string;
}

// Interface for news request parameters
export interface NewsRequestParams {
  topic: string;
  maxResults?: number;
  customInstructions?: string;
  sortOrder?: "latest" | "relevancy";
  dayRange?: number;
}

/**
 * Service to interact with news API and handle article data
 */
export class NewsService {
  /**
   * Fetch news articles for a specific topic
   * @param topic The topic to search for
   * @param clientId The client ID associated with the request
   * @param maxResults Maximum number of articles to request (default: 40)
   * @param customInstructions Optional custom instructions for research focus
   * @param sortOrder How to sort articles: 'latest' for newest first, 'relevancy' for most relevant (default: 'latest')
   * @param dayRange Number of days to look back for articles (default: 7)
   * @returns Promise with article data
   */
  static async fetchNewsForTopic(
    topic: string,
    clientId: string,
    maxResults: number = 40,
    customInstructions?: string,
    sortOrder: "latest" | "relevancy" = "latest",
    dayRange: number = 7
  ): Promise<ArticleResponse> {
    console.log(
      `Fetching articles for topic: ${topic}, clientId: ${clientId}, maxResults: ${maxResults}, sortOrder: ${sortOrder}, dayRange: ${dayRange}`
    );

    try {
      // Call the backend API using apiHelpers
      const data = await apiHelpers.post<ArticleResponse>(
        `/api/thread-writer/news/${clientId}`,
        {
          topic,
          maxResults,
          customInstructions,
          sortOrder,
          dayRange,
        }
      );

      // Process the response data
      const processedArticles = data.articles.map((article) => ({
        ...article,
        publishedAt: new Date(article.publishedAt),
      }));

      const processedTopArticles = data.topArticles.map((article) => ({
        ...article,
        publishedAt: new Date(article.publishedAt),
      }));

      return {
        clientId: data.clientId,
        topic: data.topic,
        articles: processedArticles,
        topArticles: processedTopArticles,
        timestamp: data.timestamp,
      };
    } catch (error) {
      console.error("Error fetching news articles:", error);
      throw new Error("Failed to fetch news articles");
    }
  }

  /**
   * Fetch latest news articles (convenience method)
   * @param topic The topic to search for
   * @param clientId The client ID associated with the request
   * @param maxResults Maximum number of articles to request (default: 40)
   * @param customInstructions Optional custom instructions for research focus
   * @param dayRange Number of days to look back for articles (default: 3 for very recent)
   * @returns Promise with latest article data
   */
  static async fetchLatestNewsForTopic(
    topic: string,
    clientId: string,
    maxResults: number = 40,
    customInstructions?: string,
    dayRange: number = 3
  ): Promise<ArticleResponse> {
    return this.fetchNewsForTopic(
      topic,
      clientId,
      maxResults,
      customInstructions,
      "latest",
      dayRange
    );
  }
}
