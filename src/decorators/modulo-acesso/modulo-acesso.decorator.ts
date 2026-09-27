import { SetMetadata } from '@nestjs/common';

export const MODULO_ACESSO = 'moduloAcesso';

/**
 * Faz o AcessoGuard checar a permissao de listar de outro modulo em vez do
 * primeiro segmento da rota (ex.: relatorio de vendas exige venda:listar).
 */
export const ModuloAcesso = (modulo: string) =>
  SetMetadata(MODULO_ACESSO, modulo);
