# OpticaFlow Pro - Backend

## Para que este projeto existe

Este projeto e a API backend do sistema OpticaFlow Pro.
Ele centraliza as regras de negocio de uma otica, incluindo modulos como:

- autenticacao e acesso
- cadastro de pessoas e usuarios
- empresa e filial
- estoque, produtos e movimentacoes
- compras e vendas
- agenda, atendimentos e prontuarios
- financeiro e auditoria

## O que foi usado

- Node.js
- TypeScript
- NestJS
- Prisma ORM
- PostgreSQL
- Docker
- ESLint
- Jest

## Como o projeto esta estruturado

O projeto segue estrutura modular por dominio dentro de [src](src):

- cada modulo possui `*.controller.ts`, `*.service.ts`, `*.module.ts`, pasta `dto` e pasta `interfaces` (ex.: [src/app/agenda](src/app/agenda))
- o controller recebe a requisicao HTTP
- o service concentra as regras de negocio
- os DTOs definem contratos de entrada e saida
- as interfaces definem contratos internos

Principais diretorios:

- [src](src): codigo da aplicacao organizado por modulos
- [prisma](prisma): schema, migrations e seed do banco
- [test](test): testes automatizados
- [teste.http](teste.http): colecao de chamadas HTTP para validacao manual dos endpoints

## Rodando localmente

Pela raiz do projeto (pasta com o `docker-compose.yml`), sobe banco, API e frontend:

```bash
cp backend/.env.example backend/.env   # no compose, troque localhost por postgres na DATABASE_URL
docker compose up -d
docker compose exec backend npm run db:setup   # migrations + seed
```

Sem Docker, com um PostgreSQL local:

```bash
cp .env.example .env
npm install
npm run db:setup
npm run start:dev
```

A API sobe em `http://localhost:3000`. O seed cria o superadmin definido em
`SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD` (padrao
`superadmin@opticaflow.local` / `SuperAdmin@123`).

As variaveis de ambiente estao descritas em [.env.example](.env.example).

## Documentacao da API

O Swagger fica em `http://localhost:3000/docs` (JSON em `/docs-json`). As rotas
sao agrupadas por modulo; faca login em `POST /auth/login`, clique em
**Authorize** e informe o `access_token`. Para desligar, use
`SWAGGER_ENABLED=false`.

## Testes

```bash
npm test            # unitarios (services, guards, escopo por empresa/filial)
npm run test:e2e    # e2e contra a API real; exige banco com migrations e seed
```

## Deploy (Render + Vercel)

A API e o PostgreSQL rodam no Render e o frontend na Vercel. A API usa a imagem
[Dockerfile.prod](Dockerfile.prod), que aplica as migrations pendentes a cada
inicializacao.

1. **Render**: New → Blueprint → este repositorio. O [render.yaml](render.yaml)
   cria o banco `opticaflow-db` e o servico `opticaflow-api` na mesma regiao,
   liga a `DATABASE_URL` interna do banco a API e gera os segredos JWT.
   Preencha `FRONTEND_URL` (dominio da Vercel), `SEED_SUPER_ADMIN_EMAIL` e
   `SEED_SUPER_ADMIN_PASSWORD`.
2. O primeiro deploy roda com `RUN_SEED=true` e cria acessos, permissoes e o
   superadmin. **Depois mude `RUN_SEED` para `false`**: o seed redefine a senha
   do superadmin a cada execucao.
3. **Vercel**: importe o repositorio do frontend com `VITE_API_URL` apontando
   para a URL do Render. Adicione o dominio final da Vercel em `FRONTEND_URL`
   no Render (varios dominios separados por virgula).

Limites do plano gratuito do Render:

- a API hiberna apos 15 minutos sem acesso; a primeira requisicao seguinte leva
  cerca de um minuto;
- o PostgreSQL gratuito **expira 30 dias apos a criacao**. Para uso real, mude o
  banco para um plano pago antes disso.

Se o banco ficar atras de um pooler (ex.: Neon), informe tambem `DIRECT_URL`
com a conexao direta, usada pelas migrations.

## CI

O workflow [.github/workflows/ci.yml](.github/workflows/ci.yml) roda lint,
build, testes unitarios e e2e contra um PostgreSQL, e valida o build da imagem
de producao a cada push na `master` e em pull requests.
