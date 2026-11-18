import type { UsersService } from '../users/users.service.js';
import { seedAdmin } from './seed-admin.js';

const users = {
  findByEmail: vi.fn(),
  create: vi.fn(),
};
const service = users as unknown as UsersService;

const config = {
  email: 'admin@croper.test',
  name: 'Admin',
  password: 'Admin1234!',
};

describe('seedAdmin', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    users.findByEmail.mockResolvedValue(null);
    users.create.mockResolvedValue({});
  });

  it('creates the admin with the configured email, name and password', async () => {
    await expect(seedAdmin(service, config)).resolves.toEqual({
      status: 'created',
      email: 'admin@croper.test',
    });
    expect(users.create).toHaveBeenCalledWith(config);
  });

  it('does not create the admin again when it already exists', async () => {
    users.findByEmail.mockResolvedValue({ email: 'admin@croper.test' });

    await expect(seedAdmin(service, config)).resolves.toEqual({
      status: 'exists',
      email: 'admin@croper.test',
    });
    expect(users.create).not.toHaveBeenCalled();
  });

  it.each([undefined, ''])(
    'generates a random password of at least 16 characters when none is configured (%j)',
    async (password) => {
      const result = await seedAdmin(service, { ...config, password });

      expect(result.status).toBe('created');
      const generated =
        result.status === 'created' ? result.generatedPassword : '';
      expect(generated?.length).toBeGreaterThanOrEqual(16);
      expect(users.create).toHaveBeenCalledWith({
        ...config,
        password: generated,
      });
    },
  );

  it('generates a different password on every run', async () => {
    const first = await seedAdmin(service, { ...config, password: undefined });
    const second = await seedAdmin(service, { ...config, password: undefined });

    expect(first).not.toEqual(second);
  });

  it('normalizes the configured email to lowercase', async () => {
    await expect(
      seedAdmin(service, { ...config, email: ' Admin@Croper.TEST ' }),
    ).resolves.toEqual({ status: 'created', email: 'admin@croper.test' });
    expect(users.findByEmail).toHaveBeenCalledWith('admin@croper.test');
  });

  it('does not return a password when it comes from the config', async () => {
    const result = await seedAdmin(service, config);
    expect(result).not.toHaveProperty('generatedPassword');
  });

  it('uses "Admin" as the name when none is configured', async () => {
    await seedAdmin(service, { ...config, name: undefined });
    expect(users.create).toHaveBeenCalledWith({ ...config, name: 'Admin' });
  });

  it.each([
    [{ email: undefined }, 'SEED_ADMIN_EMAIL is required'],
    [{ email: '' }, 'SEED_ADMIN_EMAIL is required'],
    [{ email: 'not-an-email' }, 'SEED_ADMIN_EMAIL must be a valid email'],
    [
      { password: 'short' },
      'SEED_ADMIN_PASSWORD must be at least 8 characters',
    ],
    [{ name: 'A' }, 'SEED_ADMIN_NAME must be between 2 and 100 characters'],
  ])(
    'fails with a clear message and creates nothing (%j)',
    async (override, message) => {
      await expect(
        seedAdmin(service, { ...config, ...override }),
      ).rejects.toThrow(message);
      expect(users.findByEmail).not.toHaveBeenCalled();
      expect(users.create).not.toHaveBeenCalled();
    },
  );
});
