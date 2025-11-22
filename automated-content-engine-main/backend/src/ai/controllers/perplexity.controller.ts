import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { PerplexityService } from '../services/perplexity.service';
import {
  PerplexityQueryRequestDto,
  ResearchQueryRequestDto,
} from '../dto/perplexity.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('api/perplexity')
export class PerplexityController {
  private readonly logger = new Logger(PerplexityController.name);

  constructor(private readonly perplexityService: PerplexityService) {}

  @Post('query')
  @UseGuards(AuthGuard('jwt'))
  async query(@Body() queryDto: PerplexityQueryRequestDto) {
    try {
      this.logger.log('Received request to /api/perplexity/query');
      return await this.perplexityService.query(queryDto.query, {
        model: queryDto.model,
        maxTokens: queryDto.maxTokens,
        temperature: queryDto.temperature,
      });
    } catch (error) {
      this.logger.error(
        `Error in /api/perplexity/query: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to process query',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('research')
  @UseGuards(AuthGuard('jwt'))
  async research(@Body() researchDto: ResearchQueryRequestDto) {
    try {
      this.logger.log('Received request to /api/perplexity/research');

      // Log the request properties for debugging
      this.logger.debug(`Topic: ${researchDto.topic || 'not provided'}`);
      this.logger.debug(`Article provided: ${!!researchDto.article}`);

      return await this.perplexityService.generateResearch(
        researchDto.article!,
      );
    } catch (error) {
      this.logger.error(
        `Error in /api/perplexity/research: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Failed to generate research',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
