import { TipoMovimentoEstoque } from '@prisma/client';

export interface MovimentoEstoqueResumo {
  id: string;
  empresaId: string;
  estoqueId: string;
  produtoId: string;
  tipo: TipoMovimentoEstoque;
  quantidade: number;
  motivo: string | null;
  referencia: string | null;
  createdAt: Date;
}
