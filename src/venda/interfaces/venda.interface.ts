export interface VendaResumo {
  id: string;
  empresaId: string;
  filialId: string;
  clienteId: string | null;
  atendimentoId: string | null;
  dataVenda: Date;
  status: string | null;
  valor_total: number;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
