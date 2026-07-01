import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class CreateFornecedorDto {
  @IsString({ message: 'O nome deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O nome é obrigatório.' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres.' })
  nome!: string;

  @IsOptional()
  @IsString({ message: 'O CPF deve ser um texto válido.' })
  cpf?: string;

  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId é obrigatório.' })
  filialId!: string;

  @IsString({ message: 'O email deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O email é obrigatório.' })
  @IsEmail({}, { message: 'O email deve ser um endereço válido.' })
  email!: string;

  @IsString({ message: 'A senha deve ser um texto válido.' })
  @IsNotEmpty({ message: 'A senha é obrigatória.' })
  @Length(6, 20, { message: 'A senha deve ter entre 6 e 20 caracteres.' })
  senha!: string;

  @IsOptional()
  @IsString({ message: 'O username deve ser um texto válido.' })
  @MinLength(3, { message: 'O username deve ter no mínimo 3 caracteres.' })
  username?: string;
}

export class UpdateFornecedorDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto válido.' })
  @MinLength(3, { message: 'O nome deve ter no mínimo 3 caracteres.' })
  nome?: string;

  @IsOptional()
  @IsString({ message: 'O CPF deve ser um texto válido.' })
  cpf?: string;

  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId não pode ser vazio.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O email deve ser um texto válido.' })
  @IsEmail({}, { message: 'O email deve ser um endereço válido.' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'A senha deve ser um texto válido.' })
  @Length(6, 20, { message: 'A senha deve ter entre 6 e 20 caracteres.' })
  senha?: string;

  @IsOptional()
  @IsString({ message: 'O username deve ser um texto válido.' })
  @MinLength(3, { message: 'O username deve ter no mínimo 3 caracteres.' })
  username?: string;
}
