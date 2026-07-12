import { Status } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  Length,
  MinLength,
  IsOptional,
  IsEmail,
} from 'class-validator';

export class CreateUsuarioDto {
  @IsString({ message: 'O email deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O email é obrigatório.' })
  @IsEmail({}, { message: 'O email deve ser um endereço de email válido.' })
  email!: string;

  @IsString({ message: 'A senha deve ser um texto válido.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @Length(6, 20, { message: 'A senha deve ter entre 6 e 20 caracteres.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  senha!: string;

  @IsString({ message: 'O nome de usuário deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O nome de usuário é obrigatório.' })
  @Length(3, 30, {
    message: 'O nome de usuário deve ter entre 3 e 30 caracteres.',
  })
  @MinLength(3, {
    message: 'O nome de usuário deve ter no mínimo 3 caracteres.',
  })
  username!: string;

  @IsOptional()
  status?: Status;

  @IsOptional()
  @IsString({ message: 'O id da pessoa deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O id da pessoa não pode ser vazio.' })
  pessoaId?: string;
}
