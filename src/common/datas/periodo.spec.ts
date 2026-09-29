import { fimDoPeriodo, inicioDoPeriodo } from './periodo';

describe('periodo', () => {
  it('data sem hora comeca a meia-noite local', () => {
    const inicio = inicioDoPeriodo('2026-09-28');
    expect([inicio.getDate(), inicio.getHours(), inicio.getMinutes()]).toEqual([
      28, 0, 0,
    ]);
  });

  it('data sem hora termina no fim do dia local', () => {
    const fim = fimDoPeriodo('2026-09-30');
    expect([fim.getDate(), fim.getHours(), fim.getMinutes()]).toEqual([
      30, 23, 59,
    ]);
  });

  it('data com hora e usada como veio', () => {
    const valor = '2026-09-29T12:00:00.000Z';
    expect(inicioDoPeriodo(valor).toISOString()).toBe(valor);
    expect(fimDoPeriodo(valor).toISOString()).toBe(valor);
  });
});
