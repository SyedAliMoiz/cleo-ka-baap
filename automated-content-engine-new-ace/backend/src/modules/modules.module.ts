import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModulesController } from './modules.controller';
import { ModulesService } from './modules.service';
import { FavoritesService } from './favorites.service';
import {
  Module as ModuleSchema,
  ModuleSchema as ModuleSchemaClass,
} from './schema/module.schema';
import {
  UserFavorite,
  UserFavoriteSchema,
} from './schema/user-favorite.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ModuleSchema.name, schema: ModuleSchemaClass },
      { name: UserFavorite.name, schema: UserFavoriteSchema },
    ]),
  ],
  controllers: [ModulesController],
  providers: [ModulesService, FavoritesService],
  exports: [ModulesService, FavoritesService],
})
export class ModulesModule {}
