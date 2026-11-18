import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import bcrypt from 'bcrypt';
import { User } from './schemas/user.schema.js';
import { UsersService } from './users.service.js';

const chain = (result: unknown) => {
  const query = {
    select: vi.fn(() => query),
    exec: vi.fn().mockResolvedValue(result),
  };
  return query;
};

describe('UsersService', () => {
  let service: UsersService;
  const model = { findOne: vi.fn(), create: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: model },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('create', () => {
    it('stores a bcrypt hash instead of the plain password', async () => {
      model.create.mockImplementation((data: unknown) => Promise.resolve(data));

      await service.create({
        email: 'admin@croper.test',
        name: 'Admin',
        password: 'Admin1234!',
      });

      const [{ password }] = model.create.mock.calls[0] as [
        { password: string },
      ];
      expect(password).not.toBe('Admin1234!');
      await expect(bcrypt.compare('Admin1234!', password)).resolves.toBe(true);
    });

    it('stores the email trimmed and in lowercase', async () => {
      model.create.mockImplementation((data: unknown) => Promise.resolve(data));

      await service.create({
        email: '  Admin@Croper.TEST ',
        name: 'Admin',
        password: 'Admin1234!',
      });

      expect(model.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'admin@croper.test', name: 'Admin' }),
      );
    });
  });

  describe('findByEmail', () => {
    it('finds the user regardless of case and includes the password', async () => {
      const user = { email: 'admin@croper.test', password: 'hash' };
      const query = chain(user);
      model.findOne.mockReturnValue(query);

      await expect(service.findByEmail('ADMIN@Croper.test')).resolves.toBe(
        user,
      );
      expect(model.findOne).toHaveBeenCalledWith({
        email: 'admin@croper.test',
      });
      expect(query.select).toHaveBeenCalledWith('+password');
    });

    it('returns null when the user does not exist', async () => {
      model.findOne.mockReturnValue(chain(null));

      await expect(service.findByEmail('nobody@croper.test')).resolves.toBe(
        null,
      );
    });
  });
});
