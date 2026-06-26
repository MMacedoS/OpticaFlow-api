export interface Usuario {
  id: string;
  email: string;
  senha?: string;
  username?: string | null;
  pessoaId?: string | null;
}
