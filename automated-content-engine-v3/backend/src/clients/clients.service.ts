import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from './schemas/client.schema';

@Injectable()
export class ClientsService {
  constructor(@InjectModel(Client.name) private clientModel: Model<ClientDocument>) {}

  async create(userId: string, createClientDto: any): Promise<Client> {
    const createdClient = new this.clientModel({ ...createClientDto, userId });
    return createdClient.save();
  }

  async findAllByUser(userId: string): Promise<Client[]> {
    return this.clientModel.find({ userId }).exec();
  }

  async findOne(id: string): Promise<Client | null> {
    return this.clientModel.findById(id).exec();
  }

  async update(id: string, updateClientDto: any): Promise<Client | null> {
    return this.clientModel.findByIdAndUpdate(id, updateClientDto, { new: true }).exec();
  }

  async delete(id: string): Promise<any> {
    return this.clientModel.findByIdAndDelete(id).exec();
  }
}
