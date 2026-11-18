import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';

const ALLOWED_ORIGIN = 'http://localhost:5173';

describe('API security (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.CORS_ORIGIN = ALLOWED_ORIGIN;
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const wrongLogin = () =>
    request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nobody@croper.test', password: 'Wrong1234!' });

  it('blocks the sixth login attempt in a minute with 429', async () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      await wrongLogin().expect(401);
    }

    const response = await wrongLogin().expect(429);

    expect(response.body).toEqual({
      statusCode: 429,
      message: 'Demasiados intentos, espera un minuto',
      error: 'Too Many Requests',
    });
  });

  it('blocks more than 100 requests per minute to the rest of the API', async () => {
    const server = app.getHttpServer();
    for (let i = 1; i <= 100; i++) {
      await request(server).get('/products').expect(401);
    }

    const response = await request(server).get('/products').expect(429);
    expect(response.body.message).toBe('Demasiados intentos, espera un minuto');
  });

  it('allows CORS only for the configured origin', async () => {
    const allowed = await request(app.getHttpServer())
      .options('/products')
      .set('Origin', ALLOWED_ORIGIN)
      .set('Access-Control-Request-Method', 'GET');
    expect(allowed.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);

    const rejected = await request(app.getHttpServer())
      .options('/products')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'GET');
    expect(rejected.headers['access-control-allow-origin']).not.toBe(
      'https://evil.example',
    );
    expect(rejected.headers['access-control-allow-origin']).toBe(
      ALLOWED_ORIGIN,
    );
  });

  it('sends the helmet security headers', async () => {
    const response = await request(app.getHttpServer()).get('/products');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('keeps Swagger UI loading under the content security policy', async () => {
    const page = await request(app.getHttpServer()).get('/docs').expect(200);
    const inlineScripts =
      page.text.match(/<script(?![^>]*\bsrc=)[^>]*>/g) ?? [];

    expect(inlineScripts).toEqual([]);
    await request(app.getHttpServer())
      .get('/docs/swagger-ui-init.js')
      .expect(200);
  });
});
