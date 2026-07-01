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
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O empresaId é obrigatório.' })
  empresaId!: string;

  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId é obrigatório.' })
  filialId!: string;

  @IsOptional()
  @IsString({ message: 'O pessoaId deve ser um texto válido.' })
  pessoaId?: string;

  @IsOptional()
  @IsString({ message: 'O profissionalId deve ser um texto válido.' })
  profissionalId?: string;

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
  @IsString({ message: 'A observação deve ser um texto válido.' })
  observacao?: string;
}

export class UpdateAgendaDto {
  @IsOptional()
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O empresaId não pode ser vazio.' })
  empresaId?: string;

  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId não pode ser vazio.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O pessoaId deve ser um texto válido.' })
  pessoaId?: string;

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
}
