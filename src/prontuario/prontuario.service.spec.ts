import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ProntuarioService } from './prontuario.service';

describe('ProntuarioService', () => {
  let service: ProntuarioService;

  const prismaMock = {
    prontuario: {
      findUnique: jest.fn(),
    },
    prontuarioAnamnese: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    prontuarioAcuidadeVisual: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProntuarioService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ProntuarioService>(ProntuarioService);
  });

  it('deve retornar 422 quando o prontuario nao existir ao criar anamnese', async () => {
    prismaMock.prontuario.findUnique.mockResolvedValue(null);

    const response = await service.createAnamnese('prontuario-inexistente', {
      historico_pessoal: 'Teste',
    });

    expect(response).toEqual({
      status: 422,
      message: 'Prontuário não encontrado.',
    });
    expect(prismaMock.prontuario.findUnique).toHaveBeenCalledWith({
      where: { id: 'prontuario-inexistente' },
      select: { id: true },
    });
    expect(prismaMock.prontuarioAnamnese.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.prontuarioAnamnese.create).not.toHaveBeenCalled();
  });

  it('deve retornar 422 quando ja existir anamnese para o prontuario', async () => {
    prismaMock.prontuario.findUnique.mockResolvedValue({ id: 'prontuario-1' });
    prismaMock.prontuarioAnamnese.findUnique.mockResolvedValue({
      id: 'anamnese-1',
    });

    const response = await service.createAnamnese('prontuario-1', {
      historico_pessoal: 'Teste',
    });

    expect(response).toEqual({
      status: 422,
      message: 'Anamnese já cadastrada para o prontuário informado.',
    });
    expect(prismaMock.prontuarioAnamnese.findUnique).toHaveBeenCalledWith({
      where: { prontuarioId: 'prontuario-1' },
      select: { id: true },
    });
    expect(prismaMock.prontuarioAnamnese.create).not.toHaveBeenCalled();
  });

  it('deve retornar 422 quando o prontuario nao existir ao criar acuidade visual', async () => {
    prismaMock.prontuario.findUnique.mockResolvedValue(null);

    const response = await service.createAcuidadeVisual(
      'prontuario-inexistente',
      {
        od_sem_correcao: '20/20',
      },
    );

    expect(response).toEqual({
      status: 422,
      message: 'Prontuário não encontrado.',
    });
    expect(prismaMock.prontuario.findUnique).toHaveBeenCalledWith({
      where: { id: 'prontuario-inexistente' },
      select: { id: true },
    });
    expect(
      prismaMock.prontuarioAcuidadeVisual.findUnique,
    ).not.toHaveBeenCalled();
    expect(prismaMock.prontuarioAcuidadeVisual.create).not.toHaveBeenCalled();
  });

  it('deve retornar 422 quando ja existir acuidade visual para o prontuario', async () => {
    prismaMock.prontuario.findUnique.mockResolvedValue({ id: 'prontuario-1' });
    prismaMock.prontuarioAcuidadeVisual.findUnique.mockResolvedValue({
      id: 'acuidade-1',
    });

    const response = await service.createAcuidadeVisual('prontuario-1', {
      od_sem_correcao: '20/20',
    });

    expect(response).toEqual({
      status: 422,
      message: 'Acuidade visual já cadastrada para o prontuário informado.',
    });
    expect(prismaMock.prontuarioAcuidadeVisual.findUnique).toHaveBeenCalledWith(
      {
        where: { prontuarioId: 'prontuario-1' },
        select: { id: true },
      },
    );
    expect(prismaMock.prontuarioAcuidadeVisual.create).not.toHaveBeenCalled();
  });
});
