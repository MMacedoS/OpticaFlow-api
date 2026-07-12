export interface ArquivoResumo {
  id: string;
  empresaId: string;
  filialId: string | null;
  pessoaId: string | null;
  atendimentoId: string | null;
  prontuarioId: string | null;
  enviadoPorId: string | null;
  nome: string;
  path: string;
  mime_type: string | null;
  tamanho: number | null;
  createdAt: Date;
  updatedAt: Date;
}
