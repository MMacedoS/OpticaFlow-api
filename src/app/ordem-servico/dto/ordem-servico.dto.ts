import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { StatusOrdemServico } from '@prisma/client';

class ItemOrdemServicoDto {
  @IsOptional()
  @IsString({ message: 'O produtoId deve ser um texto valido.' })
  produtoId?: string;

  @IsOptional()
  @IsString({ message: 'A descricao_servico deve ser um texto valido.' })
  descricao_servico?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um numero valido.' })
  @Min(0.000001, { message: 'A quantidade deve ser maior que zero.' })
  quantidade!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'O valor_unitario deve ser um numero valido.' })
  @Min(0, { message: 'O valor_unitario nao pode ser negativo.' })
  valor_unitario!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O desconto deve ser um numero valido.' })
  @Min(0, { message: 'O desconto nao pode ser negativo.' })
  desconto?: number;
}

export class CreateOrdemServicoDto {
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O filialId nao pode ser vazio.' })
  filialId?: string;

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

  @IsOptional()
  @IsArray({ message: 'Os itens devem ser enviados em formato de lista.' })
  @ValidateNested({ each: true })
  @Type(() => ItemOrdemServicoDto)
  itens?: ItemOrdemServicoDto[];
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
  previsao_entrega?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'A data_entrega deve ser uma data valida.' })
  data_entrega?: string | null;
}
