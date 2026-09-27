import { Status } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PessoaDto } from 'src/app/pessoa/dto/pessoa';

export class FuncionarioDto {
  @IsOptional()
  @IsString({ message: 'O id do convênio deve ser uma string válida.' })
  cargo?: string;

  @Type(() => PessoaDto)
  @ValidateNested()
  @IsNotEmpty({ message: 'A filial deve ter uma pessoa associada.' })
  pessoa!: PessoaDto;

  @IsOptional()
  status?: Status;

  /** Perfis de acesso escolhidos; sem eles vale a regra padrao do cargo. */
  @IsOptional()
  @IsArray({ message: 'Os perfis de acesso devem ser uma lista.' })
  @IsString({ each: true, message: 'Cada perfil deve ser um id válido.' })
  acessoIds?: string[];
}

export class UpdateFuncionarioDto {
  @IsOptional()
  @IsString({ message: 'O id do convênio deve ser uma string válida.' })
  id!: string;

  @IsOptional()
  @IsString({ message: 'O id do convênio deve ser uma string válida.' })
  cargo?: string;

  @Type(() => PessoaDto)
  @ValidateNested()
  @IsNotEmpty({ message: 'A filial deve ter uma pessoa associada.' })
  pessoa!: PessoaDto;

  @IsOptional()
  pessoaId!: string;

  @IsOptional()
  status?: Status;

  /** Perfis de acesso escolhidos; sem eles vale a regra padrao do cargo. */
  @IsOptional()
  @IsArray({ message: 'Os perfis de acesso devem ser uma lista.' })
  @IsString({ each: true, message: 'Cada perfil deve ser um id válido.' })
  acessoIds?: string[];
}
