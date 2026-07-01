import { IsNotEmpty, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAuditoriaDto {
  @IsString({ message: 'O empresaId deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O empresaId e obrigatorio.' })
  empresaId!: string;

  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto valido.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O usuarioId deve ser um texto valido.' })
  usuarioId?: string;

  @IsOptional()
  @IsString({ message: 'O atendimentoId deve ser um texto valido.' })
  atendimentoId?: string;

  @IsString({ message: 'A entidade deve ser um texto valido.' })
  @IsNotEmpty({ message: 'A entidade e obrigatoria.' })
  @MinLength(2, { message: 'A entidade deve ter no minimo 2 caracteres.' })
  entidade!: string;

  @IsOptional()
  @IsString({ message: 'O entidadeId deve ser um texto valido.' })
  entidadeId?: string;

  @IsString({ message: 'A acao deve ser um texto valido.' })
  @IsNotEmpty({ message: 'A acao e obrigatoria.' })
  @MinLength(2, { message: 'A acao deve ter no minimo 2 caracteres.' })
  acao!: string;

  @IsOptional()
  @IsObject({ message: 'O dados_antes deve ser um objeto JSON valido.' })
  dados_antes?: Record<string, unknown>;

  @IsOptional()
  @IsObject({ message: 'O dados_depois deve ser um objeto JSON valido.' })
  dados_depois?: Record<string, unknown>;

  @IsOptional()
  @IsString({ message: 'O ip deve ser um texto valido.' })
  ip?: string;

  @IsOptional()
  @IsString({ message: 'O user_agent deve ser um texto valido.' })
  user_agent?: string;
}

export class UpdateAuditoriaDto {
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto valido.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O usuarioId deve ser um texto valido.' })
  usuarioId?: string;

  @IsOptional()
  @IsString({ message: 'O atendimentoId deve ser um texto valido.' })
  atendimentoId?: string;

  @IsOptional()
  @IsString({ message: 'A entidade deve ser um texto valido.' })
  @MinLength(2, { message: 'A entidade deve ter no minimo 2 caracteres.' })
  entidade?: string;

  @IsOptional()
  @IsString({ message: 'O entidadeId deve ser um texto valido.' })
  entidadeId?: string;

  @IsOptional()
  @IsString({ message: 'A acao deve ser um texto valido.' })
  @MinLength(2, { message: 'A acao deve ter no minimo 2 caracteres.' })
  acao?: string;

  @IsOptional()
  @IsObject({ message: 'O dados_antes deve ser um objeto JSON valido.' })
  dados_antes?: Record<string, unknown>;

  @IsOptional()
  @IsObject({ message: 'O dados_depois deve ser um objeto JSON valido.' })
  dados_depois?: Record<string, unknown>;

  @IsOptional()
  @IsString({ message: 'O ip deve ser um texto valido.' })
  ip?: string;

  @IsOptional()
  @IsString({ message: 'O user_agent deve ser um texto valido.' })
  user_agent?: string;
}