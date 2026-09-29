const DATA_PURA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Inicio do periodo. Datas sem hora (AAAA-MM-DD) valem a partir de 00:00 do
 * dia no fuso do servidor (TZ); `new Date('AAAA-MM-DD')` seria meia-noite UTC.
 */
export function inicioDoPeriodo(valor: string): Date {
  return DATA_PURA.test(valor)
    ? new Date(`${valor}T00:00:00`)
    : new Date(valor);
}

/** Fim do periodo. Datas sem hora incluem o dia inteiro (ate 23:59:59.999). */
export function fimDoPeriodo(valor: string): Date {
  return DATA_PURA.test(valor)
    ? new Date(`${valor}T23:59:59.999`)
    : new Date(valor);
}
