import { InternalServerErrorException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

/** Perfil padrao criado pela migration perfil_profissional_saude. */
export const PERFIL_PROFISSIONAL_SAUDE = 'Profissional de saúde';

/**
 * Atribui ao usuario de um optometrista/oftalmologista apenas o perfil de
 * profissional de saude (agenda, consultas, prontuarios e receitas).
 */
export async function atribuirPerfilProfissional(
  tx: Prisma.TransactionClient,
  usuarioId: string,
): Promise<void> {
  const perfil = await tx.acesso.findFirst({
    where: { nome: PERFIL_PROFISSIONAL_SAUDE, empresaId: null },
    select: { id: true },
  });

  if (!perfil) {
    throw new InternalServerErrorException(
      `Perfil "${PERFIL_PROFISSIONAL_SAUDE}" não encontrado; rode as migrations.`,
    );
  }

  await tx.atribuicao.createMany({
    data: [{ usuarioId, acessoId: perfil.id }],
    skipDuplicates: true,
  });
}
