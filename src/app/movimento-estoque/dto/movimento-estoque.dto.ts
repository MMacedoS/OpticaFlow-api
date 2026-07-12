import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { TipoMovimentoEstoque } from '@prisma/client';

export class CreateMovimentoEstoqueDto {
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O empresaId é obrigatório.' })
  empresaId!: string;

  @IsString({ message: 'O estoqueId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O estoqueId é obrigatório.' })
  estoqueId!: string;

  @IsString({ message: 'O produtoId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O produtoId é obrigatório.' })
  produtoId!: string;

  @IsEnum(TipoMovimentoEstoque, {
    message: 'O tipo de movimento informado não é válido.',
  })
  tipo!: TipoMovimentoEstoque;

  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um número válido.' })
  quantidade!: number;

  @IsOptional()
  @IsString({ message: 'O motivo deve ser um texto válido.' })
  motivo?: string;

  @IsOptional()
  @IsString({ message: 'A referência deve ser um texto válido.' })
  referencia?: string;
}

export class UpdateMovimentoEstoqueDto {
  @IsOptional()
  @IsEnum(TipoMovimentoEstoque, {
    message: 'O tipo de movimento informado não é válido.',
  })
  tipo?: TipoMovimentoEstoque;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um número válido.' })
  quantidade?: number;

  @IsOptional()
  @IsString({ message: 'O motivo deve ser um texto válido.' })
  motivo?: string;

  @IsOptional()
  @IsString({ message: 'A referência deve ser um texto válido.' })
  referencia?: string;
}
