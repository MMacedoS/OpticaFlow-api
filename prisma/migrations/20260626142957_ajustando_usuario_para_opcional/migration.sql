-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_pessoaId_fkey";

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "pessoaId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
