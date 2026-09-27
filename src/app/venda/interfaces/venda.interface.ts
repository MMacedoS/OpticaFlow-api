import { StatusVenda } from '@prisma/client';

export interface FiltroVenda {
  page: number;
  limit: number;
  search: string;
  status?: StatusVenda;
  clienteId?: string;
  dataInicio?: string;
  dataFim?: string;
}
