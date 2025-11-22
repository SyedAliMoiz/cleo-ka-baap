import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NewsRequestDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  maxResults: number = 40;

  @IsString()
  @IsOptional()
  customInstructions?: string;

  @IsString()
  @IsIn(['latest', 'relevancy'])
  @IsOptional()
  sortOrder?: 'latest' | 'relevancy' = 'latest';

  @IsNumber()
  @Min(1)
  @Max(30)
  @IsOptional()
  dayRange?: number = 7;
}

export class ArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsString()
  @IsNotEmpty()
  publishedAt: string;

  @IsString()
  @IsOptional()
  source?: string;
}

export class NewsResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleDto)
  articles: ArticleDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleDto)
  topArticles: ArticleDto[];

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  clientId: string;

  @IsString()
  timestamp: string;
}
