import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { ModulesService } from './modules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('modules')
@UseGuards(JwtAuthGuard)
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  async createOrUpdate(@Body() body: any) {
    // Admin check should be here
    return this.modulesService.createOrUpdate(body);
  }

  @Get()
  async findAll() {
    return this.modulesService.findAll();
  }

  @Get(':key')
  async findOne(@Param('key') key: string) {
    return this.modulesService.findByKey(key);
  }

  @Delete(':key')
  async delete(@Param('key') key: string) {
      return this.modulesService.delete(key);
  }
}
