import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateVendaItemDto {
  @IsString({ message: 'O vendaId deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O vendaId e obrigatorio.' })
  vendaId!: string;

  @IsString({ message: 'O produtoId deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O produtoId e obrigatorio.' })
  produtoId!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um numero valido.' })
  @Min(0.000001, { message: 'A quantidade deve ser maior que zero.' })
  quantidade!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'O valor unitario deve ser um numero valido.' })
  @Min(0, { message: 'O valor unitario nao pode ser negativo.' })
  valor_unitario!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O desconto deve ser um numero valido.' })
  @Min(0, { message: 'O desconto nao pode ser negativo.' })
  desconto?: number;
}

export class UpdateVendaItemDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um numero valido.' })
  @Min(0.000001, { message: 'A quantidade deve ser maior que zero.' })
  quantidade?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O valor unitario deve ser um numero valido.' })
  @Min(0, { message: 'O valor unitario nao pode ser negativo.' })
  valor_unitario?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O desconto deve ser um numero valido.' })
  @Min(0, { message: 'O desconto nao pode ser negativo.' })
  desconto?: number;
}
