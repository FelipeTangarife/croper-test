import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from './parse-object-id.pipe.js';

describe('ParseObjectIdPipe', () => {
  const pipe = new ParseObjectIdPipe();

  it('converts a valid id into an ObjectId', () => {
    const result = pipe.transform('665f1c2e8b3a4d0012a1b2c3');
    expect(result).toBeInstanceOf(Types.ObjectId);
    expect(result.toHexString()).toBe('665f1c2e8b3a4d0012a1b2c3');
  });

  it.each(['abc', '665f1c2e8b3a4d0012a1b2cZ', ''])(
    'rejects an invalid id with a Spanish message (%j)',
    (value) => {
      let error: unknown;
      try {
        pipe.transform(value);
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toEqual({
        statusCode: 400,
        message: 'El id no es válido',
        error: 'Bad Request',
      });
    },
  );
});
