import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/app.setup';

/**
 * Testes contra a API real e um banco com as migrations e o seed aplicados
 * (npm run db:setup). Usa o superadmin criado pelo seed.
 */
describe('OpticaFlow API (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;

  const superadmin = {
    email: process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@opticaflow.local',
    senha: process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'SuperAdmin@123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configurarApp(app);
    await app.init();

    const resposta = await request(app.getHttpServer())
      .post('/auth/login')
      .send(superadmin)
      .expect(200);
    token = resposta.body.data.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / responde', () => {
    return request(app.getHttpServer()).get('/').expect(200);
  });

  describe('autenticacao', () => {
    it('login devolve tokens e o usuario da sessao', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/auth/login')
        .send(superadmin)
        .expect(200);

      expect(body.data.access_token).toEqual(expect.any(String));
      expect(body.data.refresh_token).toEqual(expect.any(String));
      expect(body.data.usuario.superadmin).toBe(true);
    });

    it('login com senha errada devolve 401', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ ...superadmin, senha: 'senha-errada' })
        .expect(401);
    });

    it('login com corpo invalido devolve 400', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nao-e-email' })
        .expect(400);
    });

    it('refresh devolve um novo access token', async () => {
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send(superadmin);

      const { body } = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refresh_token: login.body.data.refresh_token })
        .expect(200);

      expect(body.data.access_token).toEqual(expect.any(String));
    });
  });

  describe('rotas protegidas', () => {
    it.each(['/cliente', '/venda', '/ordem-servico', '/dashboard'])(
      '%s sem token devolve 401',
      (rota) => request(app.getHttpServer()).get(rota).expect(401),
    );

    it('token invalido devolve 401', () => {
      return request(app.getHttpServer())
        .get('/cliente')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });

    it.each(['/cliente', '/produto', '/venda', '/compra', '/empresa'])(
      '%s com token lista os registros',
      (rota) =>
        request(app.getHttpServer())
          .get(rota)
          .set('Authorization', `Bearer ${token}`)
          .expect(200),
    );

    it('acao em registro inexistente devolve 404', () => {
      return request(app.getHttpServer())
        .post('/venda/id-inexistente/cancelar')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
