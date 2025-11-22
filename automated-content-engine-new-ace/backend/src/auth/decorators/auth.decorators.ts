import { applyDecorators, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';

export function Protected() {
  return applyDecorators(UseGuards(JwtAuthGuard));
}

export function AdminProtected() {
  return applyDecorators(UseGuards(JwtAuthGuard, AdminGuard));
}
