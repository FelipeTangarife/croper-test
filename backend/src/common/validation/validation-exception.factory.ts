import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

const WHITELIST_CONSTRAINT = 'whitelistValidation';

function collectMessages(errors: ValidationError[], parentPath = ''): string[] {
  return errors.flatMap((error) => {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const own = Object.entries(error.constraints ?? {}).map(([key, message]) =>
      key === WHITELIST_CONSTRAINT
        ? `La propiedad "${path}" no está permitida`
        : message,
    );
    return [...own, ...collectMessages(error.children ?? [], path)];
  });
}

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException([...new Set(collectMessages(errors))]);
}
