import { StatusOrdemServico, TipoProduto } from '@prisma/client';

export interface OrdemServicoItemResumo {
  id: string;
  ordemServicoId: string;
  produtoId: string | null;
  descricao_servico: string | null;
  quantidade: number;
  valor_unitario: number;
  desconto: number | null;
  subtotal: number;
  produto: {
    id: string;
    nome: string;
    sku: string | null;
    tipo: TipoProduto;
  } | null;
}

export interface OrdemServicoResumo {
  id: string;
  empresaId: string;
  filialId: string;
  atendimentoId: string | null;
  clienteId: string | null;
  laboratorioId: string | null;
  numero: string | null;
  status: StatusOrdemServico;
  descricao: string | null;
  previsao_entrega: Date | null;
  data_entrega: Date | null;
  valor_total: number;
  createdAt: Date;
  updatedAt: Date;
  empresa: {
    id: string;
    nome: string;
  };
  filial: {
    id: string;
    nome: string;
  } | null;
  cliente: {
    id: string;
    numero_convenio: string | null;
    pessoa: {
      id: string;
      nome: string;
      email: string | null;
      cpf: string | null;
    };
  } | null;
  atendimento: {
    id: string;
    dataAtendimento: Date;
    status: string;
    queixa_principal: string | null;
    paciente: {
      id: string;
      nome: string;
      email: string | null;
      cpf: string | null;
    } | null;
    profissional: {
      id: string;
      email: string;
      username: string | null;
      pessoa: {
        id: string;
        nome: string;
      } | null;
    } | null;
    convenio: {
      id: string;
      nome: string;
      registro: string | null;
    } | null;
  } | null;
  laboratorio: {
    id: string;
    nome: string;
    cnpj: string | null;
  } | null;
  itens: OrdemServicoItemResumo[];
}
