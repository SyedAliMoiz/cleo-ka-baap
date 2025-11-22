import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClientsModule } from './clients/clients.module';
import { HooksModule } from './hooks/hooks.module';
import { LinkedInPostsModule } from './linkedin-posts/linkedin-posts.module';
import { PromptsModule } from './prompts/prompts.module';
import { AuthModule } from './auth/auth.module';
import { AIModule } from './ai/ai.module';
import { NewsModule } from './news/news.module';
import { ThreadWriterModule } from './thread-writer/thread-writer.module';
import { CustomGptsModule } from './custom-gpts/custom-gpts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get('THROTTLE_TTL', 60), // Time-to-live for the request counter (in seconds)
            limit: config.get('THROTTLE_LIMIT', 10), // Max number of requests within the TTL
          },
        ],
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('MONGODB_URI') ||
          'mongodb://localhost:27017/ace',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    ClientsModule,
    HooksModule,
    LinkedInPostsModule,
    PromptsModule,
    AIModule,
    NewsModule,
    ThreadWriterModule,
    CustomGptsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
