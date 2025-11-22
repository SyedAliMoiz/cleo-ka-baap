import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// import { RolesGuard } from '../auth/roles.guard'; // Assume Role Guard exists or just Admin check

@Controller('providers')
@UseGuards(JwtAuthGuard)
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post()
  async setKey(@Body() body: { type: string; apiKey: string }) {
    // In real app: Check if user is Admin
    return this.providersService.setKey(body.type, body.apiKey);
  }

  @Get()
  async list() {
    return this.providersService.listActive();
  }
}
