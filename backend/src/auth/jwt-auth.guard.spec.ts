import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const SECRET = 'test-secret';

const contextWith = (
  authorization?: string,
): { context: ExecutionContext; request: Record<string, unknown> } => {
  const request: Record<string, unknown> = {
    headers: authorization ? { authorization } : {},
  };
  const context = {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
};

describe('JwtAuthGuard', () => {
  const jwtService = new JwtService({ secret: SECRET });
  const reflector = new Reflector();
  const guard = new JwtAuthGuard(reflector, jwtService);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sign = (payload: object, expiresIn: number | '1h' = '1h') =>
    jwtService.signAsync(payload, { secret: SECRET, expiresIn });

  it('lets public routes through without a token', async () => {
    const isPublic = vi
      .spyOn(reflector, 'getAllAndOverride')
      .mockReturnValue(true);
    const { context } = contextWith();

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(isPublic).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
      expect.any(Function),
      expect.any(Function),
    ]);
  });

  it('accepts a valid bearer token and exposes the user on the request', async () => {
    const token = await sign({ sub: 'user-id', email: 'admin@croper.test' });
    const { context, request } = contextWith(`Bearer ${token}`);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({
      userId: 'user-id',
      email: 'admin@croper.test',
    });
  });

  it.each([
    ['without a token', undefined],
    ['with another scheme', 'Basic abc'],
    ['with a malformed token', 'Bearer not-a-jwt'],
  ])('rejects a request %s', async (_label, header) => {
    const { context } = contextWith(header);
    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token signed with another secret', async () => {
    const token = await jwtService.signAsync(
      { sub: 'user-id', email: 'admin@croper.test' },
      { secret: 'other-secret' },
    );
    const { context } = contextWith(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects an expired token', async () => {
    const token = await sign(
      { sub: 'user-id', email: 'admin@croper.test' },
      -10,
    );
    const { context } = contextWith(`Bearer ${token}`);

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
