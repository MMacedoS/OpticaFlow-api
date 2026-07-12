import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePermissaoDto {
  @IsOptional()
  @IsString({ message: 'O id da empresa deve ser uma string válida.' })
  @IsNotEmpty({ message: 'O id da empresa não pode ser vazio.' })
  empresaId?: string;

  @IsString({ message: 'O módulo deve ser uma string válida.' })
  @IsNotEmpty({ message: 'O módulo é obrigatório.' })
  @MinLength(2, { message: 'O módulo deve ter ao menos 2 caracteres.' })
  modulo!: string;

  @IsString({ message: 'A ação deve ser uma string válida.' })
  @IsNotEmpty({ message: 'A ação é obrigatória.' })
  @MinLength(2, { message: 'A ação deve ter ao menos 2 caracteres.' })
  acao!: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string válida.' })
  descricao?: string;
}
