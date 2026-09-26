import { Pessoa } from 'src/app/pessoa/interface/Pessoa';

export interface Cliente {
  id: string;
  pessoaId: string;
  pessoa: Pessoa;
  createdAt: Date;
  updatedAt: Date;
}
