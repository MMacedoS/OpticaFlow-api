import { CanalNotificacao } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateNotificacaoDto {
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
  @IsString({ message: 'O usuarioDestinoId deve ser um texto valido.' })
  usuarioDestinoId?: string;

  @IsOptional()
  @IsString({ message: 'O usuarioRemetenteId deve ser um texto valido.' })
  usuarioRemetenteId?: string;

  @IsOptional()
  @IsEnum(CanalNotificacao, {
    message: 'O canal deve ser um valor valido de CanalNotificacao.',
  })
  canal?: CanalNotificacao;

  @IsString({ message: 'O titulo deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O titulo e obrigatorio.' })
  @MinLength(2, { message: 'O titulo deve ter no minimo 2 caracteres.' })
  titulo!: string;

  @IsString({ message: 'A mensagem deve ser um texto valido.' })
  @IsNotEmpty({ message: 'A mensagem e obrigatoria.' })
  @MinLength(2, { message: 'A mensagem deve ter no minimo 2 caracteres.' })
  mensagem!: string;
}

export class UpdateNotificacaoDto {
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto valido.' })
  filialId?: string;

  @IsOptional()
  @IsString({ message: 'O pessoaId deve ser um texto valido.' })
  pessoaId?: string;

  @IsOptional()
  @IsString({ message: 'O usuarioDestinoId deve ser um texto valido.' })
  usuarioDestinoId?: string;

  @IsOptional()
  @IsString({ message: 'O usuarioRemetenteId deve ser um texto valido.' })
  usuarioRemetenteId?: string;

  @IsOptional()
  @IsEnum(CanalNotificacao, {
    message: 'O canal deve ser um valor valido de CanalNotificacao.',
  })
  canal?: CanalNotificacao;

  @IsOptional()
  @IsString({ message: 'O titulo deve ser um texto valido.' })
  @MinLength(2, { message: 'O titulo deve ter no minimo 2 caracteres.' })
  titulo?: string;

  @IsOptional()
  @IsString({ message: 'A mensagem deve ser um texto valido.' })
  @MinLength(2, { message: 'A mensagem deve ter no minimo 2 caracteres.' })
  mensagem?: string;

  @IsOptional()
  @IsBoolean({ message: 'O campo lida deve ser verdadeiro ou falso.' })
  lida?: boolean;
}
