import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed.module.js';
import { SeedService } from './seed.service.js';

async function seed() {
  const app = await NestFactory.createApplicationContext(SeedModule);
  try {
    const { inserted, skipped } = await app.get(SeedService).seedProducts();
    Logger.log(
      `Products seeded: ${inserted} inserted, ${skipped} already existed`,
      'Seed',
    );
  } finally {
    await app.close();
  }
}

await seed();
