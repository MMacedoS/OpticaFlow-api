import { ForbiddenException } from '@nestjs/common';
import { EscopoUsuario } from './escopo.interface';

/**
 * Prontuarios e receitas sao registros clinicos: so o optometrista ou
 * oftalmologista pode criar ou alterar. A equipe da filial apenas consulta.
 * O filtro por profissionalId do escopo garante que seja o profissional do
 * proprio atendimento.
 */
export function exigirProfissional(escopo: EscopoUsuario): void {
  if (!escopo.profissionalId) {
    throw new ForbiddenException(
      'Somente o profissional de saúde do atendimento pode alterar o prontuário e as receitas.',
    );
  }
}
