import { envValidationSchema } from './env.validation.js';

const validEnv = () => ({
  MONGO_URI: 'mongodb://localhost:27017/products',
  JWT_SECRET: 'a'.repeat(32),
  JWT_EXPIRES_IN: '3600s',
  PORT: '3000',
  CORS_ORIGIN: 'http://localhost:5173',
});

const validate = (env: Record<string, unknown>) =>
  envValidationSchema.validate(env, { abortEarly: false });

describe('envValidationSchema', () => {
  it('accepts a complete configuration', () => {
    const { error, value } = validate(validEnv());
    expect(error).toBeUndefined();
    expect(value).toMatchObject({ PORT: 3000 });
  });

  it.each(['MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'PORT', 'CORS_ORIGIN'])(
    'fails and names %s when it is missing',
    (key) => {
      const env: Record<string, unknown> = validEnv();
      delete env[key];

      const { error } = validate(env);

      expect(error?.message).toContain(`"${key}" is required`);
    },
  );

  it.each([
    ['JWT_SECRET', 'a'.repeat(31), 'at least 32 characters'],
    ['JWT_EXPIRES_IN', '3600', 'must be a number followed by a unit'],
    ['PORT', 'abc', '"PORT" must be a number'],
    ['CORS_ORIGIN', 'not a url', '"CORS_ORIGIN" must be a valid uri'],
    ['MONGO_URI', 'nope', '"MONGO_URI" must be a valid uri'],
  ])('fails when %s is invalid (%s)', (key, value, message) => {
    const { error } = validate({ ...validEnv(), [key]: value });
    expect(error?.message).toContain(message);
  });

  it('reports every problem at once', () => {
    const { error } = validate({});
    expect(error?.details).toHaveLength(5);
  });
});
