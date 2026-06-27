import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAcessoDto {
  @IsOptional()
  @IsString({ message: 'O id da empresa deve ser uma string válida.' })
  @IsNotEmpty({ message: 'O id da empresa não pode ser vazio.' })
  empresaId?: string;

  @IsString({ message: 'O nome do acesso deve ser uma string válida.' })
  @IsNotEmpty({ message: 'O nome do acesso é obrigatório.' })
  @MinLength(3, { message: 'O nome do acesso deve ter ao menos 3 caracteres.' })
  nome!: string;

  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string válida.' })
  descricao?: string;

  @IsOptional()
  @IsArray({ message: 'As permissões devem ser um array de ids.' })
  @ArrayNotEmpty({ message: 'Informe ao menos uma permissão.' })
  @IsString({ each: true, message: 'Cada id de permissão deve ser string.' })
  permissaoIds?: string[];
}
