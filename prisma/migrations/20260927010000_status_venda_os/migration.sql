
-- CreateEnum
CREATE TYPE "StatusVenda" AS ENUM ('aberta', 'finalizada', 'cancelada');

-- AlterTable
ALTER TABLE "Venda" ADD COLUMN     "finalizadaEm" TIMESTAMP(3),
ADD COLUMN     "ordemServicoId" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "StatusVenda" NOT NULL DEFAULT 'aberta';

-- AlterTable
ALTER TABLE "VendaItem" ADD COLUMN     "descricao_servico" TEXT,
ALTER COLUMN "produtoId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Venda_ordemServicoId_idx" ON "Venda"("ordemServicoId");

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_ordemServicoId_fkey" FOREIGN KEY ("ordemServicoId") REFERENCES "OrdemServico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

