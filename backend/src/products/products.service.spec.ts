import { ConflictException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service.js';
import { Product } from './schemas/product.schema.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { QueryProductsDto } from './dto/query-products.dto.js';

const ID = '507f1f77bcf86cd799439011';

const createDto = {
  sku: 'CAF-001',
  name: 'Café 500g',
  price: 25000,
  stock: 120,
  category: 'Café',
} satisfies CreateProductDto;

const query = (overrides: Partial<QueryProductsDto> = {}): QueryProductsDto =>
  Object.assign(new QueryProductsDto(), overrides);

const chain = (result: unknown) => {
  const q = {
    sort: vi.fn(() => q),
    skip: vi.fn(() => q),
    limit: vi.fn(() => q),
    exec: vi.fn().mockResolvedValue(result),
  };
  return q;
};

describe('ProductsService', () => {
  let service: ProductsService;
  const model = {
    find: vi.fn(),
    countDocuments: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    findOneAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: getModelToken(Product.name), useValue: model },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  describe('findAll', () => {
    it('returns active products paginated, newest first by default', async () => {
      const products = [{ sku: 'CAF-001' }];
      const findQuery = chain(products);
      model.find.mockReturnValue(findQuery);
      model.countDocuments.mockReturnValue(chain(42));

      const result = await service.findAll(query());

      expect(model.find).toHaveBeenCalledWith({ isActive: true });
      expect(model.countDocuments).toHaveBeenCalledWith({ isActive: true });
      expect(findQuery.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
      expect(findQuery.skip).toHaveBeenCalledWith(0);
      expect(findQuery.limit).toHaveBeenCalledWith(10);
      expect(result).toEqual({
        data: products,
        meta: { total: 42, page: 1, limit: 10, totalPages: 5 },
      });
    });

    it('skips previous pages and applies the requested sort', async () => {
      const findQuery = chain([]);
      model.find.mockReturnValue(findQuery);
      model.countDocuments.mockReturnValue(chain(25));

      const result = await service.findAll(
        query({ page: 3, limit: 5, sortBy: 'price', order: 'asc' }),
      );

      expect(findQuery.sort).toHaveBeenCalledWith({ price: 1, _id: 1 });
      expect(findQuery.skip).toHaveBeenCalledWith(10);
      expect(findQuery.limit).toHaveBeenCalledWith(5);
      expect(result.meta).toEqual({
        total: 25,
        page: 3,
        limit: 5,
        totalPages: 5,
      });
    });

    it('searches name or sku case-insensitively, escaping regex characters', async () => {
      model.find.mockReturnValue(chain([]));
      model.countDocuments.mockReturnValue(chain(0));

      await service.findAll(query({ search: 'café (1' }));

      const pattern = new RegExp('café \\(1', 'i');
      const filter = {
        isActive: true,
        $or: [{ name: pattern }, { sku: pattern }],
      };
      expect(model.find).toHaveBeenCalledWith(filter);
      expect(model.countDocuments).toHaveBeenCalledWith(filter);
    });

    it('reports zero pages when there are no products', async () => {
      model.find.mockReturnValue(chain([]));
      model.countDocuments.mockReturnValue(chain(0));

      const result = await service.findAll(query());

      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      });
    });
  });

  describe('findOne', () => {
    it('returns an active product by id', async () => {
      const product = { sku: 'CAF-001' };
      model.findOne.mockReturnValue(chain(product));

      await expect(service.findOne(ID)).resolves.toBe(product);
      expect(model.findOne).toHaveBeenCalledWith({ _id: ID, isActive: true });
    });

    it('throws 404 when the product does not exist or was deleted', async () => {
      model.findOne.mockReturnValue(chain(null));

      await expect(service.findOne(ID)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates the product', async () => {
      const created = { ...createDto, isActive: true };
      model.create.mockResolvedValue(created);

      await expect(service.create(createDto)).resolves.toBe(created);
      expect(model.create).toHaveBeenCalledWith(createDto);
    });

    it('throws 409 with a clear message when the sku already exists', async () => {
      model.create.mockRejectedValue(
        Object.assign(new Error('E11000 duplicate key'), { code: 11000 }),
      );

      const error = await service.create(createDto).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).message).toBe(
        'Ya existe un producto con ese SKU',
      );
    });

    it('rethrows any other database error', async () => {
      const dbError = new Error('connection lost');
      model.create.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toBe(dbError);
    });
  });

  describe('update', () => {
    it('updates an active product with validators and returns the new version', async () => {
      const updated = { ...createDto, price: 27000, stock: 80 };
      model.findOneAndUpdate.mockReturnValue(chain(updated));

      await expect(
        service.update(ID, { price: 27000, stock: 80 }),
      ).resolves.toBe(updated);
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: ID, isActive: true },
        { price: 27000, stock: 80 },
        { returnDocument: 'after', runValidators: true },
      );
    });

    it('throws 404 when the product does not exist or was deleted', async () => {
      model.findOneAndUpdate.mockReturnValue(chain(null));

      await expect(service.update(ID, { stock: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('soft deletes an active product', async () => {
      model.updateOne.mockReturnValue(chain({ matchedCount: 1 }));

      await expect(service.remove(ID)).resolves.toBeUndefined();
      expect(model.updateOne).toHaveBeenCalledWith(
        { _id: ID, isActive: true },
        { isActive: false },
      );
    });

    it('throws 404 when the product does not exist or was already deleted', async () => {
      model.updateOne.mockReturnValue(chain({ matchedCount: 0 }));

      await expect(service.remove(ID)).rejects.toThrow(NotFoundException);
    });
  });
});
