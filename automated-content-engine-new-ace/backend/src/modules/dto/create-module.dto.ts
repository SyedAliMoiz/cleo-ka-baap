export class CreateModuleDto {
  name: string;
  tier: string;
  coverImage: string;
  description?: string;
  isActive?: boolean;
  position?: number;
  isRecommended?: boolean;
  systemPrompt?: string;
  emptyStateText?: string;
  temperature?: number;
  slug: string;
}
