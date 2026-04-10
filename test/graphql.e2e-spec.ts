import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

// ─────────────────────────────────────────────────────────────
// 💡 E2E GraphQL — différence avec E2E REST
//
// REST  → GET /songs, POST /songs...  (verbes HTTP différents)
// GraphQL → toujours POST /graphql    (un seul endpoint)
//           le corps de la requête contient la query/mutation
// ─────────────────────────────────────────────────────────────
describe('GraphQL E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = app.get(DataSource);

    // ✅ Nettoie avant les tests
    await dataSource.query(`DELETE FROM songs WHERE title LIKE 'E2E%'`);
  }, 30000);

  afterAll(async () => {
    // ✅ Nettoie après les tests
    await dataSource.query(`DELETE FROM songs WHERE title LIKE 'E2E%'`);
    await app.close();
  }, 30000);

  // ─────────────────────────────────────────────────────────────
  // Helper — envoie une requête GraphQL
  // ─────────────────────────────────────────────────────────────
  const gql = (query: string, variables = {}) =>
    request(app.getHttpServer()).post('/graphql').send({ query, variables });

  // ─────────────────────────────────────────────────────────────
  // Tests — Query songs
  // ─────────────────────────────────────────────────────────────
  describe('Query songs', () => {
    it('devrait retourner la liste des chansons', async () => {
      const response = await gql(`
        query {
          songs {
            id
            title
            duration
          }
        }
      `).expect(200);

      // ✅ GraphQL retourne toujours 200 même en cas d'erreur
      // les erreurs sont dans response.body.errors
      expect(response.body.data).toHaveProperty('songs');
      expect(Array.isArray(response.body.data.songs)).toBe(true);
    }, 10000);
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — Mutation createSong
  // ─────────────────────────────────────────────────────────────
  describe('Mutation createSong', () => {
    it('devrait créer une chanson', async () => {
      const response = await gql(`
        mutation {
          createSong(createSongInput: {
            title: "E2E Test Song"
            duration: "03:52"
          }) {
            id
            title
            duration
          }
        }
      `).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.createSong.title).toBe('E2E Test Song');
      expect(response.body.data.createSong.id).toBeDefined();
    }, 10000);

    it('devrait retourner une erreur si titre vide', async () => {
      const response = await gql(`
    mutation {
      createSong(createSongInput: {
        title: ""
        duration: "03:52"
      }) {
        id
        title
      }
    }
  `).expect(200);

      // ✅ On vérifie juste qu'une erreur existe
      // Le ValidationPipe intercepte avant le resolver
      // et retourne "Bad Request Exception"
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    }, 10000);
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — Query song by ID
  // ─────────────────────────────────────────────────────────────
  describe('Query song by ID', () => {
    it('devrait retourner une erreur pour un ID inexistant', async () => {
      const response = await gql(`
        query {
          song(id: 99999) {
            id
            title
          }
        }
      `).expect(200);

      // ✅ GraphQL retourne 200 mais avec errors
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('introuvable');
    }, 10000);
  });

  // ─────────────────────────────────────────────────────────────
  // Tests — Auth GraphQL
  // ─────────────────────────────────────────────────────────────
  describe('Auth GraphQL', () => {
    it('devrait créer un user via GraphQL signup', async () => {
      // Nettoie d'abord
      await dataSource.query(
        `DELETE FROM users WHERE email = 'e2e-graphql@test.com'`,
      );

      const response = await gql(`
        mutation {
          signup(signupInput: {
            firstName: "E2E"
            lastName: "GraphQL"
            email: "e2e-graphql@test.com"
            password: "Test1234!"
          }) {
            id
            email
            isActive
          }
        }
      `).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.signup.email).toBe('e2e-graphql@test.com');
      expect(response.body.data.signup.isActive).toBe(true);

      // Nettoie après
      await dataSource.query(
        `DELETE FROM users WHERE email = 'e2e-graphql@test.com'`,
      );
    }, 10000);

    it('devrait retourner un token JWT via GraphQL login', async () => {
      // Crée d'abord un user
      await gql(`
        mutation {
          signup(signupInput: {
            firstName: "E2E"
            lastName: "Login"
            email: "e2e-login@test.com"
            password: "Test1234!"
          }) { id }
        }
      `);

      const response = await gql(`
        mutation {
          login(loginInput: {
            email: "e2e-login@test.com"
            password: "Test1234!"
          }) {
            accessToken
          }
        }
      `).expect(200);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.login.accessToken).toBeDefined();
      expect(response.body.data.login.accessToken.split('.')).toHaveLength(3); // ✅ JWT = 3 parties

      // Nettoie
      await dataSource.query(
        `DELETE FROM users WHERE email = 'e2e-login@test.com'`,
      );
    }, 10000);
  });
});
