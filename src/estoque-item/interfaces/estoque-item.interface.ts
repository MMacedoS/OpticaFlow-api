export interface EstoqueItemResumo {
  id: string;
  estoqueId: string;
  produtoId: string;
  quantidade: number;
  minimo: number | null;
  maximo: number | null;
  updatedAt: Date;
}
