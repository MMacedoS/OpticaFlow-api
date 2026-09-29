import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configurarApp } from './../src/app.setup';

/**
 * Isolamento entre empresas: a empresa B nao pode ler, alterar ou excluir
 * dados da empresa A. Exige banco com migrations e seed (superadmin).
 */

function digitoCnpj(base: string, pesos: number[]): string {
  const resto =
    base.split('').reduce((soma, d, i) => soma + Number(d) * pesos[i], 0) % 11;
  return resto < 2 ? '0' : String(11 - resto);
}

function gerarCnpj(base12: string): string {
  const d1 = digitoCnpj(base12, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = digitoCnpj(base12 + d1, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return base12 + d1 + d2;
}

function gerarCpf(base9: string): string {
  const digito = (base: string) => {
    const soma = base
      .split('')
      .reduce((acc, d, i) => acc + Number(d) * (base.length + 1 - i), 0);
    const resto = (soma * 10) % 11;
    return resto === 10 ? '0' : String(resto);
  };
  const d1 = digito(base9);
  return base9 + d1 + digito(base9 + d1);
}

const endereco = {
  cep: '01310100',
  logradouro: 'Avenida Paulista',
  numero: '1000',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  uf: 'SP',
  pais: 'Brasil',
  principal: true,
};
const contato = { tipo: 'whatsapp', contato: '11999990000', principal: true };

/** Procura, em qualquer nivel da resposta, o objeto com campo = valor. */
function acharId(corpo: unknown, campo: string, valor: string): string {
  const pilha: unknown[] = [corpo];
  while (pilha.length) {
    const atual = pilha.pop();
    if (Array.isArray(atual)) pilha.push(...(atual as unknown[]));
    else if (atual && typeof atual === 'object') {
      const registro = atual as Record<string, unknown>;
      if (registro[campo] === valor && typeof registro.id === 'string') {
        return registro.id;
      }
      pilha.push(...Object.values(registro));
    }
  }
  throw new Error(`Registro com ${campo}=${valor} nao encontrado.`);
}

describe('Isolamento entre empresas (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;

  // Sufixo para rodar varias vezes no mesmo banco.
  const sufixo = String(Date.now()).slice(-6);
  const empresaA = {
    email: `a${sufixo}@isolamento.teste`,
    cnpj: gerarCnpj(`11${sufixo}0001`),
  };
  const empresaB = {
    email: `b${sufixo}@isolamento.teste`,
    cnpj: gerarCnpj(`22${sufixo}0001`),
  };
  const responsavelA = {
    email: `resp.a${sufixo}@isolamento.teste`,
    cpf: gerarCpf(`3${sufixo}12`),
  };

  let tokenSuperadmin: string;
  let tokenA: string;
  let tokenB: string;
  let empresaAId: string;
  let filialAId: string;
  let usuarioResponsavelAId: string;

  const login = async (email: string, senha: string) => {
    const resposta = await http
      .post('/auth/login')
      .send({ email, senha })
      .expect(200);
    return resposta.body.data.access_token as string;
  };
  const como = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configurarApp(app);
    await app.init();
    http = request(app.getHttpServer());

    tokenSuperadmin = await login(
      process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@opticaflow.local',
      process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'SuperAdmin@123',
    );

    for (const [dados, nome] of [
      [empresaA, `Ótica Isolamento A ${sufixo}`],
      [empresaB, `Ótica Isolamento B ${sufixo}`],
    ] as const) {
      await http
        .post('/empresa')
        .set(como(tokenSuperadmin))
        .send({
          nome,
          razao: `${nome} Ltda`,
          cnpj: dados.cnpj,
          email: dados.email,
          enderecos: [endereco],
          contatos: [contato],
        })
        .expect((res) => {
          if (res.status !== 201) throw new Error(JSON.stringify(res.body));
        });
    }

    // Senha inicial do usuario da empresa: os digitos do CNPJ.
    tokenA = await login(empresaA.email, empresaA.cnpj);
    tokenB = await login(empresaB.email, empresaB.cnpj);

    await http
      .post('/filial')
      .set(como(tokenA))
      .send({
        nome: 'Filial Centro A',
        cnpj: gerarCnpj(`11${sufixo}0002`),
        enderecos: [endereco],
        contatos: [contato],
        pessoa: {
          nome: 'Responsável Filial A',
          cpf: responsavelA.cpf,
          email: responsavelA.email,
        },
      })
      .expect((res) => {
        if (![200, 201].includes(res.status))
          throw new Error(JSON.stringify(res.body));
      });

    const filiais = await http.get('/filial').set(como(tokenA)).expect(200);
    filialAId = acharId(filiais.body, 'nome', 'Filial Centro A');

    const empresas = await http
      .get('/empresa?limit=100')
      .set(como(tokenSuperadmin))
      .expect(200);
    empresaAId = acharId(empresas.body, 'email', empresaA.email);

    const usuarios = await http
      .get('/usuario?limit=1000')
      .set(como(tokenSuperadmin))
      .expect(200);
    usuarioResponsavelAId = acharId(usuarios.body, 'email', responsavelA.email);
  });

  afterAll(async () => {
    await app.close();
  });

  it('a empresa A acessa a propria filial', async () => {
    await http.get(`/filial/${filialAId}`).set(como(tokenA)).expect(200);
  });

  it('a empresa B nao le a filial da empresa A', async () => {
    const resposta = await http.get(`/filial/${filialAId}`).set(como(tokenB));

    expect(resposta.status).toBe(404);
    expect(JSON.stringify(resposta.body)).not.toContain('Filial Centro A');
  });

  it('a empresa B nao altera, desativa nem exclui a filial da empresa A', async () => {
    await http
      .put(`/filial/${filialAId}`)
      .set(como(tokenB))
      // Corpo valido: so a checagem de empresa pode barrar.
      .send({
        nome: 'Invadida',
        enderecos: [endereco],
        contatos: [contato],
        pessoa: {
          nome: 'Invasor',
          cpf: responsavelA.cpf,
          email: responsavelA.email,
        },
      })
      .expect(404);
    await http
      .patch(`/filial/${filialAId}/status`)
      .set(como(tokenB))
      .send({ status: 'inativo' })
      .expect(404);
    await http.delete(`/filial/${filialAId}`).set(como(tokenB)).expect(404);

    const filial = await http.get(`/filial/${filialAId}`).set(como(tokenA));
    expect(JSON.stringify(filial.body)).toContain('Filial Centro A');
  });

  it('a empresa B nao lista a empresa A', async () => {
    const resposta = await http.get('/empresa').set(como(tokenB));

    // Bloqueado pela permissao (403) ou filtrado para a propria empresa.
    expect([200, 403]).toContain(resposta.status);
    expect(JSON.stringify(resposta.body)).not.toContain(
      `Ótica Isolamento A ${sufixo}`,
    );
  });

  it('a empresa B nao altera a empresa A nem cria empresas', async () => {
    await http
      .put(`/empresa/${empresaAId}`)
      .set(como(tokenB))
      .send({ nome: 'Invadida' })
      .expect((res) => expect([403, 404]).toContain(res.status));
    await http
      .post('/empresa')
      .set(como(tokenB))
      .send({
        nome: `Empresa Pirata ${sufixo}`,
        razao: 'Pirata Ltda',
        cnpj: gerarCnpj(`33${sufixo}0001`),
        email: `c${sufixo}@isolamento.teste`,
        enderecos: [endereco],
        contatos: [contato],
      })
      .expect(403);
  });

  it('a empresa B nao troca a senha de um usuario da empresa A', async () => {
    const resposta = await http
      .put(`/usuario/${usuarioResponsavelAId}`)
      .set(como(tokenB))
      .send({ senha: 'senha-trocada-123' });

    expect([403, 404]).toContain(resposta.status);
    // A senha inicial (CPF) continua valendo.
    await login(responsavelA.email, responsavelA.cpf);
  });

  it('a empresa B nao le usuarios da empresa A', async () => {
    const lista = await http.get('/usuario').set(como(tokenB));
    expect(JSON.stringify(lista.body)).not.toContain(responsavelA.email);

    const porId = await http
      .get(`/usuario/${usuarioResponsavelAId}`)
      .set(como(tokenB));
    expect([403, 404]).toContain(porId.status);

    const porEmail = await http
      .get(`/usuario/email/${responsavelA.email}`)
      .set(como(tokenB));
    expect([403, 404]).toContain(porEmail.status);
  });

  it('nenhuma rota de usuario devolve a senha', async () => {
    const resposta = await http
      .get(`/usuario/email/${responsavelA.email}`)
      .set(como(tokenSuperadmin))
      .expect(200);

    expect(JSON.stringify(resposta.body)).not.toContain('senha');
  });
});
