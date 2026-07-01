import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateProntuarioAnamneseDto {
  @IsOptional()
  @IsString({ message: 'historico_pessoal deve ser um texto válido.' })
  historico_pessoal?: string;

  @IsOptional()
  @IsString({ message: 'historico_familiar deve ser um texto válido.' })
  historico_familiar?: string;

  @IsOptional()
  @IsString({ message: 'alergias deve ser um texto válido.' })
  alergias?: string;

  @IsOptional()
  @IsString({ message: 'medicamentos_uso deve ser um texto válido.' })
  medicamentos_uso?: string;

  @IsOptional()
  @IsString({ message: 'observacoes deve ser um texto válido.' })
  observacoes?: string;
}

export class UpdateProntuarioAnamneseDto extends CreateProntuarioAnamneseDto {}

export class CreateProntuarioAcuidadeVisualDto {
  @IsOptional()
  @IsString({ message: 'od_sem_correcao deve ser um texto válido.' })
  od_sem_correcao?: string;

  @IsOptional()
  @IsString({ message: 'oe_sem_correcao deve ser um texto válido.' })
  oe_sem_correcao?: string;

  @IsOptional()
  @IsString({ message: 'od_com_correcao deve ser um texto válido.' })
  od_com_correcao?: string;

  @IsOptional()
  @IsString({ message: 'oe_com_correcao deve ser um texto válido.' })
  oe_com_correcao?: string;

  @IsOptional()
  @IsString({ message: 'observacoes deve ser um texto válido.' })
  observacoes?: string;
}

export class UpdateProntuarioAcuidadeVisualDto extends CreateProntuarioAcuidadeVisualDto {}

export class CreateProntuarioRefracaoDto {
  @IsOptional()
  @IsString({ message: 'od_esferico deve ser um texto válido.' })
  od_esferico?: string;

  @IsOptional()
  @IsString({ message: 'od_cilindrico deve ser um texto válido.' })
  od_cilindrico?: string;

  @IsOptional()
  @IsString({ message: 'od_eixo deve ser um texto válido.' })
  od_eixo?: string;

  @IsOptional()
  @IsString({ message: 'oe_esferico deve ser um texto válido.' })
  oe_esferico?: string;

  @IsOptional()
  @IsString({ message: 'oe_cilindrico deve ser um texto válido.' })
  oe_cilindrico?: string;

  @IsOptional()
  @IsString({ message: 'oe_eixo deve ser um texto válido.' })
  oe_eixo?: string;

  @IsOptional()
  @IsString({ message: 'dp deve ser um texto válido.' })
  dp?: string;

  @IsOptional()
  @IsString({ message: 'adicao deve ser um texto válido.' })
  adicao?: string;

  @IsOptional()
  @IsString({ message: 'observacoes deve ser um texto válido.' })
  observacoes?: string;
}

export class UpdateProntuarioRefracaoDto extends CreateProntuarioRefracaoDto {}

export class CreateProntuarioCeratometriaDto {
  @IsOptional()
  @IsString({ message: 'od_k1 deve ser um texto válido.' })
  od_k1?: string;

  @IsOptional()
  @IsString({ message: 'od_k2 deve ser um texto válido.' })
  od_k2?: string;

  @IsOptional()
  @IsString({ message: 'oe_k1 deve ser um texto válido.' })
  oe_k1?: string;

  @IsOptional()
  @IsString({ message: 'oe_k2 deve ser um texto válido.' })
  oe_k2?: string;

  @IsOptional()
  @IsString({ message: 'observacoes deve ser um texto válido.' })
  observacoes?: string;
}

export class UpdateProntuarioCeratometriaDto extends CreateProntuarioCeratometriaDto {}

export class CreateProntuarioBiomicroscopiaDto {
  @IsOptional()
  @IsString({ message: 'descricao deve ser um texto válido.' })
  descricao?: string;
}

export class UpdateProntuarioBiomicroscopiaDto extends CreateProntuarioBiomicroscopiaDto {}

export class CreateProntuarioFundoscopiaDto {
  @IsOptional()
  @IsString({ message: 'descricao deve ser um texto válido.' })
  descricao?: string;
}

export class UpdateProntuarioFundoscopiaDto extends CreateProntuarioFundoscopiaDto {}

export class CreateProntuarioPressaoIntraocularDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'od_mmhg deve ser numérico.' })
  od_mmhg?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'oe_mmhg deve ser numérico.' })
  oe_mmhg?: number;

  @IsOptional()
  @IsDateString({}, { message: 'horario deve ser uma data válida.' })
  horario?: string;

  @IsOptional()
  @IsString({ message: 'observacoes deve ser um texto válido.' })
  observacoes?: string;
}

export class UpdateProntuarioPressaoIntraocularDto extends CreateProntuarioPressaoIntraocularDto {}

export class CreateProntuarioDiagnosticoDto {
  @IsString({ message: 'codigo deve ser um texto válido.' })
  @IsNotEmpty({ message: 'codigo é obrigatório.' })
  codigo!: string;

  @IsString({ message: 'versao deve ser um texto válido.' })
  @IsNotEmpty({ message: 'versao é obrigatório.' })
  versao!: string;

  @IsOptional()
  @IsString({ message: 'descricao deve ser um texto válido.' })
  descricao?: string;
}

export class UpdateProntuarioDiagnosticoDto extends CreateProntuarioDiagnosticoDto {}

export class CreateProntuarioExameComplementarDto {
  @IsString({ message: 'exame deve ser um texto válido.' })
  @IsNotEmpty({ message: 'exame é obrigatório.' })
  exame!: string;

  @IsOptional()
  @IsString({ message: 'resultado deve ser um texto válido.' })
  resultado?: string;

  @IsOptional()
  @IsDateString({}, { message: 'dataExame deve ser uma data válida.' })
  dataExame?: string;
}

export class UpdateProntuarioExameComplementarDto extends CreateProntuarioExameComplementarDto {}

export class CreateProntuarioEvolucaoClinicaDto {
  @IsString({ message: 'descricao deve ser um texto válido.' })
  @IsNotEmpty({ message: 'descricao é obrigatória.' })
  descricao!: string;

  @IsOptional()
  @IsDateString({}, { message: 'dataEvolucao deve ser uma data válida.' })
  dataEvolucao?: string;
}

export class UpdateProntuarioEvolucaoClinicaDto extends CreateProntuarioEvolucaoClinicaDto {}

export class CreateProntuarioDto {
  @IsString({ message: 'empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'empresaId é obrigatório.' })
  empresaId!: string;

  @IsString({ message: 'filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'filialId é obrigatório.' })
  filialId!: string;

  @IsString({ message: 'atendimentoId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'atendimentoId é obrigatório.' })
  atendimentoId!: string;

  @IsString({ message: 'pacienteId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'pacienteId é obrigatório.' })
  pacienteId!: string;

  @IsOptional()
  @IsString({ message: 'profissionalId deve ser um texto válido.' })
  profissionalId?: string;

  @IsOptional()
  @IsString({ message: 'resumo_clinico deve ser um texto válido.' })
  resumo_clinico?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProntuarioAnamneseDto)
  anamnese?: CreateProntuarioAnamneseDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProntuarioAcuidadeVisualDto)
  acuidade_visual?: CreateProntuarioAcuidadeVisualDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProntuarioRefracaoDto)
  refracao?: CreateProntuarioRefracaoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProntuarioCeratometriaDto)
  ceratometria?: CreateProntuarioCeratometriaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProntuarioBiomicroscopiaDto)
  biomicroscopia?: CreateProntuarioBiomicroscopiaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProntuarioFundoscopiaDto)
  fundoscopia?: CreateProntuarioFundoscopiaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProntuarioPressaoIntraocularDto)
  pressao_intraocular?: CreateProntuarioPressaoIntraocularDto;

  @IsOptional()
  @IsArray({ message: 'diagnosticos deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => CreateProntuarioDiagnosticoDto)
  diagnosticos?: CreateProntuarioDiagnosticoDto[];

  @IsOptional()
  @IsArray({ message: 'exames_complementares deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => CreateProntuarioExameComplementarDto)
  exames_complementares?: CreateProntuarioExameComplementarDto[];

  @IsOptional()
  @IsArray({ message: 'evolucoes_clinicas deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => CreateProntuarioEvolucaoClinicaDto)
  evolucoes_clinicas?: CreateProntuarioEvolucaoClinicaDto[];
}

export class UpdateProntuarioDto {
  @IsOptional()
  @IsString({ message: 'empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'empresaId não pode ser vazio.' })
  empresaId?: string;

  @IsOptional()
  @IsString({ message: 'filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'filialId não pode ser vazio.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'atendimentoId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'atendimentoId não pode ser vazio.' })
  atendimentoId?: string;

  @IsOptional()
  @IsString({ message: 'pacienteId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'pacienteId não pode ser vazio.' })
  pacienteId?: string;

  @IsOptional()
  @IsString({ message: 'profissionalId deve ser um texto válido.' })
  profissionalId?: string;

  @IsOptional()
  @IsString({ message: 'resumo_clinico deve ser um texto válido.' })
  resumo_clinico?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProntuarioAnamneseDto)
  anamnese?: UpdateProntuarioAnamneseDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProntuarioAcuidadeVisualDto)
  acuidade_visual?: UpdateProntuarioAcuidadeVisualDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProntuarioRefracaoDto)
  refracao?: UpdateProntuarioRefracaoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProntuarioCeratometriaDto)
  ceratometria?: UpdateProntuarioCeratometriaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProntuarioBiomicroscopiaDto)
  biomicroscopia?: UpdateProntuarioBiomicroscopiaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProntuarioFundoscopiaDto)
  fundoscopia?: UpdateProntuarioFundoscopiaDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProntuarioPressaoIntraocularDto)
  pressao_intraocular?: UpdateProntuarioPressaoIntraocularDto;

  @IsOptional()
  @IsArray({ message: 'diagnosticos deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateProntuarioDiagnosticoDto)
  diagnosticos?: UpdateProntuarioDiagnosticoDto[];

  @IsOptional()
  @IsArray({ message: 'exames_complementares deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateProntuarioExameComplementarDto)
  exames_complementares?: UpdateProntuarioExameComplementarDto[];

  @IsOptional()
  @IsArray({ message: 'evolucoes_clinicas deve ser um array.' })
  @ValidateNested({ each: true })
  @Type(() => UpdateProntuarioEvolucaoClinicaDto)
  evolucoes_clinicas?: UpdateProntuarioEvolucaoClinicaDto[];
}
