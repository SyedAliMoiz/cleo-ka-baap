import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Module, ModuleDocument } from './schema/module.schema';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { modules } from './constants/hardcoded-modules';
import { GPT_TYPES } from './constants/gpts';
import { FavoritesService } from './favorites.service';

@Injectable()
export class ModulesService {
  constructor(
    @InjectModel(Module.name) private moduleModel: Model<ModuleDocument>,
    private favoritesService: FavoritesService,
  ) {}

  async insert() {
    await this.moduleModel.deleteMany({});
    for (const module of modules) {
      await this.create({
        ...module,
        systemPrompt: GPT_TYPES[module.name] as string,
      });
    }

    return this.findAll();
  }

  async create(createModuleDto: CreateModuleDto): Promise<Module> {
    const createdModule = new this.moduleModel(createModuleDto);
    return createdModule.save();
  }

  async findAll(): Promise<Module[]> {
    return this.moduleModel.find().sort({ position: 1, createdAt: 1 }).exec();
  }

  async findOne(id: string): Promise<Module> {
    const module = await this.moduleModel.findById(id).exec();
    if (!module) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }
    return module;
  }

  async findBySlug(slug: string): Promise<Module> {
    const module = await this.moduleModel.findOne({ slug }).exec();
    if (!module) {
      throw new NotFoundException(`Module with slug ${slug} not found`);
    }
    return module;
  }

  async update(id: string, updateModuleDto: UpdateModuleDto): Promise<Module> {
    const updatedModule = await this.moduleModel
      .findByIdAndUpdate(id, updateModuleDto, { new: true })
      .exec();
    if (!updatedModule) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }
    return updatedModule;
  }

  async remove(id: string): Promise<void> {
    const result = await this.moduleModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }
  }

  async findByTier(tier: string, userId?: string): Promise<any[]> {
    let modules: ModuleDocument[];

    if (tier === 'Pro+') {
      modules = await this.moduleModel
        .find({ isActive: true })
        .sort({ position: 1, createdAt: 1 })
        .exec();
    } else if (tier === 'MVP') {
      modules = await this.moduleModel
        .find({ tier: 'MVP', isActive: true })
        .sort({ position: 1, createdAt: 1 })
        .exec();
    } else {
      return [];
    }

    // If userId is provided, add favorite status
    if (userId) {
      const moduleIds = modules.map((m) => {
        const id = m._id as any;
        return id ? id.toString() : '';
      });
      const favoriteStatuses = await this.favoritesService.getFavoriteStatuses(
        userId,
        moduleIds,
      );

      return modules.map((module) => {
        const moduleObj = module.toObject();
        const moduleId = (module._id as any)?.toString() || '';
        return {
          ...moduleObj,
          isFavorite: favoriteStatuses[moduleId] || false,
        };
      });
    }

    return modules.map((module) => ({
      ...module.toObject(),
      isFavorite: false,
    }));
  }

  async findActive(): Promise<Module[]> {
    return this.moduleModel
      .find({ isActive: true })
      .sort({ position: 1, createdAt: 1 })
      .exec();
  }

  async updatePositions(
    positionUpdates: Array<{ id: string; position: number }>,
  ): Promise<void> {
    const bulkOps = positionUpdates.map((update) => ({
      updateOne: {
        filter: { _id: update.id },
        update: { $set: { position: update.position } },
      },
    }));

    await this.moduleModel.bulkWrite(bulkOps);
  }
}
