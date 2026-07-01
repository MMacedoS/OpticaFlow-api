export interface CompraItemResumo {
  id: string;
  compraId: string;
  produtoId: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number | null;
}
