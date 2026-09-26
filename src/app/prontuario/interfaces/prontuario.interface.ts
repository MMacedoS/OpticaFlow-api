import type {
  ProntuarioAcuidadeVisualDto,
  ProntuarioAnamneseDto,
  ProntuarioCeratometriaDto,
  ProntuarioDescricaoDto,
  ProntuarioDiagnosticoDto,
  ProntuarioEvolucaoClinicaDto,
  ProntuarioExameComplementarDto,
  ProntuarioPressaoIntraocularDto,
  ProntuarioRefracaoDto,
} from '../dto/prontuario.dto';

/** Secoes com no maximo um registro por prontuario (salvas por upsert). */
export interface DadosSecaoUnica {
  anamnese: ProntuarioAnamneseDto;
  acuidade_visual: ProntuarioAcuidadeVisualDto;
  refracao: ProntuarioRefracaoDto;
  ceratometria: ProntuarioCeratometriaDto;
  biomicroscopia: ProntuarioDescricaoDto;
  fundoscopia: ProntuarioDescricaoDto;
  pressao_intraocular: ProntuarioPressaoIntraocularDto;
}

export type SecaoUnica = keyof DadosSecaoUnica;

/** Secoes com varios registros por prontuario. */
export interface DadosSecaoLista {
  diagnosticos: ProntuarioDiagnosticoDto;
  exames_complementares: ProntuarioExameComplementarDto;
  evolucoes_clinicas: ProntuarioEvolucaoClinicaDto;
}

export type SecaoLista = keyof DadosSecaoLista;

export interface FiltroProntuario {
  page: number;
  limit: number;
  pacienteId?: string;
}
