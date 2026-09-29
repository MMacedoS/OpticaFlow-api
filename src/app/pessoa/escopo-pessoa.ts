import { UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';

/**
 * Filtro de pessoa para buscar um registro pelo id dentro do escopo:
 * - usuario com filial: somente pessoas da propria filial;
 * - usuario da empresa: pessoas de qualquer filial da empresa;
 * - superadmin: sem restricao.
 */
export function filtroPessoaNoEscopo(
  escopo: EscopoUsuario,
): Prisma.PessoaWhereInput {
  if (escopo.superadmin) {
    return {};
  }

  return {
    filial: { empresaId: escopo.empresaId },
    ...(escopo.filialId && { filialId: escopo.filialId }),
  };
}

/**
 * Garante que a filial informada no corpo pertence ao escopo do usuario
 * (a propria filial para usuarios de filial, a empresa para os demais).
 */
export async function validarFilialNoEscopo(
  prisma: PrismaService,
  escopo: EscopoUsuario,
  filialId: string,
): Promise<string> {
  if (escopo.filialId && escopo.filialId !== filialId) {
    throw new UnprocessableEntityException('Filial não encontrada.');
  }

  const filial = await prisma.filial.findFirst({
    where: {
      id: filialId,
      ...(!escopo.superadmin && { empresaId: escopo.empresaId }),
    },
    select: { id: true },
  });

  if (!filial) {
    throw new UnprocessableEntityException('Filial não encontrada.');
  }

  return filial.id;
}
