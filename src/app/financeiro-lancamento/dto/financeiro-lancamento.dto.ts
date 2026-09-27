import { FormaPagamento, TipoFinanceiro } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const FORMA_MSG = {
  message:
    'Forma de pagamento inválida (dinheiro, pix, cartao_credito, cartao_debito, boleto ou transferencia).',
};

class LancamentoDadosDto {
  @IsOptional()
  @IsString({ message: 'A categoria deve ser um texto válido.' })
  @MaxLength(60, { message: 'A categoria deve ter no máximo 60 caracteres.' })
  categoria?: string | null;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto válido.' })
  @MaxLength(255, { message: 'A descrição deve ter no máximo 255 caracteres.' })
  descricao?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'O vencimento deve ser uma data válida.' })
  vencimento?: string | null;
}

/** Lancamento avulso (aluguel, salarios...). Compras e vendas geram os seus. */
export class CreateFinanceiroLancamentoDto extends LancamentoDadosDto {
  @IsEnum(TipoFinanceiro, { message: 'O tipo deve ser receita ou despesa.' })
  tipo!: TipoFinanceiro;

  @Type(() => Number)
  @IsNumber({}, { message: 'O valor deve ser um número válido.' })
  @Min(0.01, { message: 'O valor deve ser maior que zero.' })
  valor!: number;

  /** Filial do lancamento; se omitida, usa a filial do usuario (opcional). */
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto válido.' })
  filialId?: string;

  /** Ja lanca como pago (baixa imediata). */
  @IsOptional()
  @IsBoolean({ message: 'O campo pago deve ser verdadeiro ou falso.' })
  pago?: boolean;

  @IsOptional()
  @IsEnum(FormaPagamento, FORMA_MSG)
  forma_pagamento?: FormaPagamento;
}

export class UpdateFinanceiroLancamentoDto extends LancamentoDadosDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O valor deve ser um número válido.' })
  @Min(0.01, { message: 'O valor deve ser maior que zero.' })
  valor?: number;
}

export class BaixarLancamentoDto {
  @IsOptional()
  @IsDateString(
    {},
    { message: 'A data do pagamento deve ser uma data válida.' },
  )
  pagoEm?: string;

  @IsEnum(FormaPagamento, FORMA_MSG)
  @IsNotEmpty({ message: 'Informe a forma de pagamento.' })
  forma_pagamento!: FormaPagamento;
}
