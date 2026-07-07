import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsCnpj } from '../../common/decorators/is-cnpj.decorator';
import {
  ContatoEmpresaDto,
  EnderecoEmpresaDto,
} from 'src/empresa/dto/createEmpresa.dto';
import { Status } from '@prisma/client';
import { IsCPF } from 'cpf-cnpj-validator/class-validator';

export class ConfigFilialDto {
  @IsOptional()
  @IsString({ message: 'O timezone deve ser uma string válida.' })
  timezone?: string;

  @IsOptional()
  @IsString({ message: 'A moeda deve ser uma string válida.' })
  moeda?: string;
}

export class PessoaDto {
  @IsOptional()
  @IsString({ message: 'O id da pessoa deve ser uma string válida.' })
  id?: string;

  @IsString({ message: 'O nome da pessoa deve ser uma string válida.' })
  @MinLength(3, {
    message: 'O nome da pessoa deve conter pelo menos 3 caracteres.',
  })
  nome!: string;

  @IsCPF({ message: 'O CPF informado não é válido.' })
  cpf!: string;

  @IsEmail({}, { message: 'O email informado não é válido.' })
  @IsString({ message: 'O email deve ser uma string válida.' })
  email!: string;

  @IsOptional()
  @IsString({ message: 'A data de nascimento deve ser uma string válida.' })
  data_nascimento?: Date;

  @IsOptional()
  @IsString({ message: 'O genero deve ser uma string válida.' })
  genero?: string;

  @IsOptional()
  @IsString({ message: 'O estado civil deve ser uma string válida.' })
  status?: Status;
}

export class UpdateFilialDto {
  @IsOptional()
  @IsString({ message: 'O id deve ser uma string válida.' })
  id?: string;

  @IsOptional()
  @IsString({ message: 'O id da empresa deve ser uma string válida.' })
  empresaId!: string;

  @IsString({ message: 'O nome da filial deve ser uma string válida.' })
  @MinLength(3, {
    message: 'O nome da filial deve conter pelo menos 3 caracteres.',
  })
  nome!: string;

  @IsOptional()
  @IsCnpj({ message: 'O CNPJ informado não é válido.' })
  cnpj?: string;

  @IsArray()
  @IsNotEmpty({ message: 'A filial deve ter pelo menos um endereço.' })
  @ValidateNested({ each: true })
  @Type(() => EnderecoEmpresaDto)
  enderecos!: EnderecoEmpresaDto[];

  @IsArray()
  @IsNotEmpty({ message: 'A filial deve ter pelo menos um contato.' })
  @ValidateNested({ each: true })
  @Type(() => ContatoEmpresaDto)
  contatos!: ContatoEmpresaDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ConfigFilialDto)
  config?: ConfigFilialDto;

  @Type(() => PessoaDto)
  @ValidateNested()
  @IsNotEmpty({ message: 'A filial deve ter uma pessoa associada.' })
  pessoa!: PessoaDto;
}
