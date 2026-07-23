/*
  Warnings:

  - The values [em_producao,pronta,entregue] on the enum `StatusOrdemServico` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StatusOrdemServico_new" AS ENUM ('aberta', 'orcamento', 'faturada', 'finalizada', 'cancelada');
ALTER TABLE "public"."OrdemServico" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "OrdemServico" ALTER COLUMN "status" TYPE "StatusOrdemServico_new" USING ("status"::text::"StatusOrdemServico_new");
ALTER TYPE "StatusOrdemServico" RENAME TO "StatusOrdemServico_old";
ALTER TYPE "StatusOrdemServico_new" RENAME TO "StatusOrdemServico";
DROP TYPE "public"."StatusOrdemServico_old";
ALTER TABLE "OrdemServico" ALTER COLUMN "status" SET DEFAULT 'aberta';
COMMIT;
