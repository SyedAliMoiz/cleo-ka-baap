import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ArtifactsService } from './artifacts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('artifacts')
@UseGuards(JwtAuthGuard)
export class ArtifactsController {
  constructor(private readonly artifactsService: ArtifactsService) {}

  @Post()
  create(@Body() createArtifactDto: any) {
    return this.artifactsService.create(createArtifactDto);
  }

  @Get()
  findAll(@Query('clientId') clientId: string) {
    return this.artifactsService.findAllByClient(clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.artifactsService.findOne(id);
  }
}
