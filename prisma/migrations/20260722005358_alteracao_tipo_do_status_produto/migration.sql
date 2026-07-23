/*
  Warnings:

  - The `ativo` column on the `Produto` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Produto" DROP COLUMN "ativo",
ADD COLUMN     "ativo" "Status" NOT NULL DEFAULT 'ativo';
