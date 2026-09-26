
-- DropForeignKey
ALTER TABLE "Fornecedor" DROP CONSTRAINT "Fornecedor_pessoaId_fkey";

-- DropIndex
DROP INDEX "Fornecedor_pessoaId_key";

-- AlterTable
ALTER TABLE "Fornecedor" DROP COLUMN "pessoaId",
ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "empresaId" TEXT NOT NULL,
ADD COLUMN     "nome_fantasia" TEXT,
ADD COLUMN     "observacoes" TEXT,
ADD COLUMN     "razao_social" TEXT NOT NULL,
ADD COLUMN     "telefone" TEXT;

-- CreateIndex
CREATE INDEX "Fornecedor_empresaId_idx" ON "Fornecedor"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_empresaId_cnpj_key" ON "Fornecedor"("empresaId", "cnpj");

-- AddForeignKey
ALTER TABLE "Fornecedor" ADD CONSTRAINT "Fornecedor_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

