export interface Usuario {
  id: string;
  email: string;
  senha?: string;
  empresaId?: string | null;
  username?: string | null;
  pessoaId?: string | null;
}
