import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { QueryProductsDto } from './dto/query-products.dto.js';
import { CreateProductDto } from './dto/create-product.dto.js';

describe('ProductsController', () => {
  let controller: ProductsController;
  const id = new Types.ObjectId();
  const service = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [{ provide: ProductsService, useValue: service }],
    }).compile();

    controller = module.get(ProductsController);
  });

  it('delegates the listing to the service', async () => {
    const query = new QueryProductsDto();
    const page = { data: [], meta: {} };
    service.findAll.mockResolvedValue(page);

    await expect(controller.findAll(query)).resolves.toBe(page);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('delegates findOne, create, update and remove to the service', async () => {
    const dto = { sku: 'CAF-001' } as CreateProductDto;
    service.findOne.mockResolvedValue('found');
    service.create.mockResolvedValue('created');
    service.update.mockResolvedValue('updated');
    service.remove.mockResolvedValue(undefined);

    await expect(controller.findOne(id)).resolves.toBe('found');
    await expect(controller.create(dto)).resolves.toBe('created');
    await expect(controller.update(id, { stock: 1 })).resolves.toBe('updated');
    await expect(controller.remove(id)).resolves.toBeUndefined();

    expect(service.findOne).toHaveBeenCalledWith(id);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(service.update).toHaveBeenCalledWith(id, { stock: 1 });
    expect(service.remove).toHaveBeenCalledWith(id);
  });
});
