import { UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { EscopoUsuario } from './escopo.interface';

/**
 * Filtro de pessoas para listagens:
 * - usuario com filial: sempre a propria filial;
 * - sem filial: a filial informada (validada na empresa) ou a empresa toda;
 * - superadmin sem filial informada: sem restricao.
 */
export async function resolverFiltroFilial(
  prisma: PrismaService,
  escopo: EscopoUsuario,
  filialIdInformada?: string,
): Promise<Prisma.PessoaWhereInput> {
  if (escopo.filialId) {
    return { filialId: escopo.filialId };
  }

  if (filialIdInformada) {
    const filial = await prisma.filial.findFirst({
      where: {
        id: filialIdInformada,
        ...(escopo.empresaId && { empresaId: escopo.empresaId }),
      },
      select: { id: true },
    });

    if (!filial) {
      throw new UnprocessableEntityException('Filial não encontrada.');
    }

    return { filialId: filial.id };
  }

  return escopo.empresaId ? { filial: { empresaId: escopo.empresaId } } : {};
}
