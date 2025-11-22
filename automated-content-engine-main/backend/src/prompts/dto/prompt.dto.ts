import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PromptFeature, PromptVariable } from '../schemas/prompt.schema';

export interface PromptVariableDto {
  name: string;
  description: string;
  required: boolean;
  type: 'string' | 'object' | 'array';
}

export class CreatePromptDto {
  @IsString()
  name: string;

  @IsEnum(PromptFeature)
  feature: PromptFeature;

  @IsString()
  template: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  availableVariables?: PromptVariableDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdatePromptDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PromptFeature)
  feature?: PromptFeature;

  @IsOptional()
  @IsString()
  template?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  availableVariables?: PromptVariableDto[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class PromptResponseDto {
  _id: string;
  name: string;
  feature: PromptFeature;
  template: string;
  systemPrompt?: string;
  description?: string;
  category?: string;
  availableVariables: PromptVariableDto[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ValidatePromptDto {
  @IsString()
  template: string;

  @IsArray()
  availableVariables: PromptVariableDto[];
}

export interface PromptValidationResult {
  isValid: boolean;
  errors: string[];
  usedVariables: string[];
  unusedVariables: string[];
}
 