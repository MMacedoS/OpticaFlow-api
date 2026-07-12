export interface OrdemServicoResumo {
  id: string;
  empresaId: string;
  filialId: string;
  atendimentoId: string | null;
  clienteId: string | null;
  laboratorioId: string | null;
  numero: string | null;
  status: string;
  descricao: string | null;
  previsao_entrega: Date | null;
  data_entrega: Date | null;
  valor_total: number;
  createdAt: Date;
  updatedAt: Date;
}
