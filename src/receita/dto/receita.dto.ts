import { TipoReceita } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateReceitaOculosDto {
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

export class UpdateReceitaOculosDto extends CreateReceitaOculosDto {}

export class CreateReceitaLenteContatoDto {
  @IsOptional()
  @IsString({ message: 'od_curva_base deve ser um texto válido.' })
  od_curva_base?: string;

  @IsOptional()
  @IsString({ message: 'od_diametro deve ser um texto válido.' })
  od_diametro?: string;

  @IsOptional()
  @IsString({ message: 'od_grau deve ser um texto válido.' })
  od_grau?: string;

  @IsOptional()
  @IsString({ message: 'oe_curva_base deve ser um texto válido.' })
  oe_curva_base?: string;

  @IsOptional()
  @IsString({ message: 'oe_diametro deve ser um texto válido.' })
  oe_diametro?: string;

  @IsOptional()
  @IsString({ message: 'oe_grau deve ser um texto válido.' })
  oe_grau?: string;

  @IsOptional()
  @IsString({ message: 'material deve ser um texto válido.' })
  material?: string;

  @IsOptional()
  @IsString({ message: 'marca deve ser um texto válido.' })
  marca?: string;

  @IsOptional()
  @IsString({ message: 'observacoes deve ser um texto válido.' })
  observacoes?: string;
}

export class UpdateReceitaLenteContatoDto extends CreateReceitaLenteContatoDto {}

export class CreateReceitaMedicamentoDto {
  @IsString({ message: 'medicamento deve ser um texto válido.' })
  @IsNotEmpty({ message: 'medicamento é obrigatório.' })
  medicamento!: string;

  @IsOptional()
  @IsString({ message: 'dosagem deve ser um texto válido.' })
  dosagem?: string;

  @IsOptional()
  @IsString({ message: 'posologia deve ser um texto válido.' })
  posologia?: string;

  @IsOptional()
  @IsString({ message: 'duracao deve ser um texto válido.' })
  duracao?: string;

  @IsOptional()
  @IsString({ message: 'observacoes deve ser um texto válido.' })
  observacoes?: string;
}

export class UpdateReceitaMedicamentoDto {
  @IsOptional()
  @IsString({ message: 'medicamento deve ser um texto válido.' })
  medicamento?: string;

  @IsOptional()
  @IsString({ message: 'dosagem deve ser um texto válido.' })
  dosagem?: string;

  @IsOptional()
  @IsString({ message: 'posologia deve ser um texto válido.' })
  posologia?: string;

  @IsOptional()
  @IsString({ message: 'duracao deve ser um texto válido.' })
  duracao?: string;

  @IsOptional()
  @IsString({ message: 'observacoes deve ser um texto válido.' })
  observacoes?: string;
}

export class CreateReceitaDto {
  @IsString({ message: 'empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'empresaId é obrigatório.' })
  empresaId!: string;

  @IsString({ message: 'filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'filialId é obrigatório.' })
  filialId!: string;

  @IsOptional()
  @IsString({ message: 'atendimentoId deve ser um texto válido.' })
  atendimentoId?: string;

  @IsOptional()
  @IsString({ message: 'prontuarioId deve ser um texto válido.' })
  prontuarioId?: string;

  @IsString({ message: 'pacienteId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'pacienteId é obrigatório.' })
  pacienteId!: string;

  @IsOptional()
  @IsString({ message: 'profissionalId deve ser um texto válido.' })
  profissionalId?: string;

  @IsEnum(TipoReceita, { message: 'tipo de receita inválido.' })
  tipo!: TipoReceita;

  @IsOptional()
  @IsString({ message: 'observacoes deve ser um texto válido.' })
  observacoes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateReceitaOculosDto)
  oculos?: CreateReceitaOculosDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateReceitaLenteContatoDto)
  lente_contato?: CreateReceitaLenteContatoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateReceitaMedicamentoDto)
  medicamento?: CreateReceitaMedicamentoDto;
}

export class UpdateReceitaDto {
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
  atendimentoId?: string;

  @IsOptional()
  @IsString({ message: 'prontuarioId deve ser um texto válido.' })
  prontuarioId?: string;

  @IsOptional()
  @IsString({ message: 'pacienteId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'pacienteId não pode ser vazio.' })
  pacienteId?: string;

  @IsOptional()
  @IsString({ message: 'profissionalId deve ser um texto válido.' })
  profissionalId?: string;

  @IsOptional()
  @IsEnum(TipoReceita, { message: 'tipo de receita inválido.' })
  tipo?: TipoReceita;

  @IsOptional()
  @IsString({ message: 'observacoes deve ser um texto válido.' })
  observacoes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateReceitaOculosDto)
  oculos?: UpdateReceitaOculosDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateReceitaLenteContatoDto)
  lente_contato?: UpdateReceitaLenteContatoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateReceitaMedicamentoDto)
  medicamento?: UpdateReceitaMedicamentoDto;
}
