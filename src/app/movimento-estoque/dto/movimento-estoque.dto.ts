import { TipoMovimentoEstoque } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMovimentoEstoqueDto {
  @IsString({ message: 'O estoqueId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O estoqueId é obrigatório.' })
  estoqueId!: string;

  @IsString({ message: 'O produtoId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O produtoId é obrigatório.' })
  produtoId!: string;

  @IsEnum(TipoMovimentoEstoque, {
    message: 'O tipo deve ser entrada, saida ou ajuste.',
  })
  tipo!: TipoMovimentoEstoque;

  /**
   * Entrada/saida: quantidade movimentada (> 0).
   * Ajuste: quantidade contada no inventario (novo saldo, >= 0).
   */
  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um número válido.' })
  @Min(0, { message: 'A quantidade não pode ser negativa.' })
  quantidade!: number;

  @IsOptional()
  @IsString({ message: 'O motivo deve ser um texto válido.' })
  @MaxLength(255, { message: 'O motivo deve ter no máximo 255 caracteres.' })
  motivo?: string;

  @IsOptional()
  @IsString({ message: 'A referência deve ser um texto válido.' })
  @MaxLength(100, {
    message: 'A referência deve ter no máximo 100 caracteres.',
  })
  referencia?: string;
}
