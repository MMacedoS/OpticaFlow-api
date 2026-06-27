import { IsNotEmpty, IsString } from 'class-validator';

export class AtribuirAcessoUsuarioDto {
  @IsString({ message: 'O id do usuário deve ser uma string válida.' })
  @IsNotEmpty({ message: 'O id do usuário é obrigatório.' })
  usuarioId!: string;

  @IsString({ message: 'O id do acesso deve ser uma string válida.' })
  @IsNotEmpty({ message: 'O id do acesso é obrigatório.' })
  acessoId!: string;
}
