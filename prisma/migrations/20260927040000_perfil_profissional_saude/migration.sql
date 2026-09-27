-- Perfil padrao para optometristas e oftalmologistas: apenas o necessario
-- para atender os proprios pacientes (os dados ja sao filtrados pelo
-- profissional no backend).
INSERT INTO "Acesso" (id, nome, descricao, "empresaId")
VALUES (
  gen_random_uuid()::text,
  'Profissional de saúde',
  'Optometristas e oftalmologistas: agenda, consultas, prontuários e receitas dos próprios pacientes',
  NULL
)
ON CONFLICT (nome) WHERE "empresaId" IS NULL DO NOTHING;

INSERT INTO "AcessoPermissao" (id, "acessoId", "permissaoId")
SELECT gen_random_uuid()::text, a.id, p.id
FROM "Acesso" a
JOIN "Permissao" p ON p."empresaId" IS NULL AND (
     p.modulo IN ('prontuario', 'receita')
  OR (p.modulo IN ('agenda', 'atendimento')
      AND p.acao IN ('listar', 'detalhar', 'criar', 'atualizar'))
  OR (p.modulo IN ('pessoa', 'cliente', 'convenio', 'oftalmologista', 'optometrista')
      AND p.acao IN ('listar', 'detalhar'))
)
WHERE a.nome = 'Profissional de saúde' AND a."empresaId" IS NULL
ON CONFLICT ("acessoId", "permissaoId") DO NOTHING;
