import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserFavoriteDocument = UserFavorite & Document;

@Schema({ timestamps: true })
export class UserFavorite {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'Module' })
  moduleId: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserFavoriteSchema = SchemaFactory.createForClass(UserFavorite);

// Create compound index to ensure one favorite per user-module pair
UserFavoriteSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

