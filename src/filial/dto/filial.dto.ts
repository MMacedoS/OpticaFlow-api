import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { TipoContatos } from '@prisma/client';
import { IsCnpj } from '../../common/decorators/is-cnpj.decorator';

export class ConfigFilialDto {
  @IsOptional()
  @IsString({ message: 'O timezone deve ser uma string válida.' })
  timezone?: string;

  @IsOptional()
  @IsString({ message: 'A moeda deve ser uma string válida.' })
  moeda?: string;
}

export class EnderecoFilialDto {
  @IsString({ message: 'O CEP deve ser uma string válida.' })
  cep!: string;

  @IsOptional()
  @IsString({ message: 'O número deve ser uma string válida.' })
  numero?: string;

  @IsString({ message: 'O logradouro deve ser uma string válida.' })
  logradouro!: string;

  @IsString({ message: 'O bairro deve ser uma string válida.' })
  bairro!: string;

  @IsString({ message: 'A cidade deve ser uma string válida.' })
  cidade!: string;

  @IsString({ message: 'O UF deve ser uma string válida.' })
  uf!: string;

  @IsString({ message: 'O país deve ser uma string válida.' })
  pais!: string;

  @IsOptional()
  @IsBoolean({ message: 'O campo principal deve ser um booleano.' })
  principal?: boolean;
}

export class ContatoFilialDto {
  @IsEnum(TipoContatos, {
    message: 'O tipo de contato informado não é válido.',
  })
  tipo!: TipoContatos;

  @IsString({ message: 'O contato deve ser uma string válida.' })
  @IsNotEmpty({ message: 'O contato não pode ser vazio.' })
  Contato!: string;

  @IsOptional()
  @IsBoolean({ message: 'O campo principal deve ser um booleano.' })
  principal?: boolean;
}

export class CreateFilialDto {
  @IsString({ message: 'O nome da filial deve ser uma string válida.' })
  @MinLength(3, {
    message: 'O nome da filial deve conter pelo menos 3 caracteres.',
  })
  nome!: string;

  @IsOptional()
  @IsCnpj({ message: 'O CNPJ informado não é válido.' })
  cnpj?: string;

  @IsNotEmpty({ message: 'O empresaId é obrigatório.' })
  @IsString({ message: 'O empresaId deve ser uma string válida.' })
  empresaId!: string;

  @IsArray()
  @IsNotEmpty({ message: 'A filial deve ter pelo menos um endereço.' })
  @ValidateNested({ each: true })
  @Type(() => EnderecoFilialDto)
  enderecos!: EnderecoFilialDto[];

  @IsArray()
  @IsNotEmpty({ message: 'A filial deve ter pelo menos um contato.' })
  @ValidateNested({ each: true })
  @Type(() => ContatoFilialDto)
  contatos!: ContatoFilialDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ConfigFilialDto)
  config?: ConfigFilialDto;
}
