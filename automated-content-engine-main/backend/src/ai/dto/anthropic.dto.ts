import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  Length,
  IsUrl,
  Matches,
  MaxLength,
  ArrayMaxSize,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  url: string;

  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsString()
  @IsNotEmpty()
  @IsDateString()
  publishedAt: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, {
    message: 'Source name is too long - maximum length is 100 characters',
  })
  source?: string;
}

export class ClientInfoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, {
    message: 'ID is too long - maximum length is 100 characters',
  })
  @Matches(/^[a-zA-Z0-9_\-\.]+$/, { message: 'ID contains invalid characters' })
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  bio?: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20, { message: 'Too many niche tags - maximum allowed is 20' })
  @MaxLength(50, {
    each: true,
    message: 'Niche tag is too long - maximum length is 50 characters per tag',
  })
  @IsOptional()
  nicheTags?: string[];

  @IsString()
  @IsOptional()
  businessInfo?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, {
    message: 'Industry name is too long - maximum length is 100 characters',
  })
  industry?: string;

  @IsString()
  @IsOptional()
  voice?: string;
}

export class RankArticlesRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleDto)
  @ArrayMaxSize(50, { message: 'Too many articles - maximum allowed is 50' })
  articles: ArticleDto[];

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_\-\.]+$/, {
    message: 'Client ID contains invalid characters',
  })
  clientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200, {
    message: 'Topic is too long - maximum length is 200 characters',
  })
  topic: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, {
    message: 'Cache key is too long - maximum length is 100 characters',
  })
  cacheKey?: string;
}

export class ContentAngleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, {
    message: 'Title is too long - maximum length is 200 characters',
  })
  title: string;

  @IsString()
  @IsNotEmpty()
  explanation: string;

  @IsNumber()
  @Min(1, { message: 'Engagement score must be at least 1' })
  @Max(10, { message: 'Engagement score must be at most 10' })
  engagementScore: number;
}

export class GenerateAnglesRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, {
    message: 'Topic is too long - maximum length is 200 characters',
  })
  topic: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_\-\.]+$/, {
    message: 'Client ID contains invalid characters',
  })
  clientId: string;

  @IsString()
  @IsNotEmpty()
  research: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ArticleDto)
  selectedArticle?: ArticleDto;

  @IsOptional()
  @IsBoolean()
  isManualMode?: boolean;

  @IsOptional()
  @IsString()
  manualResearch?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, {
    message:
      'Custom instructions are too long - maximum length is 2000 characters',
  })
  customInstructions?: string;
}

export class CompleteRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsNumber()
  @Min(100, { message: 'Max tokens must be at least 100' })
  @Max(100000, { message: 'Max tokens must be at most 100000' })
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Temperature must be at least 0' })
  @Max(1, { message: 'Temperature must be at most 1' })
  temperature?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10000, {
    message: 'System prompt is too long - maximum length is 10000 characters',
  })
  system?: string;
}

export class HookDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, {
    message: 'Hook text is too long - maximum length is 500 characters',
  })
  text: string;

  @IsOptional()
  @IsBoolean()
  isRecommended?: boolean;

  @IsOptional()
  @IsString()
  explanation?: string;
}

export class GenerateHooksRequestDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_\-\.]+$/, {
    message: 'Client ID contains invalid characters',
  })
  clientId: string;

  @ValidateNested()
  @Type(() => ContentAngleDto)
  selectedAngle: ContentAngleDto;

  @IsString()
  @IsNotEmpty()
  research: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ArticleDto)
  selectedArticle?: ArticleDto;

  @IsString()
  @IsOptional()
  customInstructions?: string;
}

export class HookCritiqueDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, {
    message: 'Hook text is too long - maximum length is 500 characters',
  })
  text: string;

  @IsString()
  @IsNotEmpty()
  critique: string;
}

export class MessageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^(user|assistant|system)$/, {
    message: 'Role must be user, assistant, or system',
  })
  role: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100000, {
    message: 'Content is too long - maximum length is 100000 characters',
  })
  content: string;

  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;
}

export class ToolDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100, {
    message: 'Tool name is too long - maximum length is 100 characters',
  })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, {
    message: 'Tool description is too long - maximum length is 1000 characters',
  })
  description: string;

  @IsObject()
  @IsNotEmpty()
  parameters: Record<string, any>;
}

export class ThreadRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  @ArrayMaxSize(100, { message: 'Too many messages - maximum allowed is 100' })
  messages: MessageDto[];

  @IsOptional()
  @IsNumber()
  @Min(100, { message: 'Max tokens must be at least 100' })
  @Max(100000, { message: 'Max tokens must be at most 100000' })
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Temperature must be at least 0' })
  @Max(1, { message: 'Temperature must be at most 1' })
  temperature?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToolDto)
  tools?: ToolDto[];

  @IsOptional()
  @IsString()
  @MaxLength(10000, {
    message: 'System prompt is too long - maximum length is 10000 characters',
  })
  system?: string;
}

export class ThreadPostDto {
  @IsNumber()
  position: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(280, {
    message: 'Post content is too long - maximum length is 280 characters',
  })
  content: string;
}

export class ThreadCreationRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];

  @IsNumber()
  @IsOptional()
  maxTokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ToolDto)
  tools?: ToolDto[];

  @IsString()
  @IsOptional()
  system?: string;
}

export class ThreadResponseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100000, {
    message: 'Thread content is too long - maximum length is 100000 characters',
  })
  thread: string;
}

export class XThreadRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200, {
    message: 'Topic is too long - maximum length is 200 characters',
  })
  topic: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_\-\.]+$/, {
    message: 'Client ID contains invalid characters',
  })
  clientId: string;

  @IsString()
  @IsNotEmpty()
  research: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ArticleDto)
  selectedArticle?: ArticleDto;

  @ValidateNested()
  @Type(() => ContentAngleDto)
  selectedAngle: ContentAngleDto;

  @ValidateNested()
  @Type(() => HookDto)
  selectedHook: HookDto;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsNumber()
  @IsOptional()
  @Min(100)
  @Max(4000)
  maxTokens?: number;
}

export class RegeneratePostRequestDto {
  @ValidateNested()
  @Type(() => XThreadRequestDto)
  threadData: XThreadRequestDto;
}

export class RegeneratePostResponseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100000, {
    message: 'Thread content is too long - maximum length is 100000 characters',
  })
  thread: string;
}

export class ConversationalEditRequestDto {
  @ValidateNested()
  @Type(() => XThreadRequestDto)
  threadData: XThreadRequestDto;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100000, {
    message: 'Thread content is too long - maximum length is 100000 characters',
  })
  thread: string;

  @IsString()
  @IsNotEmpty()
  userMessage: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  conversationHistory: MessageDto[];
}

export class ConversationalEditResponseDto {
  @IsString()
  @IsNotEmpty()
  response: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100000, {
    message: 'Thread content is too long - maximum length is 100000 characters',
  })
  thread: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  conversationHistory: MessageDto[];
}

export class HookPolishRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, {
    message: 'Hook text is too long - maximum length is 500 characters',
  })
  hook: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000, {
    message: 'Thread context is too long - maximum length is 10000 characters',
  })
  threadContext?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000, {
    message: 'Research is too long - maximum length is 10000 characters',
  })
  research?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, {
    message: 'Angle is too long - maximum length is 500 characters',
  })
  angle?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  @IsOptional()
  conversationHistory?: MessageDto[];
}

export class HookPolishResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HookDto)
  polishedHooks: HookDto[];

  @IsString()
  @IsNotEmpty()
  response: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  conversationHistory: MessageDto[];
}

export class ConversationalHookPolishRequestDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, {
    message: 'Hook text is too long - maximum length is 500 characters',
  })
  hook: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000, {
    message: 'Thread context is too long - maximum length is 10000 characters',
  })
  threadContext?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000, {
    message: 'Research is too long - maximum length is 10000 characters',
  })
  research?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, {
    message: 'Angle is too long - maximum length is 500 characters',
  })
  angle?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, {
    message: 'User message is too long - maximum length is 1000 characters',
  })
  userMessage: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000, {
    message: 'System prompt is too long - maximum length is 10000 characters',
  })
  systemPrompt?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  conversationHistory: MessageDto[];
}

export class RankedArticleDto {
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

  @IsNumber()
  relevanceScore: number;

  @IsString()
  @IsOptional()
  relevanceExplanation?: string;
}
