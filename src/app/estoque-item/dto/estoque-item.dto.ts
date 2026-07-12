import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateEstoqueItemDto {
  @IsString({ message: 'O estoqueId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O estoqueId é obrigatório.' })
  estoqueId!: string;

  @IsString({ message: 'O produtoId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O produtoId é obrigatório.' })
  produtoId!: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um número válido.' })
  @Min(0, { message: 'A quantidade não pode ser negativa.' })
  quantidade?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O mínimo deve ser um número válido.' })
  @Min(0, { message: 'O mínimo não pode ser negativo.' })
  minimo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O máximo deve ser um número válido.' })
  @Min(0, { message: 'O máximo não pode ser negativo.' })
  maximo?: number;
}

export class UpdateEstoqueItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um número válido.' })
  @Min(0, { message: 'A quantidade não pode ser negativa.' })
  quantidade?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O mínimo deve ser um número válido.' })
  @Min(0, { message: 'O mínimo não pode ser negativo.' })
  minimo?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O máximo deve ser um número válido.' })
  @Min(0, { message: 'O máximo não pode ser negativo.' })
  maximo?: number;
}
