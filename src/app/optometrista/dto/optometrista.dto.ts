import { Status } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PessoaDto } from 'src/app/filial/dto/filial.dto';

export class CreateDto {
  @IsOptional()
  @IsString({ message: 'O id do convênio deve ser uma string válida.' })
  registro_profissional!: string;

  @Type(() => PessoaDto)
  @ValidateNested()
  @IsNotEmpty({ message: 'deve ter uma pessoa associada.' })
  pessoa!: PessoaDto;

  @IsOptional()
  status?: Status;
}

export class UpdateDto {
  @IsOptional()
  @IsString({ message: 'O id do convênio deve ser uma string válida.' })
  id!: string;

  @IsOptional()
  @IsString({ message: 'O id do convênio deve ser uma string válida.' })
  registro_profissional!: string;

  @Type(() => PessoaDto)
  @ValidateNested()
  @IsNotEmpty({ message: 'deve ter uma pessoa associada.' })
  pessoa!: PessoaDto;

  @IsOptional()
  status?: Status;
}
