import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  UserFavorite,
  UserFavoriteDocument,
} from './schema/user-favorite.schema';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(UserFavorite.name)
    private userFavoriteModel: Model<UserFavoriteDocument>,
  ) {}

  async addFavorite(userId: string, moduleId: string): Promise<UserFavorite> {
    const favorite = new this.userFavoriteModel({
      userId,
      moduleId,
    });
    return favorite.save();
  }

  async removeFavorite(userId: string, moduleId: string): Promise<void> {
    await this.userFavoriteModel.findOneAndDelete({ userId, moduleId }).exec();
  }

  async getUserFavorites(userId: string): Promise<string[]> {
    const favorites = await this.userFavoriteModel
      .find({ userId })
      .select('moduleId')
      .exec();
    return favorites.map((fav) => fav.moduleId.toString());
  }

  async isFavorite(userId: string, moduleId: string): Promise<boolean> {
    const favorite = await this.userFavoriteModel
      .findOne({ userId, moduleId })
      .exec();
    return !!favorite;
  }

  async getFavoriteStatuses(
    userId: string,
    moduleIds: string[],
  ): Promise<Record<string, boolean>> {
    const favorites = await this.userFavoriteModel
      .find({
        userId,
        moduleId: { $in: moduleIds },
      })
      .select('moduleId')
      .exec();

    const favoriteSet = new Set(
      favorites.map((fav) => fav.moduleId.toString()),
    );

    const statuses: Record<string, boolean> = {};
    moduleIds.forEach((id) => {
      statuses[id] = favoriteSet.has(id);
    });

    return statuses;
  }
}
