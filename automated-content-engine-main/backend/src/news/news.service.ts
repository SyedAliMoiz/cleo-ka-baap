import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ArticleDto, NewsResponseDto } from './dto/news.dto';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly newsApiKey: string | undefined;
  private readonly newsApiUrl = 'https://newsapi.org/v2/everything';

  constructor(private configService: ConfigService) {
    this.newsApiKey = this.configService.get<string>('GOOGLE_NEWS_API_KEY');

    if (!this.newsApiKey) {
      this.logger.warn(
        'GOOGLE_NEWS_API_KEY is not configured. News fetching will not work.',
      );
    }
  }

  /**
   * Fetch news articles for a specific topic
   * @param topic The topic to search for
   * @param clientId The client ID associated with the request
   * @param maxResults The maximum number of articles to fetch (default: 40)
   * @param customInstructions Optional custom instructions for research focus
   * @param sortOrder How to sort the articles: 'latest' for newest first, 'relevancy' for most relevant (default: 'latest')
   * @param dayRange Number of days to look back for articles (default: 7)
   * @returns The fetched news articles and top 10 most relevant ones
   */
  async fetchNews(
    topic: string,
    clientId: string,
    maxResults: number = 40,
    customInstructions?: string,
    sortOrder: 'latest' | 'relevancy' = 'latest',
    dayRange: number = 3,
  ): Promise<NewsResponseDto> {
    try {
      if (!this.newsApiKey) {
        throw new HttpException(
          'News API key is not configured',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Customize the search query if custom instructions are provided
      let searchQuery = topic;
      if (customInstructions) {
        this.logger.log(
          `Using custom instructions for search: ${customInstructions}`,
        );
        searchQuery = `${topic} ${customInstructions}`;
      }

      // Calculate date range for recent articles
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - dayRange);
      const fromDateString = fromDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      // Determine sort parameter based on sortOrder
      const sortBy = sortOrder === 'latest' ? 'publishedAt' : 'relevancy';

      this.logger.log(
        `Fetching news for topic "${topic}" - Sort: ${sortBy}, Days back: ${dayRange}, Max results: ${maxResults}`,
      );

      // Make API request to NewsAPI.org
      const response = await axios.get(this.newsApiUrl, {
        params: {
          q: searchQuery,
          sortBy: sortBy,
          pageSize: maxResults,
          language: 'en',
          from: fromDateString, // Only get articles from the specified day range
          apiKey: this.newsApiKey,
        },
      });

      if (response.status !== 200) {
        this.logger.error(
          `News API error: ${response.status} ${response.statusText}`,
        );
        throw new HttpException(
          'Failed to fetch news from the API',
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Transform data to match our DTO
      const articles: ArticleDto[] = response.data.articles.map(
        (article: any) => {
          return {
            title: article.title,
            url: article.url,
            summary: article.description || '',
            publishedAt: new Date(article.publishedAt),
            source: article.source?.name || '',
          };
        },
      );

      // Get the top 10 articles (the first 10 from already relevance-sorted results)
      const topArticles = articles.slice(0, 10);

      return {
        clientId,
        topic,
        articles,
        topArticles,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error fetching news', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to fetch news articles: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
