/*
  Warnings:

  - You are about to drop the column `Contato` on the `Contato_empresa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Contato_empresa" DROP COLUMN "Contato",
ADD COLUMN     "contato" TEXT NOT NULL DEFAULT '';
