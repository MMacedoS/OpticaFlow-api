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
import { IsCnpj } from '../../../common/decorators/is-cnpj.decorator';
import {
  ContatoEmpresaDto,
  EnderecoEmpresaDto,
} from 'src/app/empresa/dto/createEmpresa.dto';
import { PessoaDto } from 'src/app/pessoa/dto/pessoa';

export class ConfigFilialDto {
  @IsOptional()
  @IsString({ message: 'O timezone deve ser uma string válida.' })
  timezone?: string;

  @IsOptional()
  @IsString({ message: 'A moeda deve ser uma string válida.' })
  moeda?: string;
}

export class CreateFilialDto {
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
