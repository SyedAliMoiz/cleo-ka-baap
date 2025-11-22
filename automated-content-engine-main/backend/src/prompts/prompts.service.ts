import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prompt, PromptDocument, PromptFeature } from './schemas/prompt.schema';
import {
  CreatePromptDto,
  UpdatePromptDto,
  PromptResponseDto,
  ValidatePromptDto,
  PromptValidationResult,
} from './dto/prompt.dto';

@Injectable()
export class PromptsService {
  constructor(
    @InjectModel(Prompt.name) private promptModel: Model<PromptDocument>,
  ) {}

  async create(createPromptDto: CreatePromptDto): Promise<PromptResponseDto> {
    // Validate the prompt template before creating
    const validation = this.validatePromptTemplate(
      createPromptDto.template,
      createPromptDto.availableVariables || [],
    );

    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Prompt template validation failed',
        errors: validation.errors,
      });
    }

    const createdPrompt = new this.promptModel(createPromptDto);
    const saved = await createdPrompt.save();
    return this.toResponseDto(saved);
  }

  async findAll(): Promise<PromptResponseDto[]> {
    const prompts = await this.promptModel
      .find()
      .sort({ feature: 1, name: 1 })
      .exec();
    return prompts.map((prompt) => this.toResponseDto(prompt));
  }

  async findByFeature(feature: PromptFeature): Promise<PromptResponseDto[]> {
    const prompts = await this.promptModel
      .find({ feature, isActive: true })
      .sort({ name: 1 })
      .exec();
    return prompts.map((prompt) => this.toResponseDto(prompt));
  }

  async findOne(id: string): Promise<PromptResponseDto> {
    const prompt = await this.promptModel.findById(id).exec();
    if (!prompt) {
      throw new NotFoundException(`Prompt with ID ${id} not found`);
    }
    return this.toResponseDto(prompt);
  }

  async findDefaultByFeature(
    feature: PromptFeature,
  ): Promise<PromptResponseDto | null> {
    const prompt = await this.promptModel
      .findOne({
        feature,
        isDefault: true,
        isActive: true,
      })
      .exec();

    if (!prompt) {
      // If no default found, try to get the first active prompt for this feature
      const firstPrompt = await this.promptModel
        .findOne({
          feature,
          isActive: true,
        })
        .sort({ createdAt: 1 })
        .exec();

      return firstPrompt ? this.toResponseDto(firstPrompt) : null;
    }

    return this.toResponseDto(prompt);
  }

  async update(
    id: string,
    updatePromptDto: UpdatePromptDto,
  ): Promise<PromptResponseDto> {
    // Validate that only one prompt per feature can be default
    if (updatePromptDto.isDefault === true) {
      await this.promptModel
        .updateMany(
          { feature: updatePromptDto.feature, _id: { $ne: id } },
          { $set: { isDefault: false } },
        )
        .exec();
    }

    const updatedPrompt = await this.promptModel
      .findByIdAndUpdate(id, updatePromptDto, { new: true })
      .exec();

    if (!updatedPrompt) {
      throw new NotFoundException(`Prompt with ID ${id} not found`);
    }

    return this.toResponseDto(updatedPrompt);
  }

  async remove(id: string): Promise<void> {
    const result = await this.promptModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Prompt with ID ${id} not found`);
    }
  }

  async validatePrompt(
    validatePromptDto: ValidatePromptDto,
  ): Promise<PromptValidationResult> {
    return this.validatePromptTemplate(
      validatePromptDto.template,
      validatePromptDto.availableVariables,
    );
  }

  async renderPrompt(
    id: string,
    variables: Record<string, any>,
  ): Promise<string> {
    const prompt = await this.findOne(id);
    return this.interpolateTemplate(prompt.template, variables);
  }

  async renderPromptByFeature(
    feature: PromptFeature,
    variables: Record<string, any>,
  ): Promise<string> {
    const prompt = await this.findDefaultByFeature(feature);
    if (!prompt) {
      throw new NotFoundException(
        `No default prompt found for feature: ${feature}`,
      );
    }
    return this.interpolateTemplate(prompt.template, variables);
  }

  async renderFullPromptByFeature(
    feature: PromptFeature,
    variables: Record<string, any>,
  ): Promise<{ systemPrompt: string; userPrompt: string; fullPrompt: string }> {
    const prompt = await this.findDefaultByFeature(feature);
    if (!prompt) {
      throw new NotFoundException(
        `No default prompt found for feature: ${feature}`,
      );
    }
    
    // Now system prompts also support variable interpolation
    const systemPrompt = prompt.systemPrompt 
      ? this.interpolateTemplate(prompt.systemPrompt, variables)
      : '';
    const userPrompt = this.interpolateTemplate(prompt.template, variables);
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${userPrompt}` : userPrompt;
    
    return {
      systemPrompt,
      userPrompt,
      fullPrompt
    };
  }

  private validatePromptTemplate(
    template: string,
    availableVariables: any[],
  ): PromptValidationResult {
    const result: PromptValidationResult = {
      isValid: true,
      errors: [],
      usedVariables: [],
      unusedVariables: [],
    };

    // Extract all variables from the template using regex for double curly braces
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const usedVariables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      usedVariables.add(match[1]);
    }

    result.usedVariables = Array.from(usedVariables);

    // Create a set of available variable names for quick lookup
    const availableVariableNames = new Set(
      availableVariables.map((v) => v.name || v),
    );

    // Check for invalid variables (used but not available)
    const invalidVariables = result.usedVariables.filter(
      (varName) => !availableVariableNames.has(varName),
    );

    if (invalidVariables.length > 0) {
      result.isValid = false;
      result.errors.push(
        `Invalid variables found: ${invalidVariables.join(', ')}. These variables are not in the available variables list.`,
      );
    }

    // Find unused variables
    result.unusedVariables = Array.from(availableVariableNames).filter(
      (varName) => !usedVariables.has(varName),
    );

    // Check for required variables that are not used
    const requiredVariables = availableVariables
      .filter((v) => v.required !== false)
      .map((v) => v.name || v);

    const missingRequiredVariables = requiredVariables.filter(
      (varName) => !usedVariables.has(varName),
    );

    if (missingRequiredVariables.length > 0) {
      result.errors.push(
        `Required variables not used: ${missingRequiredVariables.join(', ')}`,
      );
    }

    // Check for malformed variable syntax
    const malformedRegex = /\{\{[^}]*$/g;
    if (malformedRegex.test(template)) {
      result.isValid = false;
      result.errors.push(
        'Malformed variable syntax detected. Make sure all variables are properly closed with }}',
      );
    }

    return result;
  }

  private interpolateTemplate(
    template: string,
    variables: Record<string, any>,
  ): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const value = variables[variableName];
      if (value === undefined || value === null) {
        return match; // Keep the original placeholder if no value provided
      }
      return typeof value === 'object'
        ? JSON.stringify(value, null, 2)
        : String(value);
    });
  }

  private toResponseDto(prompt: PromptDocument): PromptResponseDto {
    return {
      _id: (prompt._id as any).toString(),
      name: prompt.name,
      feature: prompt.feature,
      template: prompt.template,
      systemPrompt: prompt.systemPrompt,
      description: prompt.description,
      category: prompt.category,
      availableVariables: prompt.availableVariables || [],
      isActive: prompt.isActive,
      isDefault: prompt.isDefault,
      createdAt: (prompt as any).createdAt,
      updatedAt: (prompt as any).updatedAt,
    };
  }
}
