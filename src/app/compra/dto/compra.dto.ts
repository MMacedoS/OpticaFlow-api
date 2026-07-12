import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCompraDto {
  @IsString({ message: 'O empresaId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O empresaId é obrigatório.' })
  empresaId!: string;

  @IsString({ message: 'O filialId deve ser um texto válido.' })
  @IsNotEmpty({ message: 'O filialId é obrigatório.' })
  filialId!: string;

  @IsOptional()
  @IsString({ message: 'O fornecedorId deve ser um texto válido.' })
  fornecedorId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A dataCompra deve ser uma data válida.' })
  dataCompra?: string;

  @IsOptional()
  @IsString({ message: 'O status deve ser um texto válido.' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto válido.' })
  observacoes?: string;
}

export class UpdateCompraDto {
  @IsOptional()
  @IsString({ message: 'O fornecedorId deve ser um texto válido.' })
  fornecedorId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A dataCompra deve ser uma data válida.' })
  dataCompra?: string;

  @IsOptional()
  @IsString({ message: 'O status deve ser um texto válido.' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'As observações devem ser um texto válido.' })
  observacoes?: string;
}
