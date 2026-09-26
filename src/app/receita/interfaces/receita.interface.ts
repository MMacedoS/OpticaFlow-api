import { TipoReceita } from '@prisma/client';

export interface FiltroReceita {
  page: number;
  limit: number;
  pacienteId?: string;
  prontuarioId?: string;
  tipo?: TipoReceita;
}
