import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const TEXTO = (campo: string) => ({
  message: `${campo} deve ser um texto válido.`,
});

export class CreateProntuarioDto {
  @IsString(TEXTO('atendimentoId'))
  @IsNotEmpty({ message: 'atendimentoId é obrigatório.' })
  atendimentoId!: string;

  @IsOptional()
  @IsString(TEXTO('resumo_clinico'))
  resumo_clinico?: string | null;
}

export class UpdateProntuarioDto {
  @IsOptional()
  @IsString(TEXTO('resumo_clinico'))
  resumo_clinico?: string | null;
}

export class ProntuarioAnamneseDto {
  @IsOptional()
  @IsString(TEXTO('historico_pessoal'))
  historico_pessoal?: string | null;

  @IsOptional()
  @IsString(TEXTO('historico_familiar'))
  historico_familiar?: string | null;

  @IsOptional()
  @IsString(TEXTO('alergias'))
  alergias?: string | null;

  @IsOptional()
  @IsString(TEXTO('medicamentos_uso'))
  medicamentos_uso?: string | null;

  @IsOptional()
  @IsString(TEXTO('observacoes'))
  observacoes?: string | null;
}

export class ProntuarioAcuidadeVisualDto {
  @IsOptional()
  @IsString(TEXTO('od_sem_correcao'))
  od_sem_correcao?: string | null;

  @IsOptional()
  @IsString(TEXTO('oe_sem_correcao'))
  oe_sem_correcao?: string | null;

  @IsOptional()
  @IsString(TEXTO('od_com_correcao'))
  od_com_correcao?: string | null;

  @IsOptional()
  @IsString(TEXTO('oe_com_correcao'))
  oe_com_correcao?: string | null;

  @IsOptional()
  @IsString(TEXTO('observacoes'))
  observacoes?: string | null;
}

export class ProntuarioRefracaoDto {
  @IsOptional()
  @IsString(TEXTO('od_esferico'))
  od_esferico?: string | null;

  @IsOptional()
  @IsString(TEXTO('od_cilindrico'))
  od_cilindrico?: string | null;

  @IsOptional()
  @IsString(TEXTO('od_eixo'))
  od_eixo?: string | null;

  @IsOptional()
  @IsString(TEXTO('oe_esferico'))
  oe_esferico?: string | null;

  @IsOptional()
  @IsString(TEXTO('oe_cilindrico'))
  oe_cilindrico?: string | null;

  @IsOptional()
  @IsString(TEXTO('oe_eixo'))
  oe_eixo?: string | null;

  @IsOptional()
  @IsString(TEXTO('dp'))
  dp?: string | null;

  @IsOptional()
  @IsString(TEXTO('adicao'))
  adicao?: string | null;

  @IsOptional()
  @IsString(TEXTO('observacoes'))
  observacoes?: string | null;
}

export class ProntuarioCeratometriaDto {
  @IsOptional()
  @IsString(TEXTO('od_k1'))
  od_k1?: string | null;

  @IsOptional()
  @IsString(TEXTO('od_k2'))
  od_k2?: string | null;

  @IsOptional()
  @IsString(TEXTO('oe_k1'))
  oe_k1?: string | null;

  @IsOptional()
  @IsString(TEXTO('oe_k2'))
  oe_k2?: string | null;

  @IsOptional()
  @IsString(TEXTO('observacoes'))
  observacoes?: string | null;
}

export class ProntuarioDescricaoDto {
  @IsOptional()
  @IsString(TEXTO('descricao'))
  descricao?: string | null;
}

export class ProntuarioPressaoIntraocularDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'od_mmhg deve ser numérico.' })
  @Min(0, { message: 'od_mmhg não pode ser negativo.' })
  @Max(80, { message: 'od_mmhg deve ser no máximo 80.' })
  od_mmhg?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'oe_mmhg deve ser numérico.' })
  @Min(0, { message: 'oe_mmhg não pode ser negativo.' })
  @Max(80, { message: 'oe_mmhg deve ser no máximo 80.' })
  oe_mmhg?: number | null;

  @IsOptional()
  @IsDateString({}, { message: 'horario deve ser uma data válida.' })
  horario?: string | null;

  @IsOptional()
  @IsString(TEXTO('observacoes'))
  observacoes?: string | null;
}

export class ProntuarioDiagnosticoDto {
  @IsString(TEXTO('codigo'))
  @IsNotEmpty({ message: 'codigo é obrigatório.' })
  @MaxLength(20, { message: 'codigo deve ter no máximo 20 caracteres.' })
  codigo!: string;

  @IsString(TEXTO('versao'))
  @IsNotEmpty({ message: 'versao é obrigatória (ex.: CID-10).' })
  versao!: string;

  @IsOptional()
  @IsString(TEXTO('descricao'))
  descricao?: string | null;
}

export class ProntuarioExameComplementarDto {
  @IsString(TEXTO('exame'))
  @IsNotEmpty({ message: 'exame é obrigatório.' })
  exame!: string;

  @IsOptional()
  @IsString(TEXTO('resultado'))
  resultado?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'dataExame deve ser uma data válida.' })
  dataExame?: string | null;
}

export class ProntuarioEvolucaoClinicaDto {
  @IsString(TEXTO('descricao'))
  @IsNotEmpty({ message: 'descricao é obrigatória.' })
  descricao!: string;

  @IsOptional()
  @IsDateString({}, { message: 'dataEvolucao deve ser uma data válida.' })
  dataEvolucao?: string;
}
