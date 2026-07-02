import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

type PermissaoCatalogo = {
  modulo: string;
  nomeAcesso: string;
  descricaoAcesso: string;
};

const permissoesPadrao = [
  { acao: 'listar', descricao: 'Permite listar registros' },
  { acao: 'detalhar', descricao: 'Permite visualizar um registro específico' },
  { acao: 'criar', descricao: 'Permite criar registros' },
  { acao: 'atualizar', descricao: 'Permite atualizar registros' },
  { acao: 'deletar', descricao: 'Permite excluir registros' },
];

const acessos: PermissaoCatalogo[] = [
  {
    modulo: 'auth',
    nomeAcesso: 'auth',
    descricaoAcesso: 'Autenticação e sessão',
  },
  {
    modulo: 'usuario',
    nomeAcesso: 'usuario',
    descricaoAcesso: 'Gestão de usuários',
  },
  {
    modulo: 'empresa',
    nomeAcesso: 'empresa',
    descricaoAcesso: 'Gestão de empresas',
  },
  {
    modulo: 'filial',
    nomeAcesso: 'filial',
    descricaoAcesso: 'Gestão de filiais',
  },
  {
    modulo: 'pessoa',
    nomeAcesso: 'pessoa',
    descricaoAcesso: 'Gestão de pessoas',
  },
  {
    modulo: 'responsavel',
    nomeAcesso: 'responsavel',
    descricaoAcesso: 'Gestão de responsáveis',
  },
  {
    modulo: 'funcionario',
    nomeAcesso: 'funcionario',
    descricaoAcesso: 'Gestão de funcionários',
  },
  {
    modulo: 'fornecedor',
    nomeAcesso: 'fornecedor',
    descricaoAcesso: 'Gestão de fornecedores',
  },
  {
    modulo: 'produto',
    nomeAcesso: 'produto',
    descricaoAcesso: 'Gestão de produtos',
  },
  {
    modulo: 'estoque',
    nomeAcesso: 'estoque',
    descricaoAcesso: 'Gestão de estoques',
  },
  {
    modulo: 'estoque-item',
    nomeAcesso: 'estoque-item',
    descricaoAcesso: 'Gestão de itens de estoque',
  },
  {
    modulo: 'movimento-estoque',
    nomeAcesso: 'movimento-estoque',
    descricaoAcesso: 'Movimentação de estoque',
  },
  {
    modulo: 'compra',
    nomeAcesso: 'compra',
    descricaoAcesso: 'Gestão de compras',
  },
  {
    modulo: 'compra-item',
    nomeAcesso: 'compra-item',
    descricaoAcesso: 'Itens de compra',
  },
  { modulo: 'venda', nomeAcesso: 'venda', descricaoAcesso: 'Gestão de vendas' },
  {
    modulo: 'venda-item',
    nomeAcesso: 'venda-item',
    descricaoAcesso: 'Itens de venda',
  },
  {
    modulo: 'agenda',
    nomeAcesso: 'agenda',
    descricaoAcesso: 'Gestão de agenda',
  },
  {
    modulo: 'atendimento',
    nomeAcesso: 'atendimento',
    descricaoAcesso: 'Gestão de atendimentos',
  },
  {
    modulo: 'prontuario',
    nomeAcesso: 'prontuario',
    descricaoAcesso: 'Gestão de prontuários',
  },
  {
    modulo: 'receita',
    nomeAcesso: 'receita',
    descricaoAcesso: 'Gestão de receitas',
  },
  {
    modulo: 'laboratorio',
    nomeAcesso: 'laboratorio',
    descricaoAcesso: 'Gestão de laboratórios',
  },
  {
    modulo: 'convenio',
    nomeAcesso: 'convenio',
    descricaoAcesso: 'Gestão de convênios',
  },
  {
    modulo: 'arquivo',
    nomeAcesso: 'arquivo',
    descricaoAcesso: 'Gestão de arquivos',
  },
  {
    modulo: 'financeiro-lancamento',
    nomeAcesso: 'financeiro-lancamento',
    descricaoAcesso: 'Lançamentos financeiros',
  },
  {
    modulo: 'auditoria',
    nomeAcesso: 'auditoria',
    descricaoAcesso: 'Auditoria do sistema',
  },
  {
    modulo: 'acesso',
    nomeAcesso: 'acesso',
    descricaoAcesso: 'Gestão de acessos e permissões',
  },
  {
    modulo: 'notificacao',
    nomeAcesso: 'notificacao',
    descricaoAcesso: 'Gestão de notificações',
  },
  {
    modulo: 'oftalmologista',
    nomeAcesso: 'oftalmologista',
    descricaoAcesso: 'Gestão de oftalmologistas',
  },
  {
    modulo: 'optometrista',
    nomeAcesso: 'optometrista',
    descricaoAcesso: 'Gestão de optometristas',
  },
  {
    modulo: 'ordem-servico',
    nomeAcesso: 'ordem-servico',
    descricaoAcesso: 'Gestão de ordens de serviço',
  },
  {
    modulo: 'ordem-servico-item',
    nomeAcesso: 'ordem-servico-item',
    descricaoAcesso: 'Itens de ordem de serviço',
  },
];

const superAdminEmail =
  process.env.SEED_SUPER_ADMIN_EMAIL ?? 'superadmin@opticaflow.local';
const superAdminUsername =
  process.env.SEED_SUPER_ADMIN_USERNAME ?? 'superadmin';
const superAdminPassword =
  process.env.SEED_SUPER_ADMIN_PASSWORD ?? 'SuperAdmin@123';

function createPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
}

async function ensureAcesso(
  prisma: PrismaClient,
  nome: string,
  descricao: string,
) {
  const acessoExistente = await prisma.acesso.findUnique({
    where: { nome },
  });

  if (acessoExistente) {
    return acessoExistente;
  }

  return prisma.acesso.create({
    data: {
      nome,
      descricao,
    },
  });
}

async function ensurePermissao(
  prisma: PrismaClient,
  modulo: string,
  acao: string,
  descricao: string,
) {
  const permissaoExistente = await prisma.permissao.findFirst({
    where: {
      empresaId: null,
      modulo,
      acao,
    },
  });

  if (permissaoExistente) {
    return permissaoExistente;
  }

  return prisma.permissao.create({
    data: {
      modulo,
      acao,
      descricao,
    },
  });
}

async function main() {
  const prisma = createPrismaClient();

  try {
    const permissaoMap = new Map<string, { id: string }>();

    for (const acesso of acessos) {
      for (const permissao of permissoesPadrao) {
        const registro = await ensurePermissao(
          prisma,
          acesso.modulo,
          permissao.acao,
          `${permissao.descricao} em ${acesso.descricaoAcesso.toLowerCase()}`,
        );

        permissaoMap.set(`${acesso.modulo}:${permissao.acao}`, {
          id: registro.id,
        });
      }
    }

    for (const acesso of acessos) {
      const acessoRegistro = await ensureAcesso(
        prisma,
        acesso.nomeAcesso,
        acesso.descricaoAcesso,
      );

      const permissaoIds = permissoesPadrao
        .map((permissao) =>
          permissaoMap.get(`${acesso.modulo}:${permissao.acao}`),
        )
        .filter((permissao): permissao is { id: string } => Boolean(permissao));

      await prisma.acessoPermissao.createMany({
        data: permissaoIds.map((permissao) => ({
          acessoId: acessoRegistro.id,
          permissaoId: permissao.id,
        })),
        skipDuplicates: true,
      });
    }

    const superAdminSenhaHash = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.usuario.upsert({
      where: {
        email: superAdminEmail,
      },
      update: {
        username: superAdminUsername,
        senha: superAdminSenhaHash,
      },
      create: {
        email: superAdminEmail,
        username: superAdminUsername,
        senha: superAdminSenhaHash,
      },
    });

    const todosAcessos = await prisma.acesso.findMany({
      select: {
        id: true,
      },
    });

    await prisma.atribuicao.createMany({
      data: todosAcessos.map((acesso) => ({
        usuarioId: superAdmin.id,
        acessoId: acesso.id,
      })),
      skipDuplicates: true,
    });

    console.log(`Seed concluido. Super admin: ${superAdminEmail}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
