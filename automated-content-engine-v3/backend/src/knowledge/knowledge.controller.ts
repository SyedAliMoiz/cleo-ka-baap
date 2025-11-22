import { Controller, Get, Post, UploadedFile, UseInterceptors, Body, Delete, Param, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body('description') description: string) {
    return this.knowledgeService.create(file, description);
  }

  @Get()
  async findAll() {
    return this.knowledgeService.findAll();
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.knowledgeService.delete(id);
  }
}
