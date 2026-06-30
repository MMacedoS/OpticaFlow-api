/*
  Warnings:

  - A unique constraint covering the columns `[filialId]` on the table `Config_filial` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Config_filial_filialId_key" ON "Config_filial"("filialId");
