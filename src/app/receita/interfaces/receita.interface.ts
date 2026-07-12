import { TipoReceita } from '@prisma/client';

export interface ReceitaContextoResumo {
  id: string;
  filialId: string;
  profissionalId: string | null;
  tipo: TipoReceita;
  createdAt: Date;
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
  atendimento: {
    id: string;
    dataAtendimento: Date;
    status: string;
  } | null;
  prontuario: {
    id: string;
    createdAt: Date;
  } | null;
}

export interface ReceitaOculosResumo {
  id: string;
  receitaId: string;
  od_esferico: string | null;
  od_cilindrico: string | null;
  od_eixo: string | null;
  oe_esferico: string | null;
  oe_cilindrico: string | null;
  oe_eixo: string | null;
  dp: string | null;
  adicao: string | null;
  observacoes: string | null;
}

export interface ReceitaLenteContatoResumo {
  id: string;
  receitaId: string;
  od_curva_base: string | null;
  od_diametro: string | null;
  od_grau: string | null;
  oe_curva_base: string | null;
  oe_diametro: string | null;
  oe_grau: string | null;
  material: string | null;
  marca: string | null;
  observacoes: string | null;
}

export interface ReceitaMedicamentoResumo {
  id: string;
  receitaId: string;
  medicamento: string;
  dosagem: string | null;
  posologia: string | null;
  duracao: string | null;
  observacoes: string | null;
}

export interface ReceitaOculosListaItem extends ReceitaOculosResumo {
  receita: ReceitaContextoResumo;
}

export interface ReceitaLenteContatoListaItem extends ReceitaLenteContatoResumo {
  receita: ReceitaContextoResumo;
}

export interface ReceitaMedicamentoListaItem extends ReceitaMedicamentoResumo {
  receita: ReceitaContextoResumo;
}

export interface ReceitaResumo {
  id: string;
  empresaId: string;
  filialId: string;
  atendimentoId: string | null;
  prontuarioId: string | null;
  pacienteId: string;
  profissionalId: string | null;
  tipo: TipoReceita;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
  atendimento: {
    id: string;
    dataAtendimento: Date;
    status: string;
  } | null;
  prontuario: {
    id: string;
    createdAt: Date;
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
  oculos: ReceitaOculosResumo | null;
  lente_contato: ReceitaLenteContatoResumo | null;
  medicamento: ReceitaMedicamentoResumo | null;
}
