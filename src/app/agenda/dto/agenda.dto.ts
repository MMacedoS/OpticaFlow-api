import { StatusAgenda, StatusOrdemServico } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  IsArray,
  ValidateNested,
  IsNumber,
} from 'class-validator';

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
  @Min(0, { message: 'O desconto não pode ser negativo.' })
  desconto?: number;
}

// 2. DTO da Ordem de Serviço alinhado ao modelo OrdemServico
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

export class CreateAgendaDto {
  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId é obrigatório.' })
  @IsOptional()
  filialId?: string;

  @IsString({ message: 'O pessoaId deve ser um texto válido.' })
  @IsOptional()
  pessoaId?: string;

  @IsOptional()
  @IsString({ message: 'O profissionalId deve ser um texto válido.' })
  profissionalId?: string;

  @IsOptional()
  @IsString({ message: 'O clienteId deve ser um texto válido.' })
  clienteId?: string;

  @IsDateString({}, { message: 'A dataHora deve ser uma data válida.' })
  dataHora!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A duração deve ser um número inteiro.' })
  @Min(1, { message: 'A duração deve ser maior que zero.' })
  duracaoMin?: number;

  @IsOptional()
  @IsEnum(StatusAgenda, { message: 'Status da agenda inválido.' })
  status?: StatusAgenda;

  @IsOptional()
  @IsString({ message: 'O convenioId deve ser um texto válido.' })
  convenioId?: string;

  @IsOptional()
  @IsString({ message: 'A queixa principal deve ser um texto válido.' })
  queixa_principal?: string;

  @IsOptional()
  @IsString({ message: 'A observação deve ser um texto válido.' })
  observacao?: string;

  @IsOptional()
  temResponsavel?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrdemServicoAninhadaDto)
  ordemServico?: OrdemServicoAninhadaDto;
}

export class UpdateAgendaDto {
  @IsString({ message: 'O id da agenda deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O id da agenda é obrigatório.' })
  id!: string;

  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId é obrigatório.' })
  @IsOptional()
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O pessoaId deve ser um texto válido.' })
  pessoaId!: string;

  @IsOptional()
  @IsString({ message: 'O profissionalId deve ser um texto válido.' })
  profissionalId?: string;

  @IsOptional()
  @IsString({ message: 'O clienteId deve ser um texto válido.' })
  clienteId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A dataHora deve ser uma data válida.' })
  dataHora?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'A duração deve ser um número inteiro.' })
  @Min(1, { message: 'A duração deve ser maior que zero.' })
  duracaoMin?: number;

  @IsOptional()
  @IsEnum(StatusAgenda, { message: 'Status da agenda inválido.' })
  status?: StatusAgenda;

  @IsOptional()
  @IsString({ message: 'O convenioId deve ser um texto válido.' })
  convenioId?: string;

  @IsOptional()
  @IsString({ message: 'A queixa principal deve ser um texto válido.' })
  queixa_principal?: string;

  @IsOptional()
  @IsString({ message: 'A observação deve ser um texto válido.' })
  observacao?: string;

  @IsOptional()
  temResponsavel?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrdemServicoAninhadaDto)
  ordemServico?: OrdemServicoAninhadaDto;
}
