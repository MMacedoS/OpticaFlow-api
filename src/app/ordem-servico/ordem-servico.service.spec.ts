import { StatusOrdemServico } from '@prisma/client';
import { EscopoUsuario } from 'src/common/escopo/escopo.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrdemServicoService } from './ordem-servico.service';

describe('OrdemServicoService.update', () => {
  const escopo: EscopoUsuario = { superadmin: false, empresaId: 'empresa-1' };

  const prismaMock = {
    ordemServico: { findFirst: jest.fn(), update: jest.fn() },
  };

  const service = new OrdemServicoService(
    prismaMock as unknown as PrismaService,
  );

  const ordem = {
    id: 'os-1',
    empresaId: 'empresa-1',
    filialId: 'filial-1',
    clienteId: null,
    status: StatusOrdemServico.faturada,
    data_entrega: null,
  };

  const dadosGravados = () =>
    prismaMock.ordemServico.update.mock.calls[0][0].data as {
      data_entrega?: Date | null;
      previsao_entrega?: Date | null;
    };

  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.ordemServico.findFirst.mockResolvedValue(ordem);
    jest
      .spyOn(service, 'findById')
      .mockResolvedValue({ status: 200, message: 'Ordem encontrada.' });
  });

  it('responde com mensagem de atualizacao', async () => {
    const resposta = await service.update('os-1', { descricao: 'x' }, escopo);

    expect(resposta.message).toBe('Ordem de servico atualizada com sucesso.');
  });

  it('ao finalizar sem data de entrega, registra a entrega agora', async () => {
    const antes = Date.now();

    await service.update(
      'os-1',
      { status: StatusOrdemServico.finalizada },
      escopo,
    );

    const dataEntrega = dadosGravados().data_entrega as Date;
    expect(dataEntrega).toBeInstanceOf(Date);
    expect(dataEntrega.getTime()).toBeGreaterThanOrEqual(antes);
  });

  it('ao finalizar, mantem a data de entrega ja registrada', async () => {
    prismaMock.ordemServico.findFirst.mockResolvedValue({
      ...ordem,
      data_entrega: new Date('2026-10-05T20:00:00Z'),
    });

    await service.update(
      'os-1',
      { status: StatusOrdemServico.finalizada },
      escopo,
    );

    expect(dadosGravados().data_entrega).toBeUndefined();
  });

  it('null limpa as datas e undefined mantem', async () => {
    await service.update(
      'os-1',
      { data_entrega: null, previsao_entrega: undefined },
      escopo,
    );

    expect(dadosGravados().data_entrega).toBeNull();
    expect(dadosGravados().previsao_entrega).toBeUndefined();
  });
});
