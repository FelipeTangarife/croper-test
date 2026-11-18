import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryProductsDto } from './query-products.dto.js';

const parse = async (query: Record<string, unknown>) => {
  const dto = plainToInstance(QueryProductsDto, query);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, errors };
};

describe('QueryProductsDto', () => {
  it('applies defaults: page 1, limit 10, newest first', async () => {
    const { dto, errors } = await parse({});
    expect(errors).toHaveLength(0);
    expect(dto).toMatchObject({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      order: 'desc',
    });
    expect(dto.search).toBeUndefined();
  });

  it('coerces query-string numbers and trims the search', async () => {
    const { dto, errors } = await parse({
      page: '2',
      limit: '25',
      search: '  cafe ',
      sortBy: 'price',
      order: 'asc',
    });
    expect(errors).toHaveLength(0);
    expect(dto).toMatchObject({
      page: 2,
      limit: 25,
      search: 'cafe',
      sortBy: 'price',
      order: 'asc',
    });
  });

  it.each([
    ['page', '0'],
    ['page', '1.5'],
    ['limit', '0'],
    ['limit', '101'],
    ['search', 'a'.repeat(51)],
    ['sortBy', 'stock'],
    ['order', 'up'],
  ])('rejects invalid %s (%s)', async (field, value) => {
    const { errors } = await parse({ [field]: value });
    expect(errors.map((e) => e.property)).toEqual([field]);
  });
});
