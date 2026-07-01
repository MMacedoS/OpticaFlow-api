import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { TipoProduto } from '@prisma/client';

export class CreateProdutoDto {
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O empresaId é obrigatório.' })
  empresaId!: string;

  @IsString({ message: 'O nome deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  nome!: string;

  @IsString({ message: 'O SKU deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O SKU é obrigatório.' })
  sku!: string;

  @IsEnum(TipoProduto, {
    message: 'O tipo informado não é válido.',
  })
  tipo!: TipoProduto;

  @IsOptional()
  @IsString({ message: 'A categoria deve ser um texto válido.' })
  categoria?: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto válido.' })
  descricao?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O preço de custo deve ser um número válido.' })
  @Min(0, { message: 'O preço de custo não pode ser negativo.' })
  preco_custo?: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'O preço de venda deve ser um número válido.' })
  @Min(0, { message: 'O preço de venda não pode ser negativo.' })
  preco_venda!: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'O campo ativo deve ser um booleano.' })
  ativo?: boolean;
}

export class UpdateProdutoDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto válido.' })
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  nome?: string;

  @IsOptional()
  @IsString({ message: 'O SKU deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O SKU não pode ser vazio.' })
  sku?: string;

  @IsOptional()
  @IsEnum(TipoProduto, {
    message: 'O tipo informado não é válido.',
  })
  tipo?: TipoProduto;

  @IsOptional()
  @IsString({ message: 'A categoria deve ser um texto válido.' })
  categoria?: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto válido.' })
  descricao?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O preço de custo deve ser um número válido.' })
  @Min(0, { message: 'O preço de custo não pode ser negativo.' })
  preco_custo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O preço de venda deve ser um número válido.' })
  @Min(0, { message: 'O preço de venda não pode ser negativo.' })
  preco_venda?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'O campo ativo deve ser um booleano.' })
  ativo?: boolean;
}
