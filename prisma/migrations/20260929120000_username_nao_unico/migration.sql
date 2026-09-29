-- O username e so o nome exibido (login e por e-mail). Unico no sistema
-- inteiro, impedia duas pessoas com o mesmo nome, mesmo em empresas
-- diferentes (ex.: dois optometristas "Ricardo Nunes").
DROP INDEX IF EXISTS "Usuario_username_key";
