/** Rotas de escrita que nao geram auditoria (renovacao de token e a propria auditoria). */
const ROTAS_IGNORADAS = new Set(['/auth/refresh']);
const MODULOS_IGNORADOS = new Set(['auditoria']);

const ACAO_POR_METODO: Record<string, string> = {
  POST: 'criar',
  PUT: 'atualizar',
  PATCH: 'atualizar',
  DELETE: 'deletar',
};

const CAMPO_SENSIVEL = /senha|password|token|secret/i;
const PROFUNDIDADE_MAXIMA = 6;
const ITENS_MAXIMOS = 50;
const TEXTO_MAXIMO = 1000;

/**
 * Entidade = primeiro segmento da rota; acao = segmentos fixos apos ela
 * (ex.: /venda/:id/finalizar -> finalizar) ou o verbo HTTP.
 */
export function descreverRequisicao(
  metodo: string,
  rota?: string,
): { entidade: string; acao: string } | null {
  if (!rota || ROTAS_IGNORADAS.has(rota)) return null;

  const [entidade, ...resto] = rota.split('/').filter(Boolean);
  if (!entidade || MODULOS_IGNORADOS.has(entidade)) return null;

  const fixos = resto.filter((segmento) => !segmento.startsWith(':'));
  const acao = fixos.length ? fixos.join('-') : ACAO_POR_METODO[metodo];

  return acao ? { entidade, acao } : null;
}

/** Copia do corpo sem senhas/tokens e com tamanho limitado. */
export function sanitizarDados(valor: unknown, profundidade = 0): unknown {
  if (valor === null || valor === undefined) return null;
  if (profundidade > PROFUNDIDADE_MAXIMA) return '[...]';

  if (typeof valor === 'string') {
    return valor.length > TEXTO_MAXIMO
      ? `${valor.slice(0, TEXTO_MAXIMO)}...`
      : valor;
  }

  if (valor instanceof Date) return valor.toISOString();

  if (Array.isArray(valor)) {
    return valor
      .slice(0, ITENS_MAXIMOS)
      .map((item) => sanitizarDados(item, profundidade + 1));
  }

  if (typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([chave, item]) => [
        chave,
        CAMPO_SENSIVEL.test(chave)
          ? '[oculto]'
          : sanitizarDados(item, profundidade + 1),
      ]),
    );
  }

  return valor;
}
