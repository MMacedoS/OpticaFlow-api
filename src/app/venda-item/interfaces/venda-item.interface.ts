export interface VendaItemResumo {
  id: string;
  vendaId: string;
  produtoId: string;
  quantidade: number;
  valor_unitario: number;
  desconto: number | null;
}
