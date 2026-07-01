import { StatusAgenda, StatusAtendimento } from '@prisma/client';

export interface AtendimentoResumo {
  id: string;
  empresaId: string;
  filialId: string;
  agendaId: string | null;
  pacienteId: string;
  profissionalId: string | null;
  clienteId: string | null;
  convenioId: string | null;
  dataAtendimento: Date;
  status: StatusAtendimento;
  queixa_principal: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
  agenda: {
    id: string;
    dataHora: Date;
    status: StatusAgenda;
  } | null;
  paciente: {
    id: string;
    nome: string;
    email: string | null;
    cpf: string | null;
  };
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
  cliente: {
    id: string;
    numero_convenio: string | null;
    pessoa: {
      id: string;
      nome: string;
      email: string | null;
      cpf: string | null;
    };
  } | null;
  convenio: {
    id: string;
    nome: string;
    registro: string | null;
  } | null;
}
