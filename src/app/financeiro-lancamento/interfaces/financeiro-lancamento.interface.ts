import { StatusFinanceiro, TipoFinanceiro } from '@prisma/client';

export interface FiltroLancamento {
  page: number;
  limit: number;
  search: string;
  tipo?: TipoFinanceiro;
  status?: StatusFinanceiro;
  /** Apenas pendentes com vencimento anterior a hoje. */
  vencidos?: boolean;
  categoria?: string;
  /** Periodo pelo vencimento. */
  dataInicio?: string;
  dataFim?: string;
}

export interface TotaisLancamento {
  pendente: number;
  vencido: number;
  pago: number;
}
