import { TipoReceita } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

const TEXTO = (campo: string) => ({
  message: `${campo} deve ser um texto válido.`,
});

export class ReceitaOculosDto {
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

export class ReceitaLenteContatoDto {
  @IsOptional()
  @IsString(TEXTO('od_curva_base'))
  od_curva_base?: string | null;

  @IsOptional()
  @IsString(TEXTO('od_diametro'))
  od_diametro?: string | null;

  @IsOptional()
  @IsString(TEXTO('od_grau'))
  od_grau?: string | null;

  @IsOptional()
  @IsString(TEXTO('oe_curva_base'))
  oe_curva_base?: string | null;

  @IsOptional()
  @IsString(TEXTO('oe_diametro'))
  oe_diametro?: string | null;

  @IsOptional()
  @IsString(TEXTO('oe_grau'))
  oe_grau?: string | null;

  @IsOptional()
  @IsString(TEXTO('material'))
  material?: string | null;

  @IsOptional()
  @IsString(TEXTO('marca'))
  marca?: string | null;

  @IsOptional()
  @IsString(TEXTO('observacoes'))
  observacoes?: string | null;
}

export class ReceitaMedicamentoDto {
  @IsString(TEXTO('medicamento'))
  @IsNotEmpty({ message: 'medicamento é obrigatório.' })
  medicamento!: string;

  @IsOptional()
  @IsString(TEXTO('dosagem'))
  dosagem?: string | null;

  @IsOptional()
  @IsString(TEXTO('posologia'))
  posologia?: string | null;

  @IsOptional()
  @IsString(TEXTO('duracao'))
  duracao?: string | null;

  @IsOptional()
  @IsString(TEXTO('observacoes'))
  observacoes?: string | null;
}

class ReceitaDetalhesDto {
  @IsOptional()
  @IsString(TEXTO('observacoes'))
  observacoes?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => ReceitaOculosDto)
  oculos?: ReceitaOculosDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ReceitaLenteContatoDto)
  lente_contato?: ReceitaLenteContatoDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ReceitaMedicamentoDto)
  medicamento?: ReceitaMedicamentoDto;
}

export class CreateReceitaDto extends ReceitaDetalhesDto {
  @IsString(TEXTO('prontuarioId'))
  @IsNotEmpty({ message: 'prontuarioId é obrigatório.' })
  prontuarioId!: string;

  @IsEnum(TipoReceita, {
    message: 'tipo deve ser oculos, lente_contato ou medicamento.',
  })
  tipo!: TipoReceita;
}

/** O tipo da receita nao muda; envie apenas o detalhe do tipo dela. */
export class UpdateReceitaDto extends ReceitaDetalhesDto {}
