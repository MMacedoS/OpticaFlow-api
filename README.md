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

- cada modulo possui [controller.ts](src/app.controller.ts), [service.ts](src/app.service.ts), [module.ts](src/app.module.ts), pasta [dto](src/auth/dto) e pasta [interfaces](src/agenda/interfaces)
- o controller recebe a requisicao HTTP
- o service concentra as regras de negocio
- os DTOs definem contratos de entrada e saida
- as interfaces definem contratos internos

Principais diretorios:

- [src](src): codigo da aplicacao organizado por modulos
- [prisma](prisma): schema, migrations e seed do banco
- [test](test): testes automatizados
- [teste.http](teste.http): colecao de chamadas HTTP para validacao manual dos endpoints
