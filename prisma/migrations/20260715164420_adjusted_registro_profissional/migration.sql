/*
  Warnings:

  - Added the required column `registro_profissional` to the `Oftalmologista` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registro_profissional` to the `Optometrista` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Oftalmologista" ADD COLUMN     "registro_profissional" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Optometrista" ADD COLUMN     "registro_profissional" TEXT NOT NULL;
