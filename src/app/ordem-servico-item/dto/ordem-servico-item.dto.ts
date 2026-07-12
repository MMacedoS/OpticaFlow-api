import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrdemServicoItemDto {
  @IsString({ message: 'O ordemServicoId deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O ordemServicoId e obrigatorio.' })
  ordemServicoId!: string;

  @IsOptional()
  @IsString({ message: 'O produtoId deve ser um texto valido.' })
  produtoId?: string;

  @IsOptional()
  @IsString({ message: 'A descricao_servico deve ser um texto valido.' })
  descricao_servico?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um numero valido.' })
  @Min(0.000001, { message: 'A quantidade deve ser maior que zero.' })
  quantidade!: number;

  @Type(() => Number)
  @IsNumber({}, { message: 'O valor_unitario deve ser um numero valido.' })
  @Min(0, { message: 'O valor_unitario nao pode ser negativo.' })
  valor_unitario!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O desconto deve ser um numero valido.' })
  @Min(0, { message: 'O desconto nao pode ser negativo.' })
  desconto?: number;
}

export class UpdateOrdemServicoItemDto {
  @IsOptional()
  @IsString({ message: 'A descricao_servico deve ser um texto valido.' })
  descricao_servico?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um numero valido.' })
  @Min(0.000001, { message: 'A quantidade deve ser maior que zero.' })
  quantidade?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O valor_unitario deve ser um numero valido.' })
  @Min(0, { message: 'O valor_unitario nao pode ser negativo.' })
  valor_unitario?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'O desconto deve ser um numero valido.' })
  @Min(0, { message: 'O desconto nao pode ser negativo.' })
  desconto?: number;
}
