export interface AcessoResumo {
  id: string;
  nome: string;
  descricao: string | null;
  empresaId: string | null;
  createdAt?: Date;
}

export interface PermissaoResumo {
  id: string;
  modulo: string;
  acao: string;
  descricao: string | null;
  empresaId: string | null;
}

export interface Atribuicao {
  acesso: {
    id: string;
    nome: string;
    descricao: string | null;
    permissao: {
      permissao: {
        id: string;
        modulo: string;
        acao: string;
        descricao: string | null;
      };
    }[];
  };
}
