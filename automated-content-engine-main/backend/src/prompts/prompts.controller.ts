import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { PromptsService } from './prompts.service';
import {
  CreatePromptDto,
  UpdatePromptDto,
  PromptResponseDto,
  ValidatePromptDto,
  PromptValidationResult,
} from './dto/prompt.dto';
import { PromptFeature } from './schemas/prompt.schema';

@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  @Post()
  async create(
    @Body(ValidationPipe) createPromptDto: CreatePromptDto,
  ): Promise<PromptResponseDto> {
    return this.promptsService.create(createPromptDto);
  }

  @Get()
  async findAll(
    @Query('feature') feature?: PromptFeature,
  ): Promise<PromptResponseDto[]> {
    if (feature) {
      return this.promptsService.findByFeature(feature);
    }
    return this.promptsService.findAll();
  }

  @Get('features')
  async getFeatures(): Promise<string[]> {
    return Object.values(PromptFeature);
  }

  @Get('default/:feature')
  async findDefaultByFeature(
    @Param('feature') feature: PromptFeature,
  ): Promise<PromptResponseDto | null> {
    return this.promptsService.findDefaultByFeature(feature);
  }

  @Post('validate')
  async validatePrompt(
    @Body(ValidationPipe) validatePromptDto: ValidatePromptDto,
  ): Promise<PromptValidationResult> {
    return this.promptsService.validatePrompt(validatePromptDto);
  }

  @Post('render/:id')
  async renderPrompt(
    @Param('id') id: string,
    @Body() variables: Record<string, any>,
  ): Promise<{ renderedPrompt: string }> {
    const renderedPrompt = await this.promptsService.renderPrompt(
      id,
      variables,
    );
    return { renderedPrompt };
  }

  @Post('render/feature/:feature')
  async renderPromptByFeature(
    @Param('feature') feature: PromptFeature,
    @Body() variables: Record<string, any>,
  ): Promise<{ renderedPrompt: string }> {
    const renderedPrompt = await this.promptsService.renderPromptByFeature(
      feature,
      variables,
    );
    return { renderedPrompt };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PromptResponseDto> {
    return this.promptsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updatePromptDto: UpdatePromptDto,
  ): Promise<PromptResponseDto> {
    return this.promptsService.update(id, updatePromptDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.promptsService.remove(id);
    return { message: 'Prompt deleted successfully' };
  }
}
