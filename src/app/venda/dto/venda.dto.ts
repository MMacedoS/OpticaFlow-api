import { FormaPagamento } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Item com produto (baixa estoque se nao for servico) ou so descricao. */
export class VendaItemDto {
  @IsOptional()
  @IsString({ message: 'O produtoId deve ser um texto válido.' })
  produtoId?: string | null;

  @IsOptional()
  @IsString({ message: 'A descrição do serviço deve ser um texto válido.' })
  @MaxLength(255, {
    message: 'A descrição do serviço deve ter no máximo 255 caracteres.',
  })
  descricao_servico?: string | null;

  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um número válido.' })
  @Min(0.001, { message: 'A quantidade deve ser maior que zero.' })
  quantidade!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'O valor unitário deve ser um número válido.' })
  @Min(0, { message: 'O valor unitário não pode ser negativo.' })
  valor_unitario!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O desconto deve ser um número válido.' })
  @Min(0, { message: 'O desconto não pode ser negativo.' })
  desconto?: number;
}

class VendaDadosDto {
  @IsOptional()
  @IsString({ message: 'O clienteId deve ser um texto válido.' })
  clienteId?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'A data da venda deve ser uma data válida.' })
  dataVenda?: string;

  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto válido.' })
  @MaxLength(1000, {
    message: 'As observações devem ter no máximo 1000 caracteres.',
  })
  observacoes?: string | null;
}

export class CreateVendaDto extends VendaDadosDto {
  /** Filial da venda; se omitida, usa a filial do usuario. */
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto válido.' })
  filialId?: string;

  @IsArray({ message: 'Os itens devem ser uma lista.' })
  @ArrayMinSize(1, { message: 'Inclua pelo menos um item na venda.' })
  @ValidateNested({ each: true })
  @Type(() => VendaItemDto)
  itens!: VendaItemDto[];
}

/** So vendas abertas podem ser editadas; itens enviados substituem os atuais. */
export class UpdateVendaDto extends VendaDadosDto {
  @IsOptional()
  @IsArray({ message: 'Os itens devem ser uma lista.' })
  @ArrayMinSize(1, { message: 'Inclua pelo menos um item na venda.' })
  @ValidateNested({ each: true })
  @Type(() => VendaItemDto)
  itens?: VendaItemDto[];
}

export class FinalizarVendaDto {
  /** Marca a receita como recebida na hora (venda de balcao). */
  @IsOptional()
  @IsBoolean({ message: 'O campo pago deve ser verdadeiro ou falso.' })
  pago?: boolean;

  /** Obrigatoria quando pago = true. */
  @IsOptional()
  @IsEnum(FormaPagamento, {
    message:
      'Forma de pagamento inválida (dinheiro, pix, cartao_credito, cartao_debito, boleto ou transferencia).',
  })
  forma_pagamento?: FormaPagamento;

  /** Vencimento da receita quando nao for paga na hora. */
  @IsOptional()
  @IsDateString({}, { message: 'O vencimento deve ser uma data válida.' })
  vencimento?: string;
}
