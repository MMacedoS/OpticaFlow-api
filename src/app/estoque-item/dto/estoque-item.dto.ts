import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

class LimitesEstoqueDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O mínimo deve ser um número válido.' })
  @Min(0, { message: 'O mínimo não pode ser negativo.' })
  minimo?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O máximo deve ser um número válido.' })
  @Min(0, { message: 'O máximo não pode ser negativo.' })
  maximo?: number | null;
}

/** Cadastra o produto no estoque com saldo zero; o saldo muda por movimentacao. */
export class CreateEstoqueItemDto extends LimitesEstoqueDto {
  @IsString({ message: 'O estoqueId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O estoqueId é obrigatório.' })
  estoqueId!: string;

  @IsString({ message: 'O produtoId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O produtoId é obrigatório.' })
  produtoId!: string;
}

export class UpdateEstoqueItemDto extends LimitesEstoqueDto {}
