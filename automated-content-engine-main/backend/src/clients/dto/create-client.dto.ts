import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsString()
  businessInfo: string;

  @IsString()
  goals: string;

  @IsString()
  @IsOptional()
  voice?: string;

  @IsString()
  @IsOptional()
  voiceAnalysis?: string;

  @IsString()
  @IsOptional()
  feedback?: string;

  @IsArray()
  @IsOptional()
  nicheTags?: string[];

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  bio: string;
}
