import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateLaboratorioDto {
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O empresaId é obrigatório.' })
  empresaId!: string;

  @IsString({ message: 'O nome deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  nome!: string;

  @IsOptional()
  @IsString({ message: 'O CNPJ deve ser um texto válido.' })
  cnpj?: string;

  @IsOptional()
  @IsString({ message: 'O email deve ser um texto válido.' })
  @IsEmail({}, { message: 'O email deve ser um endereço válido.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'O telefone deve ser um texto válido.' })
  telefone?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'O campo ativo deve ser um booleano.' })
  ativo?: boolean;
}

export class UpdateLaboratorioDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto válido.' })
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  nome?: string;

  @IsOptional()
  @IsString({ message: 'O CNPJ deve ser um texto válido.' })
  cnpj?: string;

  @IsOptional()
  @IsString({ message: 'O email deve ser um texto válido.' })
  @IsEmail({}, { message: 'O email deve ser um endereço válido.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'O telefone deve ser um texto válido.' })
  telefone?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'O campo ativo deve ser um booleano.' })
  ativo?: boolean;
}
