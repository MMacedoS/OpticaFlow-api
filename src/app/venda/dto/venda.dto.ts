import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateVendaDto {
  @IsString({ message: 'O empresaId deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O empresaId e obrigatorio.' })
  empresaId!: string;

  @IsString({ message: 'O filialId deve ser um texto valido.' })
  @IsNotEmpty({ message: 'O filialId e obrigatorio.' })
  filialId!: string;

  @IsOptional()
  @IsString({ message: 'O clienteId deve ser um texto valido.' })
  clienteId?: string;

  @IsOptional()
  @IsString({ message: 'O atendimentoId deve ser um texto valido.' })
  atendimentoId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A dataVenda deve ser uma data valida.' })
  dataVenda?: string;

  @IsOptional()
  @IsString({ message: 'O status deve ser um texto valido.' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'As observacoes devem ser um texto valido.' })
  observacoes?: string;
}

export class UpdateVendaDto {
  @IsOptional()
  @IsString({ message: 'O clienteId deve ser um texto valido.' })
  clienteId?: string;

  @IsOptional()
  @IsString({ message: 'O atendimentoId deve ser um texto valido.' })
  atendimentoId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'A dataVenda deve ser uma data valida.' })
  dataVenda?: string;

  @IsOptional()
  @IsString({ message: 'O status deve ser um texto valido.' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'As observacoes devem ser um texto valido.' })
  observacoes?: string;
}
