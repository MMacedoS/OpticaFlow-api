import { TipoProduto } from '@prisma/client';

export interface ProdutoResumo {
  id: string;
  empresaId: string;
  nome: string;
  sku: string;
  tipo: TipoProduto;
  categoria: string | null;
  descricao: string | null;
  preco_custo: number | null;
  preco_venda: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
