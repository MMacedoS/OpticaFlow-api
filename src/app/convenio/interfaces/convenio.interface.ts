export interface ConvenioResumo {
  id: string;
  empresaId: string;
  nome: string;
  registro: string | null;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}
