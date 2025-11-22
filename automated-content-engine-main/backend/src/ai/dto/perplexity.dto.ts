import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ArticleDto } from './anthropic.dto';

/**
 * DTO for research query requests
 */
export class ResearchQueryRequestDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ArticleDto)
  article?: ArticleDto;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @IsNumber()
  @Min(0)
  @Max(1.0)
  @IsOptional()
  temperature?: number;
}

/**
 * DTO for raw query requests
 */
export class PerplexityQueryRequestDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsNumber()
  @Min(1)
  @Max(4096)
  @IsOptional()
  maxTokens?: number;

  @IsNumber()
  @Min(0)
  @Max(1.0)
  @IsOptional()
  temperature?: number;
}
