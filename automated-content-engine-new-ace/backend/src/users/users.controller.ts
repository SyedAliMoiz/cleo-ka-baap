import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthRequest } from '../auth/guards/jwt-auth.guard';
import { Protected, AdminProtected } from '../auth/decorators/auth.decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @AdminProtected()
  @Post()
  create(
    @Body()
    body: {
      email: string;
      password: string;
      isAdmin?: boolean;
      tier?: string;
    },
  ) {
    return this.usersService.create(body as any);
  }

  @AdminProtected()
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Protected()
  @Get('profile')
  getProfile(@Request() req: AuthRequest) {
    return this.usersService.findOne(req.user.sub);
  }

  @AdminProtected()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Protected()
  @Patch('profile')
  updateProfile(
    @Request() req: AuthRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.sub, updateUserDto);
  }

  @AdminProtected()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @AdminProtected()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Protected()
  @Post('change-password')
  changePassword(
    @Request() req: AuthRequest,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(
      req.user.sub,
      body.oldPassword,
      body.newPassword,
    );
  }
}
