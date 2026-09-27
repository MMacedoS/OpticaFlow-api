
-- CreateEnum
CREATE TYPE "StatusFinanceiro" AS ENUM ('pendente', 'pago', 'cancelado');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia');

-- AlterTable
ALTER TABLE "FinanceiroLancamento" ADD COLUMN     "forma_pagamento" "FormaPagamento",
DROP COLUMN "status",
ADD COLUMN     "status" "StatusFinanceiro" NOT NULL DEFAULT 'pendente';

-- CreateIndex
CREATE INDEX "FinanceiroLancamento_empresaId_status_vencimento_idx" ON "FinanceiroLancamento"("empresaId", "status", "vencimento");

