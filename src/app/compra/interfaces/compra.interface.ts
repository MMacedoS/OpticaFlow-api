import { StatusCompra } from '@prisma/client';

export interface FiltroCompra {
  page: number;
  limit: number;
  search: string;
  status?: StatusCompra;
  fornecedorId?: string;
  dataInicio?: string;
  dataFim?: string;
}
