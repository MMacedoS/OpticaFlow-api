/*
  Warnings:

  - You are about to drop the column `Contato` on the `Contato` table. All the data in the column will be lost.
  - Added the required column `contato` to the `Contato` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Contato" DROP COLUMN "Contato",
ADD COLUMN     "contato" TEXT NOT NULL;
