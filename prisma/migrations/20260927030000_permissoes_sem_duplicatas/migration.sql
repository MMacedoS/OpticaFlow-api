-- Remove permissoes duplicadas (seed antigo rodou varias vezes e o indice
-- unico nao impede repeticao quando "empresaId" e NULL), mantendo os vinculos.

CREATE TEMP TABLE permissao_mantida AS
SELECT DISTINCT ON (modulo, acao, COALESCE("empresaId", '')) id, modulo, acao, "empresaId"
FROM "Permissao"
ORDER BY modulo, acao, COALESCE("empresaId", ''), id;

CREATE TEMP TABLE permissao_mapa AS
SELECT p.id AS antigo, m.id AS novo
FROM "Permissao" p
JOIN permissao_mantida m
  ON m.modulo = p.modulo
 AND m.acao = p.acao
 AND COALESCE(m."empresaId", '') = COALESCE(p."empresaId", '')
WHERE p.id <> m.id;

-- Um vinculo por (acesso, permissao mantida)
CREATE TEMP TABLE vinculo_mantido AS
SELECT DISTINCT ON (ap."acessoId", COALESCE(mp.novo, ap."permissaoId"))
  ap.id, COALESCE(mp.novo, ap."permissaoId") AS permissao
FROM "AcessoPermissao" ap
LEFT JOIN permissao_mapa mp ON mp.antigo = ap."permissaoId"
ORDER BY ap."acessoId", COALESCE(mp.novo, ap."permissaoId"), ap.id;

DELETE FROM "AcessoPermissao" WHERE id NOT IN (SELECT id FROM vinculo_mantido);

UPDATE "AcessoPermissao" ap
SET "permissaoId" = v.permissao
FROM vinculo_mantido v
WHERE ap.id = v.id AND ap."permissaoId" <> v.permissao;

DELETE FROM "Permissao" WHERE id IN (SELECT antigo FROM permissao_mapa);

-- Impede novas duplicatas das permissoes globais
CREATE UNIQUE INDEX "Permissao_global_modulo_acao_key"
  ON "Permissao"(modulo, acao) WHERE "empresaId" IS NULL;

-- Nome do perfil unico por empresa (antes era unico no sistema todo)
DROP INDEX "Acesso_nome_key";
CREATE UNIQUE INDEX "Acesso_empresaId_nome_key" ON "Acesso"("empresaId", nome);
CREATE UNIQUE INDEX "Acesso_global_nome_key" ON "Acesso"(nome) WHERE "empresaId" IS NULL;
