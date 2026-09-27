/** Formato usado pela sessao (login/refresh) para montar as permissoes. */
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

export interface ModuloCatalogo {
  modulo: string;
  acoes: string[];
}
