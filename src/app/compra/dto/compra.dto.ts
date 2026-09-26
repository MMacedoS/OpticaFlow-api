import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CompraItemDto {
  @IsString({ message: 'O produtoId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'Informe o produto do item.' })
  produtoId!: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'A quantidade deve ser um número válido.' })
  @Min(0.001, { message: 'A quantidade deve ser maior que zero.' })
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

class CompraDadosDto {
  @IsOptional()
  @IsString({ message: 'O fornecedorId deve ser um texto válido.' })
  fornecedorId?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'A data da compra deve ser uma data válida.' })
  dataCompra?: string;

  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto válido.' })
  @MaxLength(1000, {
    message: 'As observações devem ter no máximo 1000 caracteres.',
  })
  observacoes?: string | null;
}

export class CreateCompraDto extends CompraDadosDto {
  /** Filial da compra; se omitida, usa a filial do usuario. */
  @IsOptional()
  @IsString({ message: 'O filialId deve ser um texto válido.' })
  filialId?: string;

  @IsArray({ message: 'Os itens devem ser uma lista.' })
  @ArrayMinSize(1, { message: 'Inclua pelo menos um item na compra.' })
  @ValidateNested({ each: true })
  @Type(() => CompraItemDto)
  itens!: CompraItemDto[];
}

/** So compras em rascunho podem ser editadas; itens enviados substituem os atuais. */
export class UpdateCompraDto extends CompraDadosDto {
  @IsOptional()
  @IsArray({ message: 'Os itens devem ser uma lista.' })
  @ArrayMinSize(1, { message: 'Inclua pelo menos um item na compra.' })
  @ValidateNested({ each: true })
  @Type(() => CompraItemDto)
  itens?: CompraItemDto[];
}

export class ReceberCompraDto {
  /** Vencimento da despesa gerada no financeiro. */
  @IsOptional()
  @IsDateString({}, { message: 'O vencimento deve ser uma data válida.' })
  vencimento?: string;
}
