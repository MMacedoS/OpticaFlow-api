import { StatusAtendimento } from '@prisma/client';

export interface ResumoDashboard {
  consultasHoje: {
    total: number;
    porStatus: Record<StatusAtendimento, number>;
    proximas: {
      id: string;
      dataAtendimento: Date;
      status: StatusAtendimento;
      paciente: string;
      profissional: string | null;
    }[];
  };
  ordensServico: {
    abertas: number;
    atrasadas: number;
    listaAtrasadas: {
      id: string;
      numero: string | null;
      previsao_entrega: Date | null;
      cliente: string | null;
      valor_total: number;
    }[];
  };
  vendas: {
    mesAtual: { total: number; quantidade: number };
    mesAnterior: { total: number; quantidade: number };
  };
  financeiro: {
    receberVencido: number;
    pagarVencido: number;
    receberProximos7Dias: number;
    pagarProximos7Dias: number;
  };
  estoque: {
    abaixoMinimo: number;
    itens: {
      id: string;
      produto: string;
      sku: string;
      quantidade: number;
      minimo: number | null;
    }[];
  };
}
