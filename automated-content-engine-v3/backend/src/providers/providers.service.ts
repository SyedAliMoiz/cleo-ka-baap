import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider, ProviderDocument } from './schemas/provider.schema';

@Injectable()
export class ProvidersService {
  constructor(@InjectModel(Provider.name) private providerModel: Model<ProviderDocument>) {}

  async setKey(type: string, apiKey: string): Promise<Provider> {
    return this.providerModel.findOneAndUpdate(
      { type },
      { type, apiKey, isActive: true },
      { upsert: true, new: true },
    );
  }

  async getKey(type: string): Promise<string | null> {
    const provider = await this.providerModel.findOne({ type }).exec();
    return provider ? provider.apiKey : null;
  }

  async listActive(): Promise<Provider[]> {
    return this.providerModel.find({ isActive: true }).select('-apiKey').exec();
  }
}
