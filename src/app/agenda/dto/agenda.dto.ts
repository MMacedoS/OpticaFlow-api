import { StatusAgenda } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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
  @IsString({ message: 'O profissionalId deve ser um texto válido.' })
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
  @IsString({ message: 'A observação deve ser um texto válido.' })
  observacao?: string;

  @IsOptional()
  temResponsavel?: boolean;
}
