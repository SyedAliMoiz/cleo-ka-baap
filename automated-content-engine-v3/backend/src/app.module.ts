import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProvidersModule } from './providers/providers.module';
import { ModulesModule } from './modules/modules.module';
import { LlmModule } from './llm/llm.module';
import { ClientsModule } from './clients/clients.module';
import { ArtifactsModule } from './artifacts/artifacts.module';
import { KnowledgeModule } from './knowledge/knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/ace-v3'),
    UsersModule,
    AuthModule,
    ProvidersModule,
    ModulesModule,
    LlmModule,
    ClientsModule,
    ArtifactsModule,
    KnowledgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
