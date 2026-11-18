import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import {
  AppThrottlerGuard,
  TOO_MANY_REQUESTS_MESSAGE,
} from './common/guards/app-throttler.guard.js';
import { DatabaseModule } from './config/database.module.js';
import { ProductsModule } from './products/products.module.js';
import { UsersModule } from './users/users.module.js';

const ONE_MINUTE_MS = 60_000;
const REQUESTS_PER_MINUTE = 100;

@Module({
  imports: [
    DatabaseModule,
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: ONE_MINUTE_MS, limit: REQUESTS_PER_MINUTE }],
      errorMessage: TOO_MANY_REQUESTS_MESSAGE,
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
