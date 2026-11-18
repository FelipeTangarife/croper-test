import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '../products/schemas/product.schema.js';
import { SEED_PRODUCTS } from './seed-products.data.js';

export interface SeedResult {
  inserted: number;
  skipped: number;
}

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async seedProducts(): Promise<SeedResult> {
    const now = new Date();
    const { upsertedCount } = await this.productModel.bulkWrite(
      SEED_PRODUCTS.map((product) => ({
        updateOne: {
          filter: { sku: product.sku },
          update: {
            $setOnInsert: {
              ...product,
              isActive: true,
              createdAt: now,
              updatedAt: now,
            },
          },
          upsert: true,
        },
      })),
      { ordered: false, timestamps: false },
    );

    return {
      inserted: upsertedCount,
      skipped: SEED_PRODUCTS.length - upsertedCount,
    };
  }
}
