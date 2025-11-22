import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ArtifactsService } from './artifacts.service';
import { ArtifactsController } from './artifacts.controller';
import { Artifact, ArtifactSchema } from './schemas/artifact.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Artifact.name, schema: ArtifactSchema }])],
  controllers: [ArtifactsController],
  providers: [ArtifactsService],
  exports: [ArtifactsService],
})
export class ArtifactsModule {}
