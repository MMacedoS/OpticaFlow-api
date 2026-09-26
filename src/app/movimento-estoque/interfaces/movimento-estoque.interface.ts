import { MovimentoEstoque, TipoMovimentoEstoque } from '@prisma/client';

export interface FiltroMovimentoEstoque {
  page: number;
  limit: number;
  estoqueId?: string;
  produtoId?: string;
  tipo?: TipoMovimentoEstoque;
  dataInicio?: string;
  dataFim?: string;
}

export interface RegistroMovimento {
  empresaId: string;
  estoqueId: string;
  produtoId: string;
  tipo: TipoMovimentoEstoque;
  /** Entrada/saida: quantidade movimentada. Ajuste: novo saldo contado. */
  quantidade: number;
  motivo?: string;
  referencia?: string;
}

export interface ResultadoMovimento {
  movimento: MovimentoEstoque;
  saldo: number;
}
