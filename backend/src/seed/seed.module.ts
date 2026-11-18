import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '../config/database.module.js';
import { Product, ProductSchema } from '../products/schemas/product.schema.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [
    DatabaseModule,
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
