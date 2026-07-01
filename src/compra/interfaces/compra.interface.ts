export interface CompraResumo {
  id: string;
  empresaId: string;
  filialId: string;
  fornecedorId: string | null;
  dataCompra: Date;
  status: string | null;
  valor_total: number;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
