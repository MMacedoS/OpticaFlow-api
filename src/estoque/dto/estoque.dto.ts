import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateEstoqueDto {
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O empresaId é obrigatório.' })
  empresaId!: string;

  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId é obrigatório.' })
  filialId!: string;

  @IsOptional()
  @Type(() => String)
  @IsString({ message: 'O nome deve ser um texto válido.' })
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  nome?: string;
}

export class UpdateEstoqueDto {
  @IsOptional()
  @Type(() => String)
  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId não pode ser vazio.' })
  filialId?: string;

  @IsOptional()
  @Type(() => String)
  @IsString({ message: 'O nome deve ser um texto válido.' })
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  nome?: string;
}
