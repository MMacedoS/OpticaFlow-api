import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class PermissaoSelecionadaDto {
  @IsString({ message: 'O módulo deve ser um texto válido.' })
  @IsNotEmpty({ message: 'Informe o módulo.' })
  modulo!: string;

  @IsString({ message: 'A ação deve ser um texto válido.' })
  @IsNotEmpty({ message: 'Informe a ação.' })
  acao!: string;
}

class PerfilDadosDto {
  @IsOptional()
  @IsString({ message: 'A descrição deve ser um texto válido.' })
  @MaxLength(255, { message: 'A descrição deve ter no máximo 255 caracteres.' })
  descricao?: string | null;
}

export class CreateAcessoDto extends PerfilDadosDto {
  @IsString({ message: 'O nome deve ser um texto válido.' })
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  @MaxLength(60, { message: 'O nome deve ter no máximo 60 caracteres.' })
  nome!: string;

  /** Apenas superadmin: empresa do perfil (sem ela, cria perfil do sistema). */
  @IsOptional()
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  empresaId?: string;

  @IsArray({ message: 'As permissões devem ser uma lista.' })
  @ValidateNested({ each: true })
  @Type(() => PermissaoSelecionadaDto)
  permissoes!: PermissaoSelecionadaDto[];
}

export class UpdateAcessoDto extends PerfilDadosDto {
  @IsOptional()
  @IsString({ message: 'O nome deve ser um texto válido.' })
  @MinLength(2, { message: 'O nome deve ter no mínimo 2 caracteres.' })
  @MaxLength(60, { message: 'O nome deve ter no máximo 60 caracteres.' })
  nome?: string;

  @IsOptional()
  @IsArray({ message: 'As permissões devem ser uma lista.' })
  @ValidateNested({ each: true })
  @Type(() => PermissaoSelecionadaDto)
  permissoes?: PermissaoSelecionadaDto[];
}

export class DefinirAcessosUsuarioDto {
  @IsArray({ message: 'Os perfis devem ser uma lista.' })
  @ArrayUnique({ message: 'Há perfis repetidos.' })
  @IsString({ each: true, message: 'Cada perfil deve ser um id válido.' })
  acessoIds!: string[];
}
