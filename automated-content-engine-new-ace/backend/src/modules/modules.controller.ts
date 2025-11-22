import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { AuthRequest } from 'src/auth/guards/jwt-auth.guard';
import { AdminProtected, Protected } from '../auth/decorators/auth.decorators';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { ModulesService } from './modules.service';
import { FavoritesService } from './favorites.service';

@Controller('modules')
export class ModulesController {
  constructor(
    private readonly modulesService: ModulesService,
    private readonly favoritesService: FavoritesService,
  ) {}

  @Get('test')
  insert() {
    return this.modulesService.insert();
  }

  @AdminProtected()
  @Post()
  create(@Body() createModuleDto: CreateModuleDto) {
    return this.modulesService.create(createModuleDto);
  }

  @AdminProtected()
  @Get('all')
  findAll() {
    return this.modulesService.findAll();
  }

  @Protected()
  @Get()
  findUserModules(@Req() req: AuthRequest) {
    return this.modulesService.findByTier(req.user.tier, req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.modulesService.findBySlug(slug);
  }

  @AdminProtected()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto) {
    return this.modulesService.update(id, updateModuleDto);
  }

  @AdminProtected()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.modulesService.remove(id);
  }

  @Protected()
  @Post(':id/favorite')
  addFavorite(@Param('id') moduleId: string, @Req() req: AuthRequest) {
    return this.favoritesService.addFavorite(req.user.sub, moduleId);
  }

  @Protected()
  @Delete(':id/favorite')
  removeFavorite(@Param('id') moduleId: string, @Req() req: AuthRequest) {
    return this.favoritesService.removeFavorite(req.user.sub, moduleId);
  }

  @Protected()
  @Get('favorites/list')
  getFavorites(@Req() req: AuthRequest) {
    return this.favoritesService.getUserFavorites(req.user.sub);
  }

  @AdminProtected()
  @Post('positions')
  updatePositions(
    @Body() positionUpdates: Array<{ id: string; position: number }>,
  ) {
    return this.modulesService.updatePositions(positionUpdates);
  }
}
