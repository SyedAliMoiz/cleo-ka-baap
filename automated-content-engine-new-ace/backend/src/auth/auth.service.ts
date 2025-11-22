import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { CustomJwtService } from './jwt.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private customJwtService: CustomJwtService,
  ) {}

  async login(loginUserDto: LoginUserDto): Promise<AuthResponseDto> {
    const user = await this.usersService.validateUser(loginUserDto);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: (user._id as string).toString(),
      email: user.email,
    };
    const access_token = this.customJwtService.generateToken(payload);

    return {
      access_token,
      user: {
        id: (user._id as string).toString(),
        email: user.email,
        isAdmin: user.isAdmin,
        tier: user.tier,
      },
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findOne(userId);
  }
}
