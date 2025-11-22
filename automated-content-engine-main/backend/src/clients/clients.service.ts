import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Client, ClientDocument } from './schemas/client.schema';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { TagExtractorService } from './services/tag-extractor.service';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private clientModel: Model<ClientDocument>,
    private tagExtractorService: TagExtractorService,
  ) {}

  async create(createClientDto: CreateClientDto): Promise<Client> {
    // Extract niche tags using Claude
    const nicheTags = await this.tagExtractorService.extractNicheTags({
      name: createClientDto.name,
      businessInfo: createClientDto.businessInfo,
      goals: createClientDto.goals,
      voice: createClientDto.voice,
      feedback: createClientDto.feedback,
    });

    const newClient = new this.clientModel({
      ...createClientDto,
      nicheTags,
    });

    return newClient.save();
  }

  async findAll(): Promise<Client[]> {
    return this.clientModel.find().sort({ updatedAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Client> {
    const client = await this.clientModel.findById(id).exec();
    if (!client) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
    return client;
  }

  async update(id: string, updateClientDto: UpdateClientDto): Promise<Client> {
    const updatedClient = await this.clientModel
      .findByIdAndUpdate(id, updateClientDto, { new: true })
      .exec();

    if (!updatedClient) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return updatedClient;
  }

  async updateNicheTags(id: string): Promise<Client> {
    const client = await this.findOne(id);

    const nicheTags = await this.tagExtractorService.extractNicheTags({
      name: client.name,
      businessInfo: client.businessInfo,
      goals: client.goals,
      voice: client.voice,
      feedback: client.feedback,
    });

    const updatedClient = await this.clientModel
      .findByIdAndUpdate(id, { nicheTags }, { new: true })
      .exec();

    if (!updatedClient) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return updatedClient;
  }

  async remove(id: string): Promise<void> {
    const result = await this.clientModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }
  }

  async updateVoiceAndGenerateAnalysis(
    id: string,
    voice: string,
  ): Promise<Client> {
    // First update the client's voice
    const updatedClient = await this.clientModel
      .findByIdAndUpdate(id, { voice }, { new: true })
      .exec();

    if (!updatedClient) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    // Then generate analysis based on the updated voice
    return this.generateVoiceAnalysis(id);
  }

  async generateVoiceAnalysis(id: string): Promise<Client> {
    const client = await this.findOne(id);

    if (!client.voice) {
      throw new NotFoundException('No voice sample found for this client');
    }

    // Here you would integrate with an AI service to analyze the voice
    // For now, we'll just update a placeholder field
    const voiceAnalysis =
      'Voice analysis would be generated here using an AI service';

    const updatedClient = await this.clientModel
      .findByIdAndUpdate(id, { voiceAnalysis }, { new: true })
      .exec();

    if (!updatedClient) {
      throw new NotFoundException(`Client with ID ${id} not found`);
    }

    return updatedClient;
  }
}
