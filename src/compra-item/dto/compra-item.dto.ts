import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCompraItemDto {
  @IsString({ message: 'O compraId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O compraId é obrigatório.' })
  compraId!: string;

  @IsString({ message: 'O produtoId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O produtoId é obrigatório.' })
  produtoId!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um número válido.' })
  @Min(0.000001, { message: 'A quantidade deve ser maior que zero.' })
  quantidade!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'O valor unitário deve ser um número válido.' })
  @Min(0, { message: 'O valor unitário não pode ser negativo.' })
  valor_unitario!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O desconto deve ser um número válido.' })
  @Min(0, { message: 'O desconto não pode ser negativo.' })
  desconto?: number;
}

export class UpdateCompraItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um número válido.' })
  @Min(0.000001, { message: 'A quantidade deve ser maior que zero.' })
  quantidade?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O valor unitário deve ser um número válido.' })
  @Min(0, { message: 'O valor unitário não pode ser negativo.' })
  valor_unitario?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O desconto deve ser um número válido.' })
  @Min(0, { message: 'O desconto não pode ser negativo.' })
  desconto?: number;
}
