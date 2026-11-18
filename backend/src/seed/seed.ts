import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { UsersService } from '../users/users.service.js';
import { seedAdmin } from './seed-admin.js';
import { SeedModule } from './seed.module.js';
import { SeedService } from './seed.service.js';

const logger = new Logger('Seed');

async function seed() {
  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: ['error', 'warn', 'log'],
  });
  try {
    const config = app.get(ConfigService);
    const admin = await seedAdmin(app.get(UsersService), {
      email: config.get<string>('SEED_ADMIN_EMAIL'),
      name: config.get<string>('SEED_ADMIN_NAME'),
      password: config.get<string>('SEED_ADMIN_PASSWORD'),
    });
    if (admin.status === 'exists') {
      logger.warn(`Admin ${admin.email} already exists, nothing changed`);
    } else {
      logger.log(`Admin ${admin.email} created`);
      if (admin.generatedPassword) {
        logger.warn(
          `Generated admin password (shown only once): ${admin.generatedPassword}`,
        );
      }
    }

    const { inserted, skipped } = await app.get(SeedService).seedProducts();
    logger.log(
      `Products seeded: ${inserted} inserted, ${skipped} already existed`,
    );
  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Seed failed');
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

await seed();
