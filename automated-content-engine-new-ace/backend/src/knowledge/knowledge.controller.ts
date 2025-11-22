import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminProtected } from 'src/auth/decorators/auth.decorators';
import { KnowledgeService } from './knowledge.service';

@AdminProtected()
@Controller('knowledge')
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('moduleSlug') moduleSlug: string,
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (!moduleSlug) {
      throw new Error('Module slug is required');
    }

    // Only allow text files for now
    if (
      !file.mimetype.startsWith('text/') &&
      file.mimetype !== 'application/octet-stream'
    ) {
      throw new Error('Only text files are supported');
    }

    return this.knowledgeService.ingestTxt(moduleSlug, file);
  }

  @Get('files/:moduleSlug')
  async getFilesByModule(@Param('moduleSlug') moduleSlug: string) {
    return this.knowledgeService.getFilesByModule(moduleSlug);
  }

  @Get('stats/:moduleSlug')
  async getFileStats(@Param('moduleSlug') moduleSlug: string) {
    return this.knowledgeService.getFileStats(moduleSlug);
  }

  @Delete('files/:fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    await this.knowledgeService.deleteFile(fileId);
    return { message: 'File deleted successfully' };
  }

  @Get('download/:fileId')
  async downloadFile(@Param('fileId') fileId: string, @Res() res: Response) {
    const file = await this.knowledgeService.getFileById(fileId);

    res.setHeader('Content-Type', file.mimeType || 'text/plain; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    res.send(file.text || '');
  }

  @Get('preview/:moduleSlug')
  async previewKnowledge(@Param('moduleSlug') moduleSlug: string) {
    const knowledge =
      await this.knowledgeService.getAllKnowledgeForModule(moduleSlug);
    const stats = await this.knowledgeService.getFileStats(moduleSlug);

    return {
      moduleSlug,
      stats,
      knowledgeLength: knowledge.length,
      knowledge: knowledge || 'No knowledge files found',
    };
  }
}
