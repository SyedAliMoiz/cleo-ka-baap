import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { AnthropicService } from '../services/anthropic.service';
import {
  CompleteRequestDto,
  RankArticlesRequestDto,
  GenerateAnglesRequestDto,
  GenerateHooksRequestDto,
  ThreadRequestDto,
  HookPolishResponseDto,
  ConversationalHookPolishRequestDto,
} from '../dto/anthropic.dto';
import { AuthGuard } from '@nestjs/passport';
import { AppThrottlerGuard } from '../../guards/throttler.guard';

@Controller('api/anthropic')
@UseGuards(AuthGuard('jwt'), AppThrottlerGuard)
export class AnthropicController {
  private readonly logger = new Logger(AnthropicController.name);

  constructor(private readonly anthropicService: AnthropicService) {}

  @Post('complete')
  async complete(@Body() completeDto: CompleteRequestDto) {
    try {
      this.logger.log(
        `Completing prompt with ${completeDto.prompt.length} characters`,
      );
      const result = await this.anthropicService.completePrompt(completeDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error completing prompt: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Error processing request',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('thread')
  async createThread(@Body() threadDto: ThreadRequestDto) {
    try {
      this.logger.log(
        `Creating thread with ${threadDto.messages.length} messages`,
      );
      const result = await this.anthropicService.createThread(threadDto);
      return result;
    } catch (error) {
      this.logger.error(`Error creating thread: ${error.message}`, error.stack);
      throw new HttpException(
        error.message || 'Error processing request',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('rank-articles')
  async rankArticles(@Body() rankDto: RankArticlesRequestDto) {
    try {
      this.logger.log(
        `Ranking ${rankDto.articles.length} articles for topic '${rankDto.topic}'`,
      );
      const result = await this.anthropicService.rankArticles(rankDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error ranking articles: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Error processing request',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-angles')
  async generateAngles(@Body() anglesDto: GenerateAnglesRequestDto) {
    try {
      this.logger.log(`Generating angles for topic '${anglesDto.topic}'`);
      const result = await this.anthropicService.generateAngles(anglesDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error generating angles: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Error processing request',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-hooks')
  async generateHooks(@Body() hooksDto: GenerateHooksRequestDto) {
    try {
      this.logger.log(
        `Generating hooks for topic '${hooksDto.topic}' with angle '${hooksDto.selectedAngle.title}'`,
      );
      const result = await this.anthropicService.generateHooks(hooksDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error generating hooks: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Error processing request',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }



  @Post('conversational-hook-polish')
  async conversationalHookPolish(
    @Body() polishDto: ConversationalHookPolishRequestDto,
  ): Promise<HookPolishResponseDto> {
    try {
      this.logger.log(
        `Processing conversational hook polish for: "${polishDto.hook.substring(0, 50)}..."`,
      );
      const result =
        await this.anthropicService.conversationalHookPolish(polishDto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error in conversational hook polish: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        error.message || 'Error processing request',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}


