export interface OrdemServicoItemResumo {
  id: string;
  ordemServicoId: string;
  produtoId: string | null;
  descricao_servico: string | null;
  quantidade: number;
  valor_unitario: number;
  desconto: number | null;
}
