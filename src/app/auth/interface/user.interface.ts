export interface RequestWithUser {
  headers: {
    authorization?: string;
  };
  user?: {
    sub: string;
    email: string;
    username?: string;
    pessoaId?: string | null;
  };
}
