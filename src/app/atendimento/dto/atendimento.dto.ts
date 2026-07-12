import { StatusAtendimento } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAtendimentoDto {
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O empresaId é obrigatório.' })
  empresaId!: string;

  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId é obrigatório.' })
  filialId!: string;

  @IsOptional()
  @IsString({ message: 'O agendaId deve ser um texto válido.' })
  agendaId?: string;

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
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O empresaId não pode ser vazio.' })
  empresaId?: string;

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
