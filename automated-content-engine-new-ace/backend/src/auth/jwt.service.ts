import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email: string;
}

export interface RequestUser extends JwtPayload {
  isAdmin: boolean;
  tier: string;
}

@Injectable()
export class CustomJwtService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async verifyToken(token: string): Promise<RequestUser | null> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      const user = await this.usersService.findOne(payload.sub);
      if (!user) {
        return null;
      }

      return {
        sub: payload.sub,
        email: payload.email,
        isAdmin: user.isAdmin,
        tier: user.tier,
      };
    } catch {
      return null;
    }
  }

  generateToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }
}
