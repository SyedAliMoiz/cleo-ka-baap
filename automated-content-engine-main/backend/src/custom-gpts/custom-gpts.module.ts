import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomGptsController } from './custom-gpts.controller';
import { CustomGptsService } from './custom-gpts.service';
import {
  CustomGptSession,
  CustomGptSessionSchema,
} from './schemas/customGptSession.schema';
import {
  CustomGptMessage,
  CustomGptMessageSchema,
} from './schemas/customGptMessage.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomGptSession.name, schema: CustomGptSessionSchema },
      { name: CustomGptMessage.name, schema: CustomGptMessageSchema },
    ]),
  ],
  controllers: [CustomGptsController],
  providers: [CustomGptsService],
  exports: [CustomGptsService],
})
export class CustomGptsModule {}
