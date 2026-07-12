import { Test, TestingModule } from '@nestjs/testing';
import { TipoReceita } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReceitaService } from './receita.service';

describe('ReceitaService', () => {
  let service: ReceitaService;

  const prismaMock = {
    filial: {
      findUnique: jest.fn(),
    },
    pessoa: {
      findUnique: jest.fn(),
    },
    usuario: {
      findUnique: jest.fn(),
    },
    atendimento: {
      findUnique: jest.fn(),
    },
    prontuario: {
      findUnique: jest.fn(),
    },
    receita: {
      findUnique: jest.fn(),
    },
    receitaOculos: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    receitaLenteContato: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    receitaMedicamento: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReceitaService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<ReceitaService>(ReceitaService);
  });

  it('deve retornar 422 quando filial nao pertencer a empresa ao criar receita', async () => {
    prismaMock.filial.findUnique.mockResolvedValue({
      id: 'filial-1',
      empresaId: 'empresa-outra',
    });

    const response = await service.create({
      empresaId: 'empresa-1',
      filialId: 'filial-1',
      pacienteId: 'paciente-1',
      tipo: TipoReceita.oculos,
      oculos: {
        od_esferico: '-1.00',
      },
    });

    expect(response).toEqual({
      status: 422,
      message: 'Filial não encontrada para a empresa informada.',
    });

    expect(prismaMock.filial.findUnique).toHaveBeenCalledWith({
      where: { id: 'filial-1' },
      select: { id: true, empresaId: true },
    });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('deve retornar 422 quando detalhe nao corresponder ao tipo da receita', async () => {
    prismaMock.filial.findUnique.mockResolvedValue({
      id: 'filial-1',
      empresaId: 'empresa-1',
    });
    prismaMock.pessoa.findUnique.mockResolvedValue({
      id: 'paciente-1',
      filialId: 'filial-1',
    });

    const response = await service.create({
      empresaId: 'empresa-1',
      filialId: 'filial-1',
      pacienteId: 'paciente-1',
      tipo: TipoReceita.oculos,
      medicamento: {
        medicamento: 'Colirio X',
      },
    });

    expect(response).toEqual({
      status: 422,
      message:
        'O detalhe informado não corresponde ao tipo da receita selecionado.',
    });

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it('deve retornar 422 quando receita nao existir ao criar detalhe de oculos', async () => {
    prismaMock.receita.findUnique.mockResolvedValue(null);

    const response = await service.createOculos('receita-inexistente', {
      od_esferico: '-1.25',
    });

    expect(response).toEqual({
      status: 422,
      message: 'Receita não encontrada.',
    });

    expect(prismaMock.receita.findUnique).toHaveBeenCalledWith({
      where: { id: 'receita-inexistente' },
      select: {
        id: true,
        tipo: true,
      },
    });
    expect(prismaMock.receitaOculos.create).not.toHaveBeenCalled();
  });

  it('deve retornar 422 quando receita nao for do tipo oculos', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.medicamento,
    });

    const response = await service.createOculos('receita-1', {
      od_esferico: '-1.25',
    });

    expect(response).toEqual({
      status: 422,
      message: 'A receita informada não é do tipo óculos.',
    });

    expect(prismaMock.receitaOculos.create).not.toHaveBeenCalled();
  });

  it('deve criar detalhe de oculos com sucesso', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.oculos,
    });
    prismaMock.receitaOculos.findUnique.mockResolvedValue(null);
    prismaMock.receitaOculos.create.mockResolvedValue({
      id: 'det-1',
      receitaId: 'receita-1',
      od_esferico: '-1.25',
      od_cilindrico: null,
      od_eixo: null,
      oe_esferico: null,
      oe_cilindrico: null,
      oe_eixo: null,
      dp: null,
      adicao: null,
      observacoes: null,
    });

    const response = await service.createOculos('receita-1', {
      od_esferico: '-1.25',
    });

    expect(response).toEqual({
      status: 201,
      message: 'Detalhe de óculos criado com sucesso.',
      data: {
        id: 'det-1',
        receitaId: 'receita-1',
        od_esferico: '-1.25',
        od_cilindrico: null,
        od_eixo: null,
        oe_esferico: null,
        oe_cilindrico: null,
        oe_eixo: null,
        dp: null,
        adicao: null,
        observacoes: null,
      },
    });

    expect(prismaMock.receitaOculos.create).toHaveBeenCalledWith({
      data: {
        receitaId: 'receita-1',
        od_esferico: '-1.25',
        od_cilindrico: undefined,
        od_eixo: undefined,
        oe_esferico: undefined,
        oe_cilindrico: undefined,
        oe_eixo: undefined,
        dp: undefined,
        adicao: undefined,
        observacoes: undefined,
      },
    });
  });

  it('deve retornar 422 ao buscar detalhe quando receita nao for do tipo oculos', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.medicamento,
    });

    const response = await service.findOculosByReceitaId('receita-1');

    expect(response).toEqual({
      status: 422,
      message: 'A receita informada não é do tipo óculos.',
    });

    expect(prismaMock.receitaOculos.findUnique).not.toHaveBeenCalled();
  });

  it('deve atualizar detalhe de oculos com sucesso', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.oculos,
    });
    prismaMock.receitaOculos.findUnique.mockResolvedValue({ id: 'det-1' });
    prismaMock.receitaOculos.update.mockResolvedValue({
      id: 'det-1',
      receitaId: 'receita-1',
      od_esferico: '-1.50',
      od_cilindrico: null,
      od_eixo: null,
      oe_esferico: null,
      oe_cilindrico: null,
      oe_eixo: null,
      dp: null,
      adicao: null,
      observacoes: 'Ajuste fino',
    });

    const response = await service.updateOculos('receita-1', {
      od_esferico: '-1.50',
      observacoes: 'Ajuste fino',
    });

    expect(response).toEqual({
      status: 200,
      message: 'Detalhe de óculos atualizado com sucesso.',
      data: {
        id: 'det-1',
        receitaId: 'receita-1',
        od_esferico: '-1.50',
        od_cilindrico: null,
        od_eixo: null,
        oe_esferico: null,
        oe_cilindrico: null,
        oe_eixo: null,
        dp: null,
        adicao: null,
        observacoes: 'Ajuste fino',
      },
    });

    expect(prismaMock.receitaOculos.update).toHaveBeenCalledWith({
      where: { receitaId: 'receita-1' },
      data: {
        od_esferico: '-1.50',
        od_cilindrico: undefined,
        od_eixo: undefined,
        oe_esferico: undefined,
        oe_cilindrico: undefined,
        oe_eixo: undefined,
        dp: undefined,
        adicao: undefined,
        observacoes: 'Ajuste fino',
      },
    });
  });

  it('deve retornar 422 ao deletar detalhe quando receita nao for do tipo oculos', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.lente_contato,
    });

    const response = await service.deleteOculosByReceitaId('receita-1');

    expect(response).toEqual({
      status: 422,
      message: 'A receita informada não é do tipo óculos.',
    });

    expect(prismaMock.receitaOculos.delete).not.toHaveBeenCalled();
  });

  it('deve deletar detalhe de oculos com sucesso', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.oculos,
    });
    prismaMock.receitaOculos.findUnique.mockResolvedValue({ id: 'det-1' });

    const response = await service.deleteOculosByReceitaId('receita-1');

    expect(response).toEqual({
      status: 200,
      message: 'Detalhe de óculos deletado com sucesso.',
    });

    expect(prismaMock.receitaOculos.delete).toHaveBeenCalledWith({
      where: { receitaId: 'receita-1' },
    });
  });

  it('deve retornar 422 quando receita nao for do tipo lente de contato', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.oculos,
    });

    const response = await service.createLenteContato('receita-1', {
      od_curva_base: '8.6',
    });

    expect(response).toEqual({
      status: 422,
      message: 'A receita informada não é do tipo lente de contato.',
    });

    expect(prismaMock.receitaLenteContato.create).not.toHaveBeenCalled();
  });

  it('deve criar detalhe de lente de contato com sucesso', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.lente_contato,
    });
    prismaMock.receitaLenteContato.findUnique.mockResolvedValue(null);
    prismaMock.receitaLenteContato.create.mockResolvedValue({
      id: 'det-lc-1',
      receitaId: 'receita-1',
      od_curva_base: '8.6',
      od_diametro: null,
      od_grau: null,
      oe_curva_base: null,
      oe_diametro: null,
      oe_grau: null,
      material: null,
      marca: null,
      observacoes: null,
    });

    const response = await service.createLenteContato('receita-1', {
      od_curva_base: '8.6',
    });

    expect(response).toEqual({
      status: 201,
      message: 'Detalhe de lente de contato criado com sucesso.',
      data: {
        id: 'det-lc-1',
        receitaId: 'receita-1',
        od_curva_base: '8.6',
        od_diametro: null,
        od_grau: null,
        oe_curva_base: null,
        oe_diametro: null,
        oe_grau: null,
        material: null,
        marca: null,
        observacoes: null,
      },
    });

    expect(prismaMock.receitaLenteContato.create).toHaveBeenCalledWith({
      data: {
        receitaId: 'receita-1',
        od_curva_base: '8.6',
        od_diametro: undefined,
        od_grau: undefined,
        oe_curva_base: undefined,
        oe_diametro: undefined,
        oe_grau: undefined,
        material: undefined,
        marca: undefined,
        observacoes: undefined,
      },
    });
  });

  it('deve retornar 422 ao buscar detalhe quando receita nao for do tipo lente de contato', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.medicamento,
    });

    const response = await service.findLenteContatoByReceitaId('receita-1');

    expect(response).toEqual({
      status: 422,
      message: 'A receita informada não é do tipo lente de contato.',
    });

    expect(prismaMock.receitaLenteContato.findUnique).not.toHaveBeenCalled();
  });

  it('deve atualizar detalhe de lente de contato com sucesso', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.lente_contato,
    });
    prismaMock.receitaLenteContato.findUnique.mockResolvedValue({
      id: 'det-lc-1',
    });
    prismaMock.receitaLenteContato.update.mockResolvedValue({
      id: 'det-lc-1',
      receitaId: 'receita-1',
      od_curva_base: '8.7',
      od_diametro: null,
      od_grau: null,
      oe_curva_base: null,
      oe_diametro: null,
      oe_grau: null,
      material: null,
      marca: 'Marca X',
      observacoes: null,
    });

    const response = await service.updateLenteContato('receita-1', {
      od_curva_base: '8.7',
      marca: 'Marca X',
    });

    expect(response).toEqual({
      status: 200,
      message: 'Detalhe de lente de contato atualizado com sucesso.',
      data: {
        id: 'det-lc-1',
        receitaId: 'receita-1',
        od_curva_base: '8.7',
        od_diametro: null,
        od_grau: null,
        oe_curva_base: null,
        oe_diametro: null,
        oe_grau: null,
        material: null,
        marca: 'Marca X',
        observacoes: null,
      },
    });

    expect(prismaMock.receitaLenteContato.update).toHaveBeenCalledWith({
      where: { receitaId: 'receita-1' },
      data: {
        od_curva_base: '8.7',
        od_diametro: undefined,
        od_grau: undefined,
        oe_curva_base: undefined,
        oe_diametro: undefined,
        oe_grau: undefined,
        material: undefined,
        marca: 'Marca X',
        observacoes: undefined,
      },
    });
  });

  it('deve retornar 422 ao deletar detalhe quando receita nao for do tipo lente de contato', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.oculos,
    });

    const response = await service.deleteLenteContatoByReceitaId('receita-1');

    expect(response).toEqual({
      status: 422,
      message: 'A receita informada não é do tipo lente de contato.',
    });

    expect(prismaMock.receitaLenteContato.delete).not.toHaveBeenCalled();
  });

  it('deve deletar detalhe de lente de contato com sucesso', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.lente_contato,
    });
    prismaMock.receitaLenteContato.findUnique.mockResolvedValue({
      id: 'det-lc-1',
    });

    const response = await service.deleteLenteContatoByReceitaId('receita-1');

    expect(response).toEqual({
      status: 200,
      message: 'Detalhe de lente de contato deletado com sucesso.',
    });

    expect(prismaMock.receitaLenteContato.delete).toHaveBeenCalledWith({
      where: { receitaId: 'receita-1' },
    });
  });

  it('deve retornar 422 quando receita nao for do tipo medicamento', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.oculos,
    });

    const response = await service.createMedicamento('receita-1', {
      medicamento: 'Colirio X',
    });

    expect(response).toEqual({
      status: 422,
      message: 'A receita informada não é do tipo medicamento.',
    });

    expect(prismaMock.receitaMedicamento.create).not.toHaveBeenCalled();
  });

  it('deve criar detalhe de medicamento com sucesso', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.medicamento,
    });
    prismaMock.receitaMedicamento.findUnique.mockResolvedValue(null);
    prismaMock.receitaMedicamento.create.mockResolvedValue({
      id: 'det-med-1',
      receitaId: 'receita-1',
      medicamento: 'Colirio X',
      dosagem: null,
      posologia: null,
      duracao: null,
      observacoes: null,
    });

    const response = await service.createMedicamento('receita-1', {
      medicamento: 'Colirio X',
    });

    expect(response).toEqual({
      status: 201,
      message: 'Detalhe de medicamento criado com sucesso.',
      data: {
        id: 'det-med-1',
        receitaId: 'receita-1',
        medicamento: 'Colirio X',
        dosagem: null,
        posologia: null,
        duracao: null,
        observacoes: null,
      },
    });

    expect(prismaMock.receitaMedicamento.create).toHaveBeenCalledWith({
      data: {
        receitaId: 'receita-1',
        medicamento: 'Colirio X',
        dosagem: undefined,
        posologia: undefined,
        duracao: undefined,
        observacoes: undefined,
      },
    });
  });

  it('deve retornar 422 ao buscar detalhe quando receita nao for do tipo medicamento', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.lente_contato,
    });

    const response = await service.findMedicamentoByReceitaId('receita-1');

    expect(response).toEqual({
      status: 422,
      message: 'A receita informada não é do tipo medicamento.',
    });

    expect(prismaMock.receitaMedicamento.findUnique).not.toHaveBeenCalled();
  });

  it('deve atualizar detalhe de medicamento com sucesso', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.medicamento,
    });
    prismaMock.receitaMedicamento.findUnique.mockResolvedValue({
      id: 'det-med-1',
    });
    prismaMock.receitaMedicamento.update.mockResolvedValue({
      id: 'det-med-1',
      receitaId: 'receita-1',
      medicamento: 'Colirio Y',
      dosagem: null,
      posologia: '3x ao dia',
      duracao: null,
      observacoes: null,
    });

    const response = await service.updateMedicamento('receita-1', {
      medicamento: 'Colirio Y',
      posologia: '3x ao dia',
    });

    expect(response).toEqual({
      status: 200,
      message: 'Detalhe de medicamento atualizado com sucesso.',
      data: {
        id: 'det-med-1',
        receitaId: 'receita-1',
        medicamento: 'Colirio Y',
        dosagem: null,
        posologia: '3x ao dia',
        duracao: null,
        observacoes: null,
      },
    });

    expect(prismaMock.receitaMedicamento.update).toHaveBeenCalledWith({
      where: { receitaId: 'receita-1' },
      data: {
        medicamento: 'Colirio Y',
        dosagem: undefined,
        posologia: '3x ao dia',
        duracao: undefined,
        observacoes: undefined,
      },
    });
  });

  it('deve retornar 422 ao deletar detalhe quando receita nao for do tipo medicamento', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.oculos,
    });

    const response = await service.deleteMedicamentoByReceitaId('receita-1');

    expect(response).toEqual({
      status: 422,
      message: 'A receita informada não é do tipo medicamento.',
    });

    expect(prismaMock.receitaMedicamento.delete).not.toHaveBeenCalled();
  });

  it('deve deletar detalhe de medicamento com sucesso', async () => {
    prismaMock.receita.findUnique.mockResolvedValue({
      id: 'receita-1',
      tipo: TipoReceita.medicamento,
    });
    prismaMock.receitaMedicamento.findUnique.mockResolvedValue({
      id: 'det-med-1',
    });

    const response = await service.deleteMedicamentoByReceitaId('receita-1');

    expect(response).toEqual({
      status: 200,
      message: 'Detalhe de medicamento deletado com sucesso.',
    });

    expect(prismaMock.receitaMedicamento.delete).toHaveBeenCalledWith({
      where: { receitaId: 'receita-1' },
    });
  });
});
