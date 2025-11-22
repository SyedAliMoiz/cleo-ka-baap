import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  // Hardcoded credentials for the MVP
  private readonly adminUsername = 'admin';
  // Generated hash for 'ace_admin_4711'
  private readonly adminPasswordHash =
    '$2b$10$UywDXqAAGPip4mxhON3cfeGKAUk5fCltnyLm0EcohCl8bKj6rquBG';

  constructor(private jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<boolean> {
    // Check if username matches
    if (username !== this.adminUsername) {
      return false;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      this.adminPasswordHash,
    );
    return isPasswordValid;
  }

  async login(username: string, password: string) {
    // Validate user credentials
    const isValid = await this.validateUser(username, password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { username: username, sub: 'admin' };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
