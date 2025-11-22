import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  Matches,
  MaxLength,
} from 'class-validator';
import { ArticleDto } from '../../news/dto/news.dto';

export class ContentAngleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  explanation: string;

  @IsNumber()
  engagementScore: number;
}

export class HookDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsOptional()
  isRecommended?: boolean;
}

export class ThreadPostDto {
  @IsNumber()
  position: number;

  @IsString()
  @IsNotEmpty()
  content: string;
}

export class MessageDto {
  @IsString()
  @IsNotEmpty()
  role: 'user' | 'assistant' | 'system';

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  isHidden?: boolean;
}

export class GenerateThreadRequestDto {
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

  @ValidateNested()
  @Type(() => ArticleDto)
  @IsOptional()
  selectedArticle?: ArticleDto;

  @ValidateNested()
  @Type(() => ContentAngleDto)
  @IsObject()
  selectedAngle: ContentAngleDto;

  @ValidateNested()
  @Type(() => HookDto)
  @IsObject()
  selectedHook: HookDto;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @IsOptional()
  maxTokens?: number;
}

export class GenerateThreadResponseDto {
  @IsString()
  @IsNotEmpty()
  thread: string;
}

export class RegeneratePostRequestDto {
  @ValidateNested()
  @Type(() => GenerateThreadRequestDto)
  @IsObject()
  threadData: GenerateThreadRequestDto;
}

export class RegeneratePostResponseDto {
  @IsString()
  @IsNotEmpty()
  thread: string;
}

export class ConversationalEditRequestDto {
  @ValidateNested()
  @Type(() => GenerateThreadRequestDto)
  @IsObject()
  threadData: GenerateThreadRequestDto;

  @IsString()
  @IsNotEmpty()
  thread: string;

  @IsString()
  @IsNotEmpty()
  userMessage: string;

  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  @IsArray()
  conversationHistory: MessageDto[];
}

export class ConversationalEditResponseDto {
  @IsString()
  @IsNotEmpty()
  response: string;

  @IsString()
  @IsNotEmpty()
  thread: string;

  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  @IsArray()
  conversationHistory: MessageDto[];
}

export class SaveThreadRequestDataDto {
  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  research: string;

  @ValidateNested()
  @Type(() => ArticleDto)
  @IsOptional()
  selectedArticle?: ArticleDto;

  @ValidateNested()
  @Type(() => ContentAngleDto)
  @IsObject()
  selectedAngle: ContentAngleDto;

  @ValidateNested()
  @Type(() => HookDto)
  @IsObject()
  selectedHook: HookDto;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsNumber()
  @IsOptional()
  maxTokens?: number;
}

export class SaveThreadRequestDto {
  @ValidateNested()
  @Type(() => SaveThreadRequestDataDto)
  @IsObject()
  threadData: SaveThreadRequestDataDto;

  @IsString()
  @IsNotEmpty()
  thread: string;

  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  @IsArray()
  conversationHistory: MessageDto[];
}

export class SaveThreadResponseDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
