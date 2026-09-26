import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsCnpj } from 'src/common/decorators/is-cnpj.decorator';

const somenteDigitos = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/\D/g, '') || null : value;

class FornecedorCamposOpcionaisDto {
  @IsOptional()
  @IsString({ message: 'O nome fantasia deve ser um texto válido.' })
  nome_fantasia?: string | null;

  @IsOptional()
  @Transform(somenteDigitos)
  @IsCnpj({ message: 'O CNPJ informado não é válido.' })
  cnpj?: string | null;

  @IsOptional()
  @IsEmail({}, { message: 'O e-mail deve ser um endereço válido.' })
  email?: string | null;

  @IsOptional()
  @IsString({ message: 'O telefone deve ser um texto válido.' })
  telefone?: string | null;

  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto válido.' })
  @MaxLength(1000, {
    message: 'As observações devem ter no máximo 1000 caracteres.',
  })
  observacoes?: string | null;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'O campo ativo deve ser um booleano.' })
  ativo?: boolean;
}

export class CreateFornecedorDto extends FornecedorCamposOpcionaisDto {
  @IsOptional()
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  empresaId?: string;

  @IsString({ message: 'A razão social deve ser um texto válido.' })
  @IsNotEmpty({ message: 'A razão social é obrigatória.' })
  @MinLength(2, { message: 'A razão social deve ter no mínimo 2 caracteres.' })
  razao_social!: string;
}

export class UpdateFornecedorDto extends FornecedorCamposOpcionaisDto {
  @IsOptional()
  @IsString({ message: 'A razão social deve ser um texto válido.' })
  @MinLength(2, { message: 'A razão social deve ter no mínimo 2 caracteres.' })
  razao_social?: string;
}
