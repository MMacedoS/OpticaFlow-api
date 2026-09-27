import { descreverRequisicao, sanitizarDados } from './auditoria.util';

describe('descreverRequisicao', () => {
  it('usa o verbo HTTP quando a rota nao tem acao propria', () => {
    expect(descreverRequisicao('POST', '/venda')).toEqual({
      entidade: 'venda',
      acao: 'criar',
    });
    expect(descreverRequisicao('PUT', '/venda/:id')).toEqual({
      entidade: 'venda',
      acao: 'atualizar',
    });
    expect(descreverRequisicao('DELETE', '/venda/:id')).toEqual({
      entidade: 'venda',
      acao: 'deletar',
    });
  });

  it('usa os segmentos fixos da rota como acao', () => {
    expect(descreverRequisicao('POST', '/venda/:id/finalizar')).toEqual({
      entidade: 'venda',
      acao: 'finalizar',
    });
    expect(descreverRequisicao('PUT', '/acesso/usuario/:usuarioId')).toEqual({
      entidade: 'acesso',
      acao: 'usuario',
    });
    expect(descreverRequisicao('POST', '/auth/login')).toEqual({
      entidade: 'auth',
      acao: 'login',
    });
  });

  it('ignora refresh de token, a propria auditoria e rotas desconhecidas', () => {
    expect(descreverRequisicao('POST', '/auth/refresh')).toBeNull();
    expect(descreverRequisicao('POST', '/auditoria')).toBeNull();
    expect(descreverRequisicao('POST', undefined)).toBeNull();
  });
});

describe('sanitizarDados', () => {
  it('oculta senhas e tokens em qualquer nivel', () => {
    expect(
      sanitizarDados({
        email: 'a@b.com',
        senha: '123',
        usuario: { password: 'x', refresh_token: 'y', nome: 'Ana' },
      }),
    ).toEqual({
      email: 'a@b.com',
      senha: '[oculto]',
      usuario: { password: '[oculto]', refresh_token: '[oculto]', nome: 'Ana' },
    });
  });

  it('limita listas e textos longos', () => {
    const lista = sanitizarDados(Array.from({ length: 80 }, (_, i) => i));
    expect(lista).toHaveLength(50);
    expect(String(sanitizarDados('a'.repeat(1500)))).toHaveLength(1003);
  });

  it('converte datas e ausencia de corpo', () => {
    expect(sanitizarDados(new Date('2026-01-02T03:04:05.000Z'))).toBe(
      '2026-01-02T03:04:05.000Z',
    );
    expect(sanitizarDados(undefined)).toBeNull();
  });
});
