export interface FornecedorResumo {
  id: string;
  empresaId: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  observacoes: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FiltroFornecedor {
  page: number;
  limit: number;
  search: string;
  ativo?: boolean;
}
