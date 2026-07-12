export interface FuncionarioResumo {
  id: string;
  pessoaId: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  filialId: string;
  usuario: {
    id: string;
    email: string;
    username: string | null;
    empresaId: string | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}
