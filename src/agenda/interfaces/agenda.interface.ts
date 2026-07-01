import { StatusAgenda } from '@prisma/client';

export interface AgendaResumo {
  id: string;
  empresaId: string;
  filialId: string;
  pessoaId: string | null;
  profissionalId: string | null;
  dataHora: Date;
  duracaoMin: number | null;
  status: StatusAgenda;
  observacao: string | null;
  createdAt: Date;
  updatedAt: Date;
  paciente: {
    id: string;
    nome: string;
    email: string | null;
    cpf: string | null;
  } | null;
  profissional: {
    id: string;
    email: string;
    username: string | null;
    pessoa: {
      id: string;
      nome: string;
      tipo: 'oftalmologista' | 'optometrista' | 'nao_definido';
    } | null;
  } | null;
}
