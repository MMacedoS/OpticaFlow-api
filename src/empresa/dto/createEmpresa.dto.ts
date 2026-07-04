import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Status, TipoContatos } from '@prisma/client';
import { IsCnpj } from '../../common/decorators/is-cnpj.decorator';

export class CreateEmpresaDto {
  @IsString({ message: 'O nome da empresa deve ser uma string válida.' })
  @MinLength(3, {
    message: 'O nome da empresa deve conter pelo menos 3 caracteres.',
  })
  nome!: string;

  @IsString({
    message: 'A razão social da empresa deve ser uma string válida.',
  })
  razao!: string;

  @IsString({
    message: 'O nome fantasia da empresa deve ser uma string válida.',
  })
  @IsNotEmpty({ message: 'O nome fantasia da empresa não pode ser vazio.' })
  @IsCnpj({ message: 'O CNPJ informado não é válido.' })
  cnpj!: string;

  @IsOptional()
  @IsString({
    message: 'O endereço da empresa deve ser uma string válida.',
  })
  registro_estadual?: string;

  @IsOptional()
  @IsString({
    message: 'O endereço da empresa deve ser uma string válida.',
  })
  registro_municipal?: string;

  @IsNotEmpty({ message: 'O email da empresa é obrigatório.' })
  @IsEmail({}, { message: 'O email informado não é válido.' })
  email!: string;

  @IsOptional()
  @IsString({ message: 'O website deve ser uma string válida.' })
  website?: string;

  @IsOptional()
  @IsEnum(Status, { message: 'O status informado não é válido.' })
  status?: Status;

  @IsArray()
  @IsNotEmpty({ message: 'A empresa deve ter pelo menos um endereço.' })
  @ValidateNested({ each: true })
  @Type(() => EnderecoEmpresaDto)
  enderecos!: EnderecoEmpresaDto[];

  @IsArray()
  @IsNotEmpty({ message: 'A empresa deve ter pelo menos um contato.' })
  @ValidateNested({ each: true })
  @Type(() => ContatoEmpresaDto)
  contatos!: ContatoEmpresaDto[];
}

export class EnderecoEmpresaDto {
  @IsOptional()
  id?: string;

  @IsString({
    message: 'O CEP deve ser uma string válida.',
  })
  cep!: string;

  @IsOptional()
  @IsString({ message: 'O número deve ser uma string válida.' })
  numero?: string;

  @IsString({
    message: 'O logradouro deve ser uma string válida.',
  })
  logradouro!: string;

  @IsString({
    message: 'O bairro deve ser uma string válida.',
  })
  bairro!: string;

  @IsString({
    message: 'O cidade deve ser uma string válida.',
  })
  cidade!: string;

  @IsString({
    message: 'O UF deve ser uma string válida.',
  })
  uf!: string;

  @IsString({
    message: 'O País deve ser uma string válida.',
  })
  pais!: string;

  @IsOptional()
  @IsBoolean({ message: 'O campo principal deve ser booleano.' })
  principal?: boolean;
}

export class ContatoEmpresaDto {
  @IsOptional()
  id?: string;

  @IsEnum(TipoContatos, {
    message: 'O tipo de contato informado não é válido.',
  })
  @IsString({
    message: 'O Tipo deve ser uma string válida',
  })
  tipo!: TipoContatos;

  @IsString({
    message: 'O Contato deve ser uma string válida',
  })
  @IsNotEmpty({ message: 'O contato não pode ser vazio.' })
  contato!: string;

  @IsOptional()
  @IsBoolean({ message: 'O campo principal deve ser booleano.' })
  principal?: boolean;
}
