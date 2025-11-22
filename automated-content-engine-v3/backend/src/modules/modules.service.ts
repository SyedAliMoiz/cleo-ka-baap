import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ModuleConfig, ModuleConfigDocument } from './schemas/module-config.schema';

@Injectable()
export class ModulesService {
  constructor(@InjectModel(ModuleConfig.name) private moduleModel: Model<ModuleConfigDocument>) {}

  async createOrUpdate(createModuleDto: any): Promise<ModuleConfig> {
    return this.moduleModel.findOneAndUpdate(
      { key: createModuleDto.key },
      createModuleDto,
      { upsert: true, new: true },
    );
  }

  async findAll(): Promise<ModuleConfig[]> {
    return this.moduleModel.find().exec();
  }

  async findByKey(key: string): Promise<ModuleConfig | null> {
    return this.moduleModel.findOne({ key }).exec();
  }

  async delete(key: string): Promise<any> {
      return this.moduleModel.deleteOne({ key }).exec();
  }
}
