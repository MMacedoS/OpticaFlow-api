/*
  Warnings:

  - You are about to drop the column `generator` on the `Pessoa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Filial" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ativo';

-- AlterTable
ALTER TABLE "Funcionario" ADD COLUMN     "cargo" TEXT;

-- AlterTable
ALTER TABLE "Pessoa" DROP COLUMN "generator",
ADD COLUMN     "data_nascimento" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "genero" TEXT,
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'ativo';
