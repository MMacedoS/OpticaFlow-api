import { TipoFinanceiro } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateFinanceiroLancamentoDto {
  @IsString({ message: 'O empresaId deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O empresaId e obrigatorio.' })
  empresaId!: string;

  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto valido.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O atendimentoId deve ser um texto valido.' })
  atendimentoId?: string;

  @IsOptional()
  @IsString({ message: 'O vendaId deve ser um texto valido.' })
  vendaId?: string;

  @IsOptional()
  @IsString({ message: 'O compraId deve ser um texto valido.' })
  compraId?: string;

  @IsOptional()
  @IsString({ message: 'O ordemServicoId deve ser um texto valido.' })
  ordemServicoId?: string;

  @IsOptional()
  @IsString({ message: 'O criadoPorId deve ser um texto valido.' })
  criadoPorId?: string;

  @IsEnum(TipoFinanceiro, {
    message: 'O tipo financeiro informado e invalido.',
  })
  tipo!: TipoFinanceiro;

  @IsOptional()
  @IsString({ message: 'A categoria deve ser um texto valido.' })
  categoria?: string;

  @IsOptional()
  @IsString({ message: 'A descricao deve ser um texto valido.' })
  descricao?: string;

  @IsNumber({}, { message: 'O valor deve ser numerico.' })
  @Min(0, { message: 'O valor nao pode ser negativo.' })
  valor!: number;

  @IsOptional()
  @IsDateString({}, { message: 'O vencimento deve ser uma data valida.' })
  vencimento?: string;

  @IsOptional()
  @IsDateString({}, { message: 'O pagoEm deve ser uma data valida.' })
  pagoEm?: string;

  @IsOptional()
  @IsString({ message: 'O status deve ser um texto valido.' })
  status?: string;
}

export class UpdateFinanceiroLancamentoDto {
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto valido.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O atendimentoId deve ser um texto valido.' })
  atendimentoId?: string;

  @IsOptional()
  @IsString({ message: 'O vendaId deve ser um texto valido.' })
  vendaId?: string;

  @IsOptional()
  @IsString({ message: 'O compraId deve ser um texto valido.' })
  compraId?: string;

  @IsOptional()
  @IsString({ message: 'O ordemServicoId deve ser um texto valido.' })
  ordemServicoId?: string;

  @IsOptional()
  @IsString({ message: 'O criadoPorId deve ser um texto valido.' })
  criadoPorId?: string;

  @IsOptional()
  @IsEnum(TipoFinanceiro, {
    message: 'O tipo financeiro informado e invalido.',
  })
  tipo?: TipoFinanceiro;

  @IsOptional()
  @IsString({ message: 'A categoria deve ser um texto valido.' })
  categoria?: string;

  @IsOptional()
  @IsString({ message: 'A descricao deve ser um texto valido.' })
  descricao?: string;

  @IsOptional()
  @IsNumber({}, { message: 'O valor deve ser numerico.' })
  @Min(0, { message: 'O valor nao pode ser negativo.' })
  valor?: number;

  @IsOptional()
  @IsDateString({}, { message: 'O vencimento deve ser uma data valida.' })
  vencimento?: string;

  @IsOptional()
  @IsDateString({}, { message: 'O pagoEm deve ser uma data valida.' })
  pagoEm?: string;

  @IsOptional()
  @IsString({ message: 'O status deve ser um texto valido.' })
  status?: string;
}
