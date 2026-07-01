import { TipoFinanceiro } from '@prisma/client';

export interface FinanceiroLancamentoResumo {
  id: string;
  empresaId: string;
  filialId: string | null;
  atendimentoId: string | null;
  vendaId: string | null;
  compraId: string | null;
  ordemServicoId: string | null;
  criadoPorId: string | null;
  tipo: TipoFinanceiro;
  categoria: string | null;
  descricao: string | null;
  valor: number;
  vencimento: Date | null;
  pagoEm: Date | null;
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
}
