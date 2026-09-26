import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEstoqueDto {
  /** Filial do estoque; se omitida, usa a filial do usuario. */
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto válido.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto válido.' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres.' })
  nome?: string | null;
}

export class UpdateEstoqueDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto válido.' })
  @MaxLength(100, { message: 'O nome deve ter no máximo 100 caracteres.' })
  nome?: string | null;
}
