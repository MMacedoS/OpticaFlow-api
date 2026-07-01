import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { StatusOrdemServico } from '@prisma/client';

export class CreateOrdemServicoDto {
  @IsString({ message: 'O empresaId deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O empresaId e obrigatorio.' })
  empresaId!: string;

  @IsString({ message: 'O filialId deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O filialId e obrigatorio.' })
  filialId!: string;

  @IsOptional()
  @IsString({ message: 'O atendimentoId deve ser um texto valido.' })
  atendimentoId?: string;

  @IsOptional()
  @IsString({ message: 'O clienteId deve ser um texto valido.' })
  clienteId?: string;

  @IsOptional()
  @IsString({ message: 'O laboratorioId deve ser um texto valido.' })
  laboratorioId?: string;

  @IsOptional()
  @IsString({ message: 'O numero deve ser um texto valido.' })
  numero?: string;

  @IsOptional()
  @IsEnum(StatusOrdemServico, {
    message: 'O status deve ser um valor valido de StatusOrdemServico.',
  })
  status?: StatusOrdemServico;

  @IsOptional()
  @IsString({ message: 'A descricao deve ser um texto valido.' })
  descricao?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A previsao_entrega deve ser uma data valida.' })
  previsao_entrega?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A data_entrega deve ser uma data valida.' })
  data_entrega?: string;
}

export class UpdateOrdemServicoDto {
  @IsOptional()
  @IsString({ message: 'O atendimentoId deve ser um texto valido.' })
  atendimentoId?: string;

  @IsOptional()
  @IsString({ message: 'O clienteId deve ser um texto valido.' })
  clienteId?: string;

  @IsOptional()
  @IsString({ message: 'O laboratorioId deve ser um texto valido.' })
  laboratorioId?: string;

  @IsOptional()
  @IsString({ message: 'O numero deve ser um texto valido.' })
  numero?: string;

  @IsOptional()
  @IsEnum(StatusOrdemServico, {
    message: 'O status deve ser um valor valido de StatusOrdemServico.',
  })
  status?: StatusOrdemServico;

  @IsOptional()
  @IsString({ message: 'A descricao deve ser um texto valido.' })
  descricao?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A previsao_entrega deve ser uma data valida.' })
  previsao_entrega?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A data_entrega deve ser uma data valida.' })
  data_entrega?: string;
}
