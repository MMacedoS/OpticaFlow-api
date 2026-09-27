-- Acoes do superadmin (sem empresa) tambem sao auditadas.
ALTER TABLE "Auditoria" ALTER COLUMN "empresaId" DROP NOT NULL;
