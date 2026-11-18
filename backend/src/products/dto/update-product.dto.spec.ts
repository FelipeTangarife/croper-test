import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateProductDto } from './update-product.dto.js';

const errorsFor = (body: Record<string, unknown>) =>
  validate(plainToInstance(UpdateProductDto, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

describe('UpdateProductDto', () => {
  it('accepts a partial body', async () => {
    expect(await errorsFor({ price: 27000, stock: 80 })).toHaveLength(0);
  });

  it('accepts an empty body', async () => {
    expect(await errorsFor({})).toHaveLength(0);
  });

  it('keeps the create rules for the fields it receives', async () => {
    const errors = await errorsFor({ stock: -1 });
    expect(errors.map((e) => e.property)).toEqual(['stock']);
  });

  it('rejects the sku because it cannot be modified', async () => {
    const errors = await errorsFor({ sku: 'CAF-002' });
    expect(errors.map((e) => e.property)).toEqual(['sku']);
  });
});
