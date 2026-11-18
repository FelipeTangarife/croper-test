import { model } from 'mongoose';
import { User, UserSchema } from './user.schema.js';

const UserModel = model(User.name, UserSchema);

const validUser = () => ({
  email: '  Admin@Croper.TEST ',
  name: 'Admin',
  password: '$2b$10$hashedpasswordvalue',
});

describe('UserSchema', () => {
  it('stores the email trimmed and in lowercase', () => {
    const user = new UserModel(validUser());
    expect(user.validateSync()).toBeUndefined();
    expect(user.email).toBe('admin@croper.test');
  });

  it('declares the email as unique', () => {
    expect(UserSchema.path('email').options).toMatchObject({ unique: true });
  });

  it('excludes the password from queries by default', () => {
    expect(UserSchema.path('password').options).toMatchObject({
      select: false,
    });
  });

  it('never serializes the password', () => {
    const json = new UserModel(validUser()).toJSON();
    expect(json).not.toHaveProperty('password');
    expect(json).toHaveProperty('id');
    expect(json).not.toHaveProperty('_id');
    expect(json).not.toHaveProperty('__v');
  });

  it.each([
    ['email', 'not-an-email'],
    ['email', undefined],
    ['name', 'A'],
    ['name', 'a'.repeat(101)],
    ['password', undefined],
  ])('rejects invalid %s (%s)', (field, value) => {
    const error = new UserModel({
      ...validUser(),
      [field]: value,
    }).validateSync();
    expect(Object.keys(error?.errors ?? {})).toEqual([field]);
  });
});
