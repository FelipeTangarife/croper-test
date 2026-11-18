import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { configureApp } from './../src/app.setup.js';

describe('Framework errors (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
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

  it('answers unknown routes in Spanish', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/unknown')
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      message: 'Ruta no encontrada',
      error: 'Not Found',
    });
  });

  it('answers a malformed JSON body in Spanish', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')
      .expect(400);

    expect(response.body).toEqual({
      statusCode: 400,
      message: 'El cuerpo de la petición no es un JSON válido',
      error: 'Bad Request',
    });
  });

  it('keeps the messages the API already returns', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nope' })
      .expect(400);

    expect(response.body.message).toEqual([
      'El correo no es válido',
      'La contraseña es obligatoria',
    ]);
  });
});
