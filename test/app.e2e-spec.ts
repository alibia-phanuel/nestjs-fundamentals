import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

describe('Auth E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;

  // ✅ Timeout augmenté à 30 secondes — NestJS + DB prend du temps
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // ✅ Récupère le DataSource APRÈS app.init()
    dataSource = app.get(DataSource);

    // ✅ Nettoie avant les tests — au cas où un test précédent a échoué
    await dataSource.query(`DELETE FROM users WHERE email = 'e2e@test.com'`);
  }, 30000); // ← 30 secondes de timeout

  afterAll(async () => {
    // ✅ Nettoie après tous les tests
    if (dataSource) {
      await dataSource.query(`DELETE FROM users WHERE email = 'e2e@test.com'`);
    }
    if (app) {
      await app.close();
    }
  }, 30000); // ← 30 secondes de timeout

  // ─────────────────────────────────────────────────────────────
  // Tests — POST /auth/signup
  // ─────────────────────────────────────────────────────────────
  describe('POST /auth/signup', () => {
    it('devrait créer un nouveau user et retourner 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          firstName: 'E2E',
          lastName: 'Test',
          email: 'e2e@test.com',
          password: 'Test1234!',
        })
        .expect(201);

      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('e2e@test.com');
    }, 10000);

    it("devrait retourner 409 si l'email existe déjà", async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          firstName: 'E2E',
          lastName: 'Test',
          email: 'e2e@test.com',
          password: 'Test1234!',
        })
        .expect(409);
    }, 10000);

    it('devrait retourner 400 si le body est invalide', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          firstName: 'E2E',
        })
        .expect(400);
    }, 10000);

    it("devrait retourner 400 si l'email est invalide", async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          firstName: 'E2E',
          lastName: 'Test',
          email: 'pas-un-email',
          password: 'Test1234!',
        })
        .expect(400);
    }, 10000);
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — POST /auth/login
  // ─────────────────────────────────────────────────────────────
  describe('POST /auth/login', () => {
    it('devrait retourner un token JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'e2e@test.com',
          password: 'Test1234!',
        })
        .expect(201);

      // ✅ Debug temporaire
      console.log('Login response:', response.body);

      jwtToken = response.body.accessToken as string;

      expect(jwtToken).toBeDefined();
      expect(typeof jwtToken).toBe('string');
      expect(jwtToken.split('.')).toHaveLength(3);
    }, 10000);

    it('devrait retourner 401 si le password est incorrect', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'e2e@test.com',
          password: 'MauvaisPassword!',
        })
        .expect(401);
    }, 10000);

    it("devrait retourner 401 si l'email n'existe pas", async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'inconnu@test.com',
          password: 'Test1234!',
        })
        .expect(401);
    }, 10000);

    it('devrait retourner 400 si le body est vide', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    }, 10000);
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — Routes protégées JWT
  // ─────────────────────────────────────────────────────────────
  describe('Routes protégées JWT', () => {
    it('devrait retourner 401 sans token JWT', async () => {
      await request(app.getHttpServer()).post('/auth/2fa/setup').expect(401);
    }, 10000);

    it('devrait retourner 401 avec un token invalide', async () => {
      await request(app.getHttpServer())
        .post('/auth/2fa/setup')
        .set('Authorization', 'Bearer token.invalide.ici')
        .expect(401);
    }, 10000);

    // ✅ On teste generate-api-key — protégé par JwtAuthGuard simple
    // pas besoin d'être artiste
    it('devrait accéder à /auth/generate-api-key avec un token valide', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/generate-api-key')
        .set('Authorization', `Bearer ${jwtToken}`);

      console.log('generate-api-key response:', response.status, response.body);

      // ✅ 201 = API Key générée avec succès
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('apiKey');
    }, 10000);
  });
});
