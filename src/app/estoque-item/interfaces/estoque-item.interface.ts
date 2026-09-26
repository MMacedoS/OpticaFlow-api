import { TipoProduto } from '@prisma/client';

export interface FiltroEstoqueItem {
  page: number;
  limit: number;
  search: string;
  estoqueId?: string;
  tipo?: TipoProduto;
  abaixoMinimo?: boolean;
}
