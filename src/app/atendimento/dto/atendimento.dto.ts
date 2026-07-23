import { StatusAtendimento, StatusOrdemServico } from '@prisma/client';
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

export class CreateAtendimentoDto {
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId é obrigatório.' })
  filialId?: string;

  @IsString({ message: 'O pacienteId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O pacienteId é obrigatório.' })
  pacienteId!: string;

  @IsOptional()
  @IsString({ message: 'O profissionalId deve ser um texto válido.' })
  profissionalId?: string;

  @IsOptional()
  @IsString({ message: 'O clienteId deve ser um texto válido.' })
  clienteId?: string;

  @IsOptional()
  @IsString({ message: 'O convenioId deve ser um texto válido.' })
  convenioId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A dataAtendimento deve ser uma data válida.' })
  dataAtendimento?: string;

  @IsOptional()
  @IsEnum(StatusAtendimento, { message: 'Status do atendimento inválido.' })
  status?: StatusAtendimento;

  @IsOptional()
  @IsString({ message: 'A queixa principal deve ser um texto válido.' })
  queixa_principal?: string;

  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto válido.' })
  observacoes?: string;
}

export class UpdateAtendimentoDto {
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId não pode ser vazio.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O agendaId deve ser um texto válido.' })
  agendaId?: string;

  @IsOptional()
  @IsString({ message: 'O pacienteId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O pacienteId não pode ser vazio.' })
  pacienteId?: string;

  @IsOptional()
  @IsString({ message: 'O profissionalId deve ser um texto válido.' })
  profissionalId?: string;

  @IsOptional()
  @IsString({ message: 'O clienteId deve ser um texto válido.' })
  clienteId?: string;

  @IsOptional()
  @IsString({ message: 'O convenioId deve ser um texto válido.' })
  convenioId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A dataAtendimento deve ser uma data válida.' })
  dataAtendimento?: string;

  @IsOptional()
  @IsEnum(StatusAtendimento, { message: 'Status do atendimento inválido.' })
  status?: StatusAtendimento;

  @IsOptional()
  @IsString({ message: 'A queixa principal deve ser um texto válido.' })
  queixa_principal?: string;

  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto válido.' })
  observacoes?: string;
}

// 1. DTO de Itens alinhado ao modelo OrdemServicoItem
class ItemOrdemServicoDto {
  @IsString({ message: 'O produtoId deve ser um texto válido.' })
  @IsOptional()
  produtoId?: string;

  @IsString({ message: 'A descrição do serviço deve ser um texto válido.' })
  @IsOptional()
  descricao_servico?: string;

  @IsNumber({}, { message: 'A quantidade deve ser um número válido.' })
  @Min(1, { message: 'A quantidade mínima deve ser 1.' })
  quantidade!: number;

  @IsNumber({}, { message: 'O valor unitário deve ser um número válido.' })
  @Min(0, { message: 'O valor unitário não pode ser negativo.' })
  valor_unitario!: number;

  @IsNumber({}, { message: 'O desconto deve ser un número válido.' })
  @IsOptional()
  desconto?: number;
}

class OrdemServicoAninhadaDto {
  @IsEnum(StatusOrdemServico, {
    message: 'Status da ordem de serviço inválido.',
  })
  @IsOptional()
  status?: StatusOrdemServico;

  @IsString({ message: 'A descrição deve ser um texto válido.' })
  @IsOptional()
  descricao?: string; // Alterado de observacao para descricao

  @IsNumber({}, { message: 'O valor total deve ser um número válido.' })
  @IsOptional()
  valor_total?: number;

  @IsArray({ message: 'Os itens devem ser enviados em formato de lista.' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ItemOrdemServicoDto)
  itens?: ItemOrdemServicoDto[]; // Alterado de ordemServicoItens para itens
}

export class AtendimentoComOrdemServicoDto {
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId é obrigatório.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O pacienteId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O pacienteId é obrigatório.' })
  pacienteId?: string;

  @IsOptional()
  @IsString({ message: 'O profissionalId deve ser um texto válido.' })
  profissionalId?: string;

  @IsOptional()
  @IsString({ message: 'O clienteId deve ser um texto válido.' })
  clienteId?: string;

  @IsOptional()
  @IsString({ message: 'O convenioId deve ser um texto válido.' })
  convenioId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A dataAtendimento deve ser uma data válida.' })
  dataAtendimento?: string;

  @IsOptional()
  @IsEnum(StatusAtendimento, { message: 'Status do atendimento inválido.' })
  status?: StatusAtendimento;

  @IsOptional()
  @IsString({ message: 'A queixa principal deve ser um texto válido.' })
  queixa_principal?: string;

  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto válido.' })
  observacoes?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrdemServicoAninhadaDto)
  ordemServico?: OrdemServicoAninhadaDto;
}
