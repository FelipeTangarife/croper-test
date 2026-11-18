import { model } from 'mongoose';
import { Product, ProductSchema } from './product.schema.js';

const ProductModel = model(Product.name, ProductSchema);

const validProduct = () => ({
  sku: 'caf-001',
  name: 'Café 500g',
  price: 25000,
  stock: 120,
  category: 'Café',
  details: {
    unit: 'g',
    weight: 500,
    specs: [{ key: 'Origen', value: 'Huila' }],
  },
});

describe('ProductSchema', () => {
  it('declares sku unique only among active products', () => {
    expect(ProductSchema.indexes()).toContainEqual([
      { sku: 1 },
      expect.objectContaining({
        unique: true,
        partialFilterExpression: { isActive: true },
      }),
    ]);
  });

  it('stores sku uppercase and defaults isActive to true', () => {
    const doc = new ProductModel(validProduct());
    expect(doc.validateSync()).toBeUndefined();
    expect(doc.sku).toBe('CAF-001');
    expect(doc.isActive).toBe(true);
  });

  it('serializes with id and without _id or __v', () => {
    const json = new ProductModel(validProduct()).toJSON();
    expect(json).toHaveProperty('id');
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
  });

  it.each([
    ['price', 10.5],
    ['stock', -1],
    ['name', 'ab'],
  ])('rejects invalid %s at the database layer', (field, value) => {
    const error = new ProductModel({
      ...validProduct(),
      [field]: value,
    }).validateSync();
    expect(Object.keys(error?.errors ?? {})).toEqual([field]);
  });

  it('rejects more than 20 specs at the database layer', () => {
    const specs = Array.from({ length: 21 }, (_, i) => ({
      key: `k${i}`,
      value: 'v',
    }));
    const error = new ProductModel({
      ...validProduct(),
      details: { specs },
    }).validateSync();
    expect(Object.keys(error?.errors ?? {})).toEqual(['details.specs']);
  });
});
