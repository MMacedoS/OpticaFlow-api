import { Status } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  ContatoEmpresaDto,
  EnderecoEmpresaDto,
} from 'src/empresa/dto/createEmpresa.dto';
import { PessoaDto } from 'src/filial/dto/filial.dto';

export class ClienteDto {
  @IsOptional()
  @IsString({ message: 'O id do convênio deve ser uma string válida.' })
  convenioId?: string;

  @Type(() => PessoaDto)
  @ValidateNested()
  @IsNotEmpty({ message: 'A filial deve ter uma pessoa associada.' })
  pessoa!: PessoaDto;

  @IsOptional()
  status?: Status;

  @Type(() => EnderecoEmpresaDto)
  @ValidateNested()
  @IsNotEmpty({ message: 'A filial deve ter uma pessoa associada.' })
  endereco?: EnderecoEmpresaDto;

  @Type(() => ContatoEmpresaDto)
  @ValidateNested()
  @IsNotEmpty({ message: 'A filial deve ter uma pessoa associada.' })
  contato?: ContatoEmpresaDto;
}
