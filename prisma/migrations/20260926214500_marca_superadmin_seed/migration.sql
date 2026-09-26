-- Marca o superadmin criado pelo seed
UPDATE "Usuario" SET "superadmin" = true WHERE "email" = 'superadmin@opticaflow.local';
