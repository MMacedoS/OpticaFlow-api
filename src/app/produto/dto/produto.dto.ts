import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Status, TipoProduto } from '@prisma/client';

export class CreateProdutoDto {
  @IsOptional()
  @IsString()
  empresaId?: string;

  @IsOptional()
  @IsString()
  filialId?: string;

  @IsString()
  @IsNotEmpty({ message: 'O nome do item é obrigatório.' })
  nome!: string;

  @IsString()
  @IsNotEmpty({ message: 'O SKU é obrigatório.' })
  sku!: string;

  @IsEnum(TipoProduto, {
    message: 'O tipo deve ser armacao, lente, acesssorio ou servico.',
  })
  tipo!: TipoProduto;

  @IsString()
  @IsOptional()
  categoria?: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'O preço de custo deve ser um número válido.' })
  @Min(0, { message: 'O preço de custo não pode ser negativo.' })
  @IsOptional()
  preco_custo?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  margem_lucro?: number = 0;

  @Type(() => Number)
  @IsNumber({}, { message: 'O preço de venda deve ser um número válido.' })
  @Min(0, { message: 'O preço de venda não pode ser negativo.' })
  preco_venda!: number;

  @IsEnum(Status, { message: 'O status deve ser ativo ou inativo.' })
  @IsOptional()
  ativo?: Status = Status.ativo;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantidade_inicial?: number = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  estoque_minimo?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  estoque_maximo?: number;
}

export class UpdateProdutoDto {
  @IsOptional()
  @IsString()
  empresaId?: string;

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

  @IsString()
  @IsOptional()
  descricao?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'O preço de custo deve ser um número válido.' })
  @Min(0, { message: 'O preço de custo não pode ser negativo.' })
  @IsOptional()
  preco_custo?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  margem_lucro?: number = 0;

  @Type(() => Number)
  @IsNumber({}, { message: 'O preço de venda deve ser um número válido.' })
  @Min(0, { message: 'O preço de venda não pode ser negativo.' })
  preco_venda!: number;

  @IsEnum(Status, { message: 'O status deve ser ativo ou inativo.' })
  @IsOptional()
  ativo?: Status = Status.ativo;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantidade_inicial?: number = 0;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  estoque_minimo?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  estoque_maximo?: number;
}
export class UpdateStatusDto {
  @IsEnum(Status, { message: 'O status deve ser ativo ou inativo.' })
  status!: Status;
}
