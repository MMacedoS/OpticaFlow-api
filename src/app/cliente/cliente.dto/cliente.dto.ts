import { Status } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PessoaDto } from 'src/app/filial/dto/filial.dto';

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
}

export class updateClienteDto {
  @IsOptional()
  @IsString({ message: 'O id do convênio deve ser uma string válida.' })
  id!: string;

  @IsOptional()
  @IsString({ message: 'O id do convênio deve ser uma string válida.' })
  convenioId?: string;

  @Type(() => PessoaDto)
  @ValidateNested()
  @IsNotEmpty({ message: 'A filial deve ter uma pessoa associada.' })
  pessoa!: PessoaDto;

  @IsOptional()
  pessoaId!: string;

  @IsOptional()
  status?: Status;
}
