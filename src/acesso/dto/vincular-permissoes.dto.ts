import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class VincularPermissoesDto {
  @IsArray({ message: 'As permissões devem ser um array de ids.' })
  @ArrayNotEmpty({ message: 'Informe ao menos uma permissão.' })
  @IsString({ each: true, message: 'Cada id de permissão deve ser string.' })
  permissaoIds!: string[];
}
