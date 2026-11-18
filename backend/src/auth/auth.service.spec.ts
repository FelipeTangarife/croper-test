import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';

const SECRET = 'test-secret';
const PASSWORD = 'Admin1234!';

describe('AuthService', () => {
  let service: AuthService;
  const jwtService = new JwtService({
    secret: SECRET,
    signOptions: { expiresIn: '1h' },
  });
  const users = { findByEmail: vi.fn() };
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash(PASSWORD, 4);
  });

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: users },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  const adminUser = () => ({
    id: '665f1c2e8b3a4d0012a1b2c3',
    email: 'admin@croper.test',
    name: 'Admin',
    password: passwordHash,
  });

  it('returns a signed token, its lifetime and the user without the password', async () => {
    users.findByEmail.mockResolvedValue(adminUser());

    const result = await service.login('admin@croper.test', PASSWORD);

    expect(result.expiresIn).toBe(3600);
    expect(result.user).toEqual({
      id: '665f1c2e8b3a4d0012a1b2c3',
      email: 'admin@croper.test',
      name: 'Admin',
    });
    expect(users.findByEmail).toHaveBeenCalledWith('admin@croper.test');
  });

  it('puts only sub and email in the token payload', async () => {
    users.findByEmail.mockResolvedValue(adminUser());

    const { accessToken } = await service.login('admin@croper.test', PASSWORD);
    const payload = await jwtService.verifyAsync<Record<string, unknown>>(
      accessToken,
      { secret: SECRET },
    );

    expect(Object.keys(payload).sort()).toEqual(['email', 'exp', 'iat', 'sub']);
    expect(payload).toMatchObject({
      sub: '665f1c2e8b3a4d0012a1b2c3',
      email: 'admin@croper.test',
    });
  });

  it('rejects a wrong password with "Credenciales inválidas"', async () => {
    users.findByEmail.mockResolvedValue(adminUser());

    const error = await service
      .login('admin@croper.test', 'Wrong1234!')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(UnauthorizedException);
    expect((error as UnauthorizedException).message).toBe(
      'Credenciales inválidas',
    );
  });

  it('rejects an unknown email with the same 401 as a wrong password', async () => {
    users.findByEmail.mockResolvedValueOnce(adminUser());
    const wrongPassword = await service
      .login('admin@croper.test', 'Wrong1234!')
      .catch((e: unknown) => e as UnauthorizedException);

    users.findByEmail.mockResolvedValueOnce(null);
    const unknownEmail = await service
      .login('nobody@croper.test', PASSWORD)
      .catch((e: unknown) => e as UnauthorizedException);

    expect(unknownEmail).toBeInstanceOf(UnauthorizedException);
    expect(unknownEmail.getResponse()).toEqual(wrongPassword.getResponse());
  });
});
