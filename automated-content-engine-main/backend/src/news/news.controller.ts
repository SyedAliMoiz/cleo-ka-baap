import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsRequestDto, NewsResponseDto } from './dto/news.dto';

@Controller('api/thread-writer/news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  /**
   * Get news articles for a specific topic and client
   * @param clientId The client ID
   * @param newsRequestDto The request body containing the topic and maxResults
   * @returns News response containing articles
   */
  @Post(':clientId')
  async getNews(
    @Param('clientId') clientId: string,
    @Body() newsRequestDto: NewsRequestDto,
  ): Promise<NewsResponseDto> {
    return this.newsService.fetchNews(
      newsRequestDto.topic,
      clientId,
      newsRequestDto.maxResults,
    );
  }
}
