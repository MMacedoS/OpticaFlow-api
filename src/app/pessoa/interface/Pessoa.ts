import { Agenda } from 'src/app/agenda/interfaces/agenda.interface';
import { Atendimento } from 'src/app/atendimento/interfaces/atendimento.interface';
import { Cliente } from 'src/app/cliente/interface/Cliente';
import { FilialResponse } from 'src/app/filial/interfaces/filial.interface';
import { Oftalmologista } from 'src/app/oftalmologista/interfaces/oftalmologista.interface';
import { Optometrista } from 'src/app/optometrista/interfaces/optometrista.interface';
import { Usuario } from 'src/app/usuario/interface/usuario.interface';

export interface Pessoa {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  genero: string;
  status: string;
  dataNascimento: Date;
  agendas: Agenda[] | null;
  cliente: Cliente | null;
  documentos: [] | null;
  funcionario: [] | null;
  atendimentos: Atendimento | null;
  optometrita: Optometrista | null;
  oftalmologista: Oftalmologista | null;
  arquivos: [] | null;
  notificacoes: [] | null;
  filial: FilialResponse | null;
  prontuarios: [] | null;
  receitas: [] | null;
  usuario: Usuario | null;
  enderecos: Endereco[] | null;
  contatos: Contato[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Endereco {
  id: string;
  pessoaId: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contato {
  id: string;
  pessoaId: string;
  tipo: string;
  valor: string;
  createdAt: Date;
  updatedAt: Date;
}
