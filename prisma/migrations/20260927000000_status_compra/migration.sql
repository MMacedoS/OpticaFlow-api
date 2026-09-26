
-- CreateEnum
CREATE TYPE "StatusCompra" AS ENUM ('rascunho', 'recebida', 'cancelada');

-- AlterTable
ALTER TABLE "Compra" ADD COLUMN     "recebidaEm" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "StatusCompra" NOT NULL DEFAULT 'rascunho';

