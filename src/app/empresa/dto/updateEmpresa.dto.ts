import { Status } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ContatoEmpresaDto, EnderecoEmpresaDto } from './createEmpresa.dto';

export class UpdateEmpresaDto {
  @IsString({
    message: 'O ID da empresa deve ser uma string válida.',
  })
  id!: string;

  @IsOptional()
  @IsString({
    message: 'O nome deve ser uma string válida.',
  })
  nome?: string;

  @IsOptional()
  @IsString({
    message: 'A razão social deve ser uma string válida.',
  })
  razao?: string;

  @IsOptional()
  @IsString({
    message: 'O CNPJ deve ser uma string válida.',
  })
  cnpj?: string;

  @IsOptional()
  @IsString({
    message: 'O registro estadual deve ser uma string válida.',
  })
  registro_estadual?: string;

  @IsOptional()
  @IsString({
    message: 'O registro municipal deve ser uma string válida.',
  })
  registro_municipal?: string;

  @IsOptional()
  @IsEmail({}, { message: 'O email deve ser um email válido.' })
  email?: string;

  @IsOptional()
  @IsString({
    message: 'O website deve ser uma string válida.',
  })
  website?: string;

  @IsOptional()
  @IsEnum(Status, { message: 'O status informado não é válido.' })
  status?: Status;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EnderecoEmpresaDto)
  enderecos?: EnderecoEmpresaDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContatoEmpresaDto)
  contatos?: ContatoEmpresaDto[];
}
