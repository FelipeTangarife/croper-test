import { BadRequestException } from '@nestjs/common';
import { plainToInstance, type ClassConstructor } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LoginDto } from '../../auth/dto/login.dto.js';
import { CreateProductDto } from '../../products/dto/create-product.dto.js';
import { QueryProductsDto } from '../../products/dto/query-products.dto.js';
import { validationExceptionFactory } from './validation-exception.factory.js';

const messagesFor = <T extends object>(
  dto: ClassConstructor<T>,
  body: Record<string, unknown>,
) => {
  const errors = validateSync(plainToInstance(dto, body), {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const exception = validationExceptionFactory(errors);
  return {
    exception,
    messages: (exception.getResponse() as { message: string[] }).message,
  };
};

const validProduct = () => ({
  sku: 'CAF-001',
  name: 'Café 500g',
  price: 25000,
  stock: 120,
  category: 'Café',
});

describe('validationExceptionFactory', () => {
  it('keeps the usual 400 error format', () => {
    const { exception } = messagesFor(CreateProductDto, {
      ...validProduct(),
      price: 10.5,
    });

    expect(exception).toBeInstanceOf(BadRequestException);
    expect(exception.getResponse()).toEqual({
      statusCode: 400,
      message: ['El precio debe ser un número entero'],
      error: 'Bad Request',
    });
  });

  it.each([
    [
      { sku: 'ab' },
      'El SKU debe tener de 3 a 20 caracteres: letras mayúsculas, números o guiones',
    ],
    [{ name: 'ab' }, 'El nombre debe tener entre 3 y 100 caracteres'],
    [{ name: undefined }, 'El nombre es obligatorio y debe ser un texto'],
    [
      { description: 'a'.repeat(1001) },
      'La descripción no puede superar los 1000 caracteres',
    ],
    [{ stock: -1 }, 'El stock no puede ser negativo'],
    [{ category: 'a' }, 'La categoría debe tener entre 2 y 50 caracteres'],
  ])('returns Spanish product messages (%j)', (override, message) => {
    const { messages } = messagesFor(CreateProductDto, {
      ...validProduct(),
      ...override,
    });
    expect(messages).toContain(message);
  });

  it('returns nested messages without the parent path', () => {
    const { messages } = messagesFor(CreateProductDto, {
      ...validProduct(),
      details: { weight: 0, unit: 'lb', specs: [{ key: '', value: 'Huila' }] },
    });

    expect(messages).toEqual(
      expect.arrayContaining([
        'El peso debe ser mayor a 0',
        'La unidad debe ser kg, g, l, ml o unidad',
        'El nombre de la especificación es obligatorio',
      ]),
    );
    expect(messages.every((m) => !m.startsWith('details.'))).toBe(true);
  });

  it('names properties that are not allowed, including nested ones', () => {
    const { messages } = messagesFor(CreateProductDto, {
      ...validProduct(),
      isActive: false,
      details: { color: 'rojo' },
    });

    expect(messages).toEqual([
      'La propiedad "isActive" no está permitida',
      'La propiedad "details.color" no está permitida',
    ]);
  });

  it.each([
    [{ page: '0' }, 'La página debe ser un número entero mayor o igual a 1'],
    [{ limit: '101' }, 'El límite debe estar entre 1 y 100'],
    [
      { search: 'a'.repeat(51) },
      'La búsqueda no puede superar los 50 caracteres',
    ],
    [{ sortBy: 'stock' }, 'sortBy solo puede ser name, price o createdAt'],
    [{ order: 'up' }, 'order solo puede ser asc o desc'],
  ])('returns Spanish query messages (%j)', (query, message) => {
    expect(messagesFor(QueryProductsDto, query).messages).toContain(message);
  });

  it('returns Spanish login messages', () => {
    expect(messagesFor(LoginDto, { email: 'nope' }).messages).toEqual([
      'El correo no es válido',
      'La contraseña es obligatoria',
    ]);
  });
});
