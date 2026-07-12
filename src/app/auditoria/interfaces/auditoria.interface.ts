import { Prisma } from '@prisma/client';

export interface AuditoriaResumo {
  id: string;
  empresaId: string;
  filialId: string | null;
  usuarioId: string | null;
  atendimentoId: string | null;
  entidade: string;
  entidadeId: string | null;
  acao: string;
  dados_antes: Prisma.JsonValue | null;
  dados_depois: Prisma.JsonValue | null;
  ip: string | null;
  user_agent: string | null;
  createdAt: Date;
}
