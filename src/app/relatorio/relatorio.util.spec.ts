import { BadRequestException } from '@nestjs/common';
import {
  agrupar,
  diaIso,
  escopoWhere,
  porDia,
  resolverPeriodo,
} from './relatorio.util';

describe('resolverPeriodo', () => {
  it('usa o periodo informado com fim inclusivo', () => {
    const periodo = resolverPeriodo('2026-03-01', '2026-03-31');
    expect(diaIso(periodo.inicio)).toBe('2026-03-01');
    expect(diaIso(periodo.fim)).toBe('2026-04-01');
  });

  it('sem datas, usa o mes atual', () => {
    const hoje = new Date();
    const periodo = resolverPeriodo();
    expect(periodo.inicio.getDate()).toBe(1);
    expect(periodo.inicio.getMonth()).toBe(hoje.getMonth());
    expect(periodo.fim.getDate()).toBe(1);
  });

  it('recusa datas invalidas ou invertidas', () => {
    expect(() => resolverPeriodo('2026-13-01')).toThrow(BadRequestException);
    expect(() => resolverPeriodo('2026-02-30')).toThrow(BadRequestException);
    expect(() => resolverPeriodo('01/02/2026')).toThrow(BadRequestException);
    expect(() => resolverPeriodo('2026-05-10', '2026-05-01')).toThrow(
      BadRequestException,
    );
  });
});

describe('escopoWhere', () => {
  it('filial do usuario prevalece sobre a informada', () => {
    expect(
      escopoWhere({ superadmin: false, empresaId: 'e1', filialId: 'f1' }, 'f2'),
    ).toEqual({ empresaId: 'e1', filialId: 'f1' });
  });

  it('usuario sem filial pode filtrar uma filial da empresa', () => {
    expect(escopoWhere({ superadmin: false, empresaId: 'e1' }, 'f2')).toEqual({
      empresaId: 'e1',
      filialId: 'f2',
    });
  });

  it('superadmin sem filtro ve tudo', () => {
    expect(escopoWhere({ superadmin: true })).toEqual({});
  });
});

describe('agrupar e porDia', () => {
  const itens = [
    { nome: 'A', valor: 10 },
    { nome: 'B', valor: 30 },
    { nome: 'A', valor: 5 },
    { nome: null, valor: 1 },
  ];

  it('soma por chave, ordena e aplica rotulos e limite', () => {
    const grupo = agrupar(
      'T',
      itens,
      (i) => i.nome,
      (i) => i.valor,
      {
        formato: 'moeda',
        limite: 2,
        rotulos: { B: 'Bê' },
      },
    );
    expect(grupo.itens).toEqual([
      { label: 'Bê', valor: 30, quantidade: 1 },
      { label: 'A', valor: 15, quantidade: 2 },
    ]);
  });

  it('preenche dias sem movimento', () => {
    const periodo = resolverPeriodo('2026-03-01', '2026-03-03');
    const grupo = porDia('Dia', periodo, [new Date(2026, 2, 2, 15)], (d) => d);
    expect(grupo.itens).toEqual([
      { label: '2026-03-01', valor: 0 },
      { label: '2026-03-02', valor: 1 },
      { label: '2026-03-03', valor: 0 },
    ]);
  });

  it('agrupa por mes em periodos longos', () => {
    const periodo = resolverPeriodo('2026-01-01', '2026-12-31');
    const grupo = porDia(
      'Vendas por dia',
      periodo,
      [new Date(2026, 4, 20)],
      (d) => d,
    );
    expect(grupo.titulo).toBe('Vendas por mês');
    expect(grupo.itens).toHaveLength(12);
    expect(grupo.itens[4]).toEqual({ label: '2026-05', valor: 1 });
  });
});
