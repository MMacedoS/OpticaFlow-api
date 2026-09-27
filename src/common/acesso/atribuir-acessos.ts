import {
  ForbiddenException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PERFIL_PROFISSIONAL_SAUDE } from './perfil-profissional';

/**
 * Atribui ao usuario os acessos padrao por modulo (perfis do sistema com o
 * nome do modulo), exceto os modulos restritos. Nunca inclui perfis de
 * empresas nem o perfil de profissional de saude.
 */
export async function atribuirAcessosPorModulo(
  tx: Prisma.TransactionClient,
  usuarioId: string,
  modulosRestritos: string[] = [],
): Promise<void> {
  const acessos = await tx.acesso.findMany({
    where: {
      empresaId: null,
      nome: { notIn: [...modulosRestritos, PERFIL_PROFISSIONAL_SAUDE] },
    },
    select: { id: true },
  });

  await tx.atribuicao.createMany({
    data: acessos.map((acesso) => ({ usuarioId, acessoId: acesso.id })),
    skipDuplicates: true,
  });
}

/**
 * Substitui os perfis do usuario pelos informados, aceitando apenas perfis
 * do sistema ou da empresa indicada.
 */
export async function definirPerfisDoUsuario(
  tx: Prisma.TransactionClient,
  usuarioId: string,
  acessoIds: string[],
  empresaId: string,
): Promise<void> {
  const ids = [...new Set(acessoIds)];

  const validos = await tx.acesso.count({
    where: {
      id: { in: ids },
      OR: [{ empresaId: null }, { empresaId }],
    },
  });

  if (validos !== ids.length) {
    throw new UnprocessableEntityException(
      'Um ou mais perfis de acesso não existem ou não pertencem à empresa.',
    );
  }

  await tx.atribuicao.deleteMany({ where: { usuarioId } });
  await tx.atribuicao.createMany({
    data: ids.map((acessoId) => ({ usuarioId, acessoId })),
  });
}

/** Impede que um usuario altere o proprio acesso (evita se trancar fora). */
export function impedirAlterarProprioAcesso(
  usuarioAlvoId: string,
  usuarioLogadoId?: string,
): void {
  if (usuarioLogadoId && usuarioAlvoId === usuarioLogadoId) {
    throw new ForbiddenException(
      'Você não pode alterar o seu próprio acesso. Peça a outro administrador.',
    );
  }
}
