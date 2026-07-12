export interface ProntuarioAnamneseResumo {
  id: string;
  prontuarioId: string;
  historico_pessoal: string | null;
  historico_familiar: string | null;
  alergias: string | null;
  medicamentos_uso: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProntuarioAnamneseListaItem extends ProntuarioAnamneseResumo {
  prontuario: {
    id: string;
    filialId: string;
    profissionalId: string | null;
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
    };
  };
}

export interface ProntuarioAcuidadeVisualResumo {
  id: string;
  prontuarioId: string;
  od_sem_correcao: string | null;
  oe_sem_correcao: string | null;
  od_com_correcao: string | null;
  oe_com_correcao: string | null;
  observacoes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProntuarioAcuidadeVisualListaItem extends ProntuarioAcuidadeVisualResumo {
  prontuario: {
    id: string;
    filialId: string;
    profissionalId: string | null;
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
    };
  };
}

export interface ProntuarioResumo {
  id: string;
  empresaId: string;
  filialId: string;
  atendimentoId: string;
  pacienteId: string;
  profissionalId: string | null;
  resumo_clinico: string | null;
  createdAt: Date;
  updatedAt: Date;
  atendimento: {
    id: string;
    dataAtendimento: Date;
    status: string;
  };
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
  anamnese: {
    id: string;
    historico_pessoal: string | null;
    historico_familiar: string | null;
    alergias: string | null;
    medicamentos_uso: string | null;
    observacoes: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  acuidade_visual: {
    id: string;
    od_sem_correcao: string | null;
    oe_sem_correcao: string | null;
    od_com_correcao: string | null;
    oe_com_correcao: string | null;
    observacoes: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  refracao: {
    id: string;
    od_esferico: string | null;
    od_cilindrico: string | null;
    od_eixo: string | null;
    oe_esferico: string | null;
    oe_cilindrico: string | null;
    oe_eixo: string | null;
    dp: string | null;
    adicao: string | null;
    observacoes: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  ceratometria: {
    id: string;
    od_k1: string | null;
    od_k2: string | null;
    oe_k1: string | null;
    oe_k2: string | null;
    observacoes: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  biomicroscopia: {
    id: string;
    descricao: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  fundoscopia: {
    id: string;
    descricao: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  pressao_intraocular: {
    id: string;
    od_mmhg: number | null;
    oe_mmhg: number | null;
    horario: Date | null;
    observacoes: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  diagnosticos: Array<{
    id: string;
    codigo: string;
    versao: string;
    descricao: string | null;
    createdAt: Date;
  }>;
  exames_complementares: Array<{
    id: string;
    exame: string;
    resultado: string | null;
    dataExame: Date | null;
    createdAt: Date;
  }>;
  evolucoes_clinicas: Array<{
    id: string;
    descricao: string;
    dataEvolucao: Date;
    createdAt: Date;
  }>;
}
