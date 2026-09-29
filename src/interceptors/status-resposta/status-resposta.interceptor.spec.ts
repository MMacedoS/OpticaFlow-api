import { CallHandler, ExecutionContext, HttpException } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { StatusRespostaInterceptor } from './status-resposta.interceptor';

describe('StatusRespostaInterceptor', () => {
  const interceptor = new StatusRespostaInterceptor();
  const executar = (resposta: unknown) =>
    lastValueFrom(
      interceptor.intercept(
        {} as ExecutionContext,
        {
          handle: () => of(resposta),
        } as CallHandler,
      ),
    );

  it('mantem respostas de sucesso', async () => {
    const resposta = { status: 201, message: 'Criado.' };
    await expect(executar(resposta)).resolves.toBe(resposta);
  });

  it('mantem respostas sem status no corpo', async () => {
    await expect(executar([1, 2])).resolves.toEqual([1, 2]);
  });

  it('transforma status de erro do corpo em erro HTTP', async () => {
    const erro = await executar({ status: 422, message: 'Inválido.' }).catch(
      (e: HttpException) => e,
    );

    expect(erro).toBeInstanceOf(HttpException);
    expect((erro as HttpException).getStatus()).toBe(422);
    expect((erro as HttpException).getResponse()).toEqual({
      status: 422,
      message: 'Inválido.',
    });
  });

  it('401 no corpo vira 403 para nao encerrar a sessao', async () => {
    const erro = (await executar({
      status: 401,
      message: 'Usuário sem filial.',
    }).catch((e: HttpException) => e)) as HttpException;

    expect(erro.getStatus()).toBe(403);
  });
});
