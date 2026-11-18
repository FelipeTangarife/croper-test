import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateProductDto } from '../products/dto/create-product.dto.js';
import { Product } from '../products/schemas/product.schema.js';
import { SEED_PRODUCTS } from './seed-products.data.js';
import { SeedService } from './seed.service.js';

describe('SEED_PRODUCTS', () => {
  it('contains 50 products with unique SKUs', () => {
    expect(SEED_PRODUCTS).toHaveLength(50);
    expect(new Set(SEED_PRODUCTS.map((p) => p.sku)).size).toBe(50);
  });

  it('only contains products that pass the API validation', () => {
    const invalid = SEED_PRODUCTS.filter(
      (product) =>
        validateSync(plainToInstance(CreateProductDto, product), {
          whitelist: true,
          forbidNonWhitelisted: true,
        }).length > 0,
    ).map((p) => p.sku);
    expect(invalid).toEqual([]);
  });
});

describe('SeedService', () => {
  let service: SeedService;
  const model = { bulkWrite: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: getModelToken(Product.name), useValue: model },
      ],
    }).compile();

    service = module.get(SeedService);
  });

  it('upserts every product by SKU, inserting only the missing ones', async () => {
    model.bulkWrite.mockResolvedValue({ upsertedCount: 50 });

    await expect(service.seedProducts()).resolves.toEqual({
      inserted: 50,
      skipped: 0,
    });

    const [operations, options] = model.bulkWrite.mock.calls[0] as [
      {
        updateOne: {
          filter: unknown;
          update: { $setOnInsert: Record<string, unknown> };
          upsert: boolean;
        };
      }[],
      unknown,
    ];
    expect(operations).toHaveLength(50);
    expect(operations[0].updateOne).toMatchObject({
      filter: { sku: SEED_PRODUCTS[0].sku },
      update: {
        $setOnInsert: {
          ...SEED_PRODUCTS[0],
          isActive: true,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      },
      upsert: true,
    });
    expect(Object.keys(operations[0].updateOne.update)).toEqual([
      '$setOnInsert',
    ]);
    expect(options).toEqual({ ordered: false, timestamps: false });
  });

  it('creates nothing when the seeder runs again', async () => {
    model.bulkWrite.mockResolvedValue({ upsertedCount: 0 });

    await expect(service.seedProducts()).resolves.toEqual({
      inserted: 0,
      skipped: 50,
    });
  });
});
