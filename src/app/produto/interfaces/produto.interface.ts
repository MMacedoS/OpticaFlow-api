import { Status, TipoProduto } from '@prisma/client';

export interface FiltroProduto {
  page: number;
  limit: number;
  search: string;
  tipo?: TipoProduto;
  ativo?: Status;
}
