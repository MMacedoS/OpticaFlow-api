export interface LaboratorioResumo {
  id: string;
  empresaId: string;
  nome: string;
  cnpj: string | null;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FiltroLaboratorio {
  page: number;
  limit: number;
  search: string;
  ativo?: boolean;
}
