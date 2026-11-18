import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { ProductsModule } from './products/products.module.js';
import { DatabaseModule } from './config/database.module.js';

@Module({
  imports: [DatabaseModule, AuthModule, UsersModule, ProductsModule],
})
export class AppModule {}
