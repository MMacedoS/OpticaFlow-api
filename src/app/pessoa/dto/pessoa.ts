import { Status } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { IsCPF } from 'cpf-cnpj-validator/class-validator';
import {
  ContatoEmpresaDto,
  EnderecoEmpresaDto,
} from 'src/app/empresa/dto/createEmpresa.dto';

export class PessoaDto {
  @IsOptional()
  @IsString({ message: 'O id da pessoa deve ser uma string válida.' })
  id?: string;

  @IsOptional()
  @IsString({ message: 'O id da filial deve ser uma string válida.' })
  filialId?: string;

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

  @IsOptional()
  @IsBoolean({ message: 'O campo principal deve ser booleano.' })
  is_cliente?: boolean;

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
