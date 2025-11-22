import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ModulesService } from './modules.service';
import { ModulesController } from './modules.controller';
import { ModuleConfig, ModuleConfigSchema } from './schemas/module-config.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: ModuleConfig.name, schema: ModuleConfigSchema }])],
  controllers: [ModulesController],
  providers: [ModulesService],
  exports: [ModulesService],
})
export class ModulesModule {}
