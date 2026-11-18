import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto } from './create-product.dto.js';

const validBody = () => ({
  sku: 'CAF-001',
  name: 'Café 500g',
  description: 'Café de origen, tostión media',
  price: 25000,
  stock: 120,
  category: 'Café',
  details: {
    brand: 'Finca Felipe',
    weight: 500,
    unit: 'g',
    specs: [{ key: 'Origen', value: 'Huila' }],
  },
});

const errorsFor = async (body: Record<string, unknown>) => {
  const dto = plainToInstance(CreateProductDto, body);
  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return { dto, errors };
};

const failingPaths = (
  errors: Awaited<ReturnType<typeof validate>>,
  prefix = '',
): string[] =>
  errors.flatMap((e) => {
    const path = prefix ? `${prefix}.${e.property}` : e.property;
    return e.children?.length ? failingPaths(e.children, path) : [path];
  });

describe('CreateProductDto', () => {
  it('accepts the example body from the spec', async () => {
    const { errors } = await errorsFor(validBody());
    expect(errors).toHaveLength(0);
  });

  it('accepts a body without optional fields', async () => {
    const { description: _d, details: _x, ...body } = validBody();
    const { errors } = await errorsFor(body);
    expect(errors).toHaveLength(0);
  });

  it('uppercases and trims the sku before validating', async () => {
    const { dto, errors } = await errorsFor({
      ...validBody(),
      sku: ' caf-001 ',
    });
    expect(errors).toHaveLength(0);
    expect(dto.sku).toBe('CAF-001');
  });

  it.each([
    ['too short', 'AB'],
    ['too long', 'A'.repeat(21)],
    ['invalid characters', 'CAF_001'],
    ['missing', undefined],
  ])('rejects sku %s', async (_label, sku) => {
    const { errors } = await errorsFor({ ...validBody(), sku });
    expect(failingPaths(errors)).toEqual(['sku']);
  });

  it.each([
    ['name', 'ab'],
    ['name', 'a'.repeat(101)],
    ['description', 'a'.repeat(1001)],
    ['price', 25000.5],
    ['price', -1],
    ['stock', 1.5],
    ['stock', -1],
    ['category', 'a'],
    ['category', 'a'.repeat(51)],
  ])('rejects invalid %s (%s)', async (field, value) => {
    const { errors } = await errorsFor({ ...validBody(), [field]: value });
    expect(failingPaths(errors)).toEqual([field]);
  });

  it.each([
    ['weight', 0],
    ['weight', -5],
    ['unit', 'lb'],
  ])('rejects invalid details.%s (%s)', async (field, value) => {
    const body = validBody();
    const { errors } = await errorsFor({
      ...body,
      details: { ...body.details, [field]: value },
    });
    expect(failingPaths(errors)).toEqual([`details.${field}`]);
  });

  it('rejects more than 20 specs', async () => {
    const body = validBody();
    const specs = Array.from({ length: 21 }, (_, i) => ({
      key: `k${i}`,
      value: 'v',
    }));
    const { errors } = await errorsFor({
      ...body,
      details: { ...body.details, specs },
    });
    expect(failingPaths(errors)).toEqual(['details.specs']);
  });

  it('rejects a spec with an empty key', async () => {
    const body = validBody();
    const { errors } = await errorsFor({
      ...body,
      details: { ...body.details, specs: [{ key: '', value: 'Huila' }] },
    });
    expect(failingPaths(errors)).toEqual(['details.specs.0.key']);
  });

  it('rejects properties not declared in the DTO', async () => {
    const { errors } = await errorsFor({ ...validBody(), isActive: false });
    expect(failingPaths(errors)).toEqual(['isActive']);
  });
});
