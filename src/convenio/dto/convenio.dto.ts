import { Status } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateConvenioDto {
  @IsOptional()
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  empresaId?: string;

  @IsString({ message: 'O nome deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  nome!: string;

  @IsOptional()
  @IsString({ message: 'O registro deve ser um texto válido.' })
  registro?: string;

  @IsOptional()
  ativo?: Status;
}

export class UpdateConvenioDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto válido.' })
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  nome?: string;

  @IsOptional()
  @IsString({ message: 'O registro deve ser um texto válido.' })
  registro?: string;

  @IsOptional()
  @IsString({ message: 'O campo ativo deve ser um string.' })
  ativo?: Status;
}
