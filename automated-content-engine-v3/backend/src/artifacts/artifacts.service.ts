import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Artifact, ArtifactDocument } from './schemas/artifact.schema';

@Injectable()
export class ArtifactsService {
  constructor(@InjectModel(Artifact.name) private artifactModel: Model<ArtifactDocument>) {}

  async create(createArtifactDto: any): Promise<Artifact> {
    const createdArtifact = new this.artifactModel(createArtifactDto);
    return createdArtifact.save();
  }

  async findAllByClient(clientId: string): Promise<Artifact[]> {
    return this.artifactModel.find({ clientId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Artifact | null> {
    return this.artifactModel.findById(id).exec();
  }
}
