import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateArquivoDto {
  @IsString({ message: 'O empresaId deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O empresaId e obrigatorio.' })
  empresaId!: string;

  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto valido.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O pessoaId deve ser um texto valido.' })
  pessoaId?: string;

  @IsOptional()
  @IsString({ message: 'O atendimentoId deve ser um texto valido.' })
  atendimentoId?: string;

  @IsOptional()
  @IsString({ message: 'O prontuarioId deve ser um texto valido.' })
  prontuarioId?: string;

  @IsOptional()
  @IsString({ message: 'O enviadoPorId deve ser um texto valido.' })
  enviadoPorId?: string;

  @IsString({ message: 'O nome deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O nome e obrigatorio.' })
  @MinLength(2, { message: 'O nome deve ter no minimo 2 caracteres.' })
  nome!: string;

  @IsString({ message: 'O path deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O path e obrigatorio.' })
  path!: string;

  @IsOptional()
  @IsString({ message: 'O mime_type deve ser um texto valido.' })
  mime_type?: string;

  @IsOptional()
  @IsNumber({}, { message: 'O tamanho deve ser numerico.' })
  @Min(0, { message: 'O tamanho nao pode ser negativo.' })
  tamanho?: number;
}

export class UpdateArquivoDto {
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto valido.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O pessoaId deve ser um texto valido.' })
  pessoaId?: string;

  @IsOptional()
  @IsString({ message: 'O atendimentoId deve ser um texto valido.' })
  atendimentoId?: string;

  @IsOptional()
  @IsString({ message: 'O prontuarioId deve ser um texto valido.' })
  prontuarioId?: string;

  @IsOptional()
  @IsString({ message: 'O enviadoPorId deve ser um texto valido.' })
  enviadoPorId?: string;

  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto valido.' })
  @MinLength(2, { message: 'O nome deve ter no minimo 2 caracteres.' })
  nome?: string;

  @IsOptional()
  @IsString({ message: 'O path deve ser um texto valido.' })
  path?: string;

  @IsOptional()
  @IsString({ message: 'O mime_type deve ser um texto valido.' })
  mime_type?: string;

  @IsOptional()
  @IsNumber({}, { message: 'O tamanho deve ser numerico.' })
  @Min(0, { message: 'O tamanho nao pode ser negativo.' })
  tamanho?: number;
}
