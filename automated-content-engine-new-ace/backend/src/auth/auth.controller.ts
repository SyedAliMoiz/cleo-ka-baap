import { Controller, Post, Body, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { AuthRequest } from './guards/jwt-auth.guard';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Protected } from './decorators/auth.decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    return this.authService.login(loginUserDto);
  }

  @Protected()
  @Post('profile')
  async getProfile(@Request() req: AuthRequest) {
    return this.authService.validateUser(req.user.sub);
  }
}
