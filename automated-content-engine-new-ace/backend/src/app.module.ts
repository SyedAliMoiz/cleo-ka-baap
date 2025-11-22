import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ModulesModule } from './modules/modules.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { KnowledgeModule } from './knowledge/knowledge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Required ENV variables:
      // JWT_SECRET, MONGODB_URI, OPENAI_API_KEY, ANTHROPIC_API_KEY, PERPLEXITY_API_KEY
      load: [
        () => {
          return {
            JWT_SECRET: 'ace_jwt_secret_key', // TODO: Move to .env
            QDRANT_URL: process.env.QDRANT_URL || 'http://qdrant:6333', // TODO: Move to .env
          };
        },
      ],
    }),
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URI', 'mongodb://localhost:27017/ace'),
      }),
      inject: [ConfigService],
    }),
    ModulesModule,
    UsersModule,
    AuthModule,
    ChatModule,
    KnowledgeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
