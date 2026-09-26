import { Pessoa } from 'src/app/pessoa/interface/Pessoa';

export interface UsuarioCompleto {
  id: string;
  pessoaId: string;
  pessoa: Pessoa;
  email: string;
  senha: string | null;
  status: string;
  tipo: string;
  atribuicao: [] | null;
  financeiro_lancamentos: [] | null;
  agendas_profissional: [] | null;
  atendimentos_profissional: [] | null;
  arquivos_enviados: [] | null;
  notificacoes_destino: [] | null;
  notificacoes_remetente: [] | null;
  prontuarios_profissional: [] | null;
  receitas_profissional: [] | null;
  createdAt: Date;
  updatedAt: Date;
}
