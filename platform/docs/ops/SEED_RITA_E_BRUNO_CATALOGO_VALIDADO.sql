-- ============================================
-- SEED: Rita e Bruno — itens validados para catálogo EVIS
-- Data: 2026-04-21
-- Objetivo:
-- 1. Registrar os itens residenciais validados no caso Rita e Bruno
-- 2. Alimentar o catálogo EVIS no schema real já existente
-- 3. Preservar rastreabilidade por obra, fonte e confiança
-- ============================================

BEGIN;

WITH catalogo_seed AS (
  SELECT *
  FROM (
    VALUES
      (
        'evis-hidr-001-ponto-agua-fria-residencial',
        'EVIS-HIDR-001',
        'Ponto água fria residencial',
        'Execução completa de ponto hidráulico de água fria em residência unifamiliar.',
        'Hidráulica',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["ponto agua fria","hidraulica residencial","agua fria residencial","ponto hidraulico"]'::jsonb,
        '{"seed":"rita_bruno_validado","obra_referencia":"ORC_2026-001_Rita_e_Bruno_Quatro_Barras","origem_validacao":"orcamento_real","disciplina":"hidraulica_sanitaria","classificacao_item":"item_global"}'::jsonb
      ),
      (
        'evis-hidr-002-ponto-agua-quente-residencial',
        'EVIS-HIDR-002',
        'Ponto água quente residencial',
        'Execução completa de ponto hidráulico de água quente em residência unifamiliar.',
        'Hidráulica',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["ponto agua quente","hidraulica residencial","agua quente residencial","ponto hidraulico"]'::jsonb,
        '{"seed":"rita_bruno_validado","obra_referencia":"ORC_2026-001_Rita_e_Bruno_Quatro_Barras","origem_validacao":"orcamento_real","disciplina":"hidraulica_sanitaria","classificacao_item":"item_global"}'::jsonb
      ),
      (
        'evis-hidr-003-ponto-esgoto-residencial',
        'EVIS-HIDR-003',
        'Ponto esgoto residencial',
        'Execução completa de ponto de esgoto sanitário em residência unifamiliar.',
        'Hidráulica',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["ponto esgoto","esgoto residencial","hidraulica esgoto","ponto sanitario"]'::jsonb,
        '{"seed":"rita_bruno_validado","obra_referencia":"ORC_2026-001_Rita_e_Bruno_Quatro_Barras","origem_validacao":"orcamento_real","disciplina":"hidraulica_sanitaria","classificacao_item":"item_global"}'::jsonb
      ),
      (
        'evis-elet-001-ponto-tomada-tug-20a',
        'EVIS-ELET-001',
        'Ponto tomada TUG 20A',
        'Execução completa de ponto elétrico para tomada de uso geral 20A.',
        'Elétrica',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["tomada tug","ponto tomada 20a","ponto eletrico residencial","tomada uso geral"]'::jsonb,
        '{"seed":"rita_bruno_validado","obra_referencia":"ORC_2026-001_Rita_e_Bruno_Quatro_Barras","origem_validacao":"orcamento_real","disciplina":"eletrica","classificacao_item":"item_global"}'::jsonb
      ),
      (
        'evis-elet-002-ponto-tomada-tue-220v',
        'EVIS-ELET-002',
        'Ponto tomada TUE 220V',
        'Execução completa de ponto elétrico para tomada de uso específico em 220V.',
        'Elétrica',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["tomada tue","ponto 220v","tomada uso especifico","ponto eletrico 220v"]'::jsonb,
        '{"seed":"rita_bruno_validado","obra_referencia":"ORC_2026-001_Rita_e_Bruno_Quatro_Barras","origem_validacao":"orcamento_real","disciplina":"eletrica","classificacao_item":"item_global"}'::jsonb
      ),
      (
        'evis-elet-003-ponto-iluminacao-residencial',
        'EVIS-ELET-003',
        'Ponto iluminação residencial',
        'Execução completa de ponto elétrico de iluminação residencial.',
        'Elétrica',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["ponto iluminacao","ponto de luz","iluminacao residencial","ponto eletrico iluminacao"]'::jsonb,
        '{"seed":"rita_bruno_validado","obra_referencia":"ORC_2026-001_Rita_e_Bruno_Quatro_Barras","origem_validacao":"orcamento_real","disciplina":"eletrica","classificacao_item":"item_global"}'::jsonb
      ),
      (
        'evis-acab-001-piso-laminado-quickstep-vision',
        'EVIS-ACAB-001',
        'Piso laminado QuickStep Vision',
        'Fornecimento e instalação de piso laminado QuickStep Vision, conforme padrão validado na obra de referência.',
        'Pisos',
        'm²',
        'residencial',
        'aprovado',
        'fornecedor',
        '["quickstep vision","piso laminado","laminado premium","piso acabamento"]'::jsonb,
        '{"seed":"rita_bruno_validado","obra_referencia":"ORC_2026-001_Rita_e_Bruno_Quatro_Barras","origem_validacao":"orcamento_real","disciplina":"civil_execucao","classificacao_item":"item_global","marca":"QuickStep"}'::jsonb
      ),
      (
        'evis-acab-002-textura-projetada-massa-acrilica',
        'EVIS-ACAB-002',
        'Textura projetada massa acrílica',
        'Execução de textura projetada com massa acrílica em fachada ou áreas especificadas.',
        'Pintura',
        'm²',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["textura projetada","massa acrilica","textura fachada","acabamento textura"]'::jsonb,
        '{"seed":"rita_bruno_validado","obra_referencia":"ORC_2026-001_Rita_e_Bruno_Quatro_Barras","origem_validacao":"orcamento_real","disciplina":"civil_execucao","classificacao_item":"item_global"}'::jsonb
      )
  ) AS t (
    slug,
    codigo_evis,
    nome,
    descricao,
    categoria,
    unidade_referencia,
    tipo_obra,
    status_catalogo,
    origem_principal,
    aliases,
    metadados
  )
)
INSERT INTO public.catalogo_servicos_evis (
  slug,
  nome,
  descricao,
  categoria,
  unidade_referencia,
  tipo_obra,
  status_catalogo,
  origem_principal,
  aliases,
  metadados
)
SELECT
  slug,
  nome,
  descricao,
  categoria,
  unidade_referencia,
  tipo_obra,
  status_catalogo,
  origem_principal,
  aliases,
  metadados || jsonb_build_object('codigo_evis', codigo_evis)
FROM catalogo_seed
ON CONFLICT (slug) DO UPDATE
SET
  nome = EXCLUDED.nome,
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  unidade_referencia = EXCLUDED.unidade_referencia,
  tipo_obra = EXCLUDED.tipo_obra,
  status_catalogo = EXCLUDED.status_catalogo,
  origem_principal = EXCLUDED.origem_principal,
  aliases = EXCLUDED.aliases,
  metadados = EXCLUDED.metadados,
  updated_at = now();

WITH referencias_seed AS (
  SELECT *
  FROM (
    VALUES
      ('evis-hidr-001-ponto-agua-fria-residencial', 'composicao_propria', 'catalogo_berti', 'EVIS-HIDR-001', 'Ponto água fria residencial', 'un', 'Preco validado no projeto Rita e Bruno.', 95),
      ('evis-hidr-002-ponto-agua-quente-residencial', 'composicao_propria', 'catalogo_berti', 'EVIS-HIDR-002', 'Ponto água quente residencial', 'un', 'Preco validado no projeto Rita e Bruno.', 95),
      ('evis-hidr-003-ponto-esgoto-residencial', 'composicao_propria', 'catalogo_berti', 'EVIS-HIDR-003', 'Ponto esgoto residencial', 'un', 'Preco validado no projeto Rita e Bruno.', 95),
      ('evis-elet-001-ponto-tomada-tug-20a', 'composicao_propria', 'catalogo_berti', 'EVIS-ELET-001', 'Ponto tomada TUG 20A', 'un', 'Preco validado no projeto Rita e Bruno.', 95),
      ('evis-elet-002-ponto-tomada-tue-220v', 'composicao_propria', 'catalogo_berti', 'EVIS-ELET-002', 'Ponto tomada TUE 220V', 'un', 'Preco validado no projeto Rita e Bruno.', 95),
      ('evis-elet-003-ponto-iluminacao-residencial', 'composicao_propria', 'catalogo_berti', 'EVIS-ELET-003', 'Ponto iluminação residencial', 'un', 'Preco validado no projeto Rita e Bruno.', 95),
      ('evis-acab-001-piso-laminado-quickstep-vision', 'fornecedor', 'catalogo_berti', 'EVIS-ACAB-001', 'Piso laminado QuickStep Vision', 'm²', 'Preco validado na obra de referencia com item comercial especifico.', 92),
      ('evis-acab-002-textura-projetada-massa-acrilica', 'composicao_propria', 'catalogo_berti', 'EVIS-ACAB-002', 'Textura projetada massa acrílica', 'm²', 'Preco validado no projeto Rita e Bruno.', 92)
  ) AS t (
    slug,
    fonte,
    tabela_origem,
    codigo_origem,
    descricao_origem,
    unidade_origem,
    observacoes,
    confianca
  )
)
INSERT INTO public.servicos_referencia_origem (
  catalogo_servico_id,
  fonte,
  tabela_origem,
  codigo_origem,
  descricao_origem,
  unidade_origem,
  observacoes,
  confianca,
  principal,
  competencia_ref,
  uf,
  cidade
)
SELECT
  c.id,
  r.fonte,
  r.tabela_origem,
  r.codigo_origem,
  r.descricao_origem,
  r.unidade_origem,
  r.observacoes,
  r.confianca,
  true,
  DATE '2026-04-01',
  'PR',
  'Quatro Barras'
FROM referencias_seed r
JOIN public.catalogo_servicos_evis c
  ON c.slug = r.slug
WHERE NOT EXISTS (
  SELECT 1
  FROM public.servicos_referencia_origem existing
  WHERE existing.catalogo_servico_id = c.id
    AND existing.fonte = r.fonte
    AND coalesce(existing.codigo_origem, '') = coalesce(r.codigo_origem, '')
    AND existing.principal = true
);

WITH precos_seed AS (
  SELECT *
  FROM (
    VALUES
      ('evis-hidr-001-ponto-agua-fria-residencial', 'manual', 195.00, 'un', DATE '2026-04-01', 'Catalogo Berti - Rita e Bruno', '{"mat_unitario":125.00,"mo_unitario":70.00,"total_unitario":195.00}'::jsonb),
      ('evis-hidr-002-ponto-agua-quente-residencial', 'manual', 210.00, 'un', DATE '2026-04-01', 'Catalogo Berti - Rita e Bruno', '{"mat_unitario":140.00,"mo_unitario":70.00,"total_unitario":210.00}'::jsonb),
      ('evis-hidr-003-ponto-esgoto-residencial', 'manual', 175.00, 'un', DATE '2026-04-01', 'Catalogo Berti - Rita e Bruno', '{"mat_unitario":105.00,"mo_unitario":70.00,"total_unitario":175.00}'::jsonb),
      ('evis-elet-001-ponto-tomada-tug-20a', 'manual', 135.00, 'un', DATE '2026-04-01', 'Catalogo Berti - Rita e Bruno', '{"mat_unitario":55.00,"mo_unitario":80.00,"total_unitario":135.00}'::jsonb),
      ('evis-elet-002-ponto-tomada-tue-220v', 'manual', 172.00, 'un', DATE '2026-04-01', 'Catalogo Berti - Rita e Bruno', '{"mat_unitario":82.00,"mo_unitario":90.00,"total_unitario":172.00}'::jsonb),
      ('evis-elet-003-ponto-iluminacao-residencial', 'manual', 155.00, 'un', DATE '2026-04-01', 'Catalogo Berti - Rita e Bruno', '{"mat_unitario":75.00,"mo_unitario":80.00,"total_unitario":155.00}'::jsonb),
      ('evis-acab-001-piso-laminado-quickstep-vision', 'fornecedor', 127.83, 'm²', DATE '2026-04-01', 'Catalogo Berti - Rita e Bruno', '{"mat_unitario":92.83,"mo_unitario":35.00,"total_unitario":127.83}'::jsonb),
      ('evis-acab-002-textura-projetada-massa-acrilica', 'manual', 143.70, 'm²', DATE '2026-04-01', 'Catalogo Berti - Rita e Bruno', '{"mat_unitario":108.70,"mo_unitario":35.00,"total_unitario":143.70}'::jsonb)
  ) AS t (
    slug,
    tipo_preco,
    valor_unitario,
    unidade,
    competencia,
    fonte_nome,
    memoria
  )
)
INSERT INTO public.precos_referencia_historico (
  catalogo_servico_id,
  tipo_preco,
  valor_unitario,
  unidade,
  competencia,
  valid_from,
  uf,
  cidade,
  fonte_nome,
  observacoes,
  confianca
)
SELECT
  c.id,
  p.tipo_preco,
  p.valor_unitario,
  p.unidade,
  p.competencia,
  p.competencia,
  'PR',
  'Quatro Barras',
  p.fonte_nome,
  concat('Seed validado do projeto Rita e Bruno. Memoria: ', p.memoria::text),
  95
FROM precos_seed p
JOIN public.catalogo_servicos_evis c
  ON c.slug = p.slug
WHERE NOT EXISTS (
  SELECT 1
  FROM public.precos_referencia_historico existing
  WHERE existing.catalogo_servico_id = c.id
    AND existing.tipo_preco = p.tipo_preco
    AND existing.competencia = p.competencia
    AND existing.unidade = p.unidade
    AND existing.valor_unitario = p.valor_unitario
);

COMMIT;

-- Validacao sugerida:
-- SELECT slug, nome, categoria, unidade_referencia
-- FROM public.catalogo_servicos_evis
-- WHERE slug LIKE 'evis-%'
-- ORDER BY slug;
--
-- SELECT slug, nome, valor_unitario_referencia, competencia_referencia, origem_referencia
-- FROM public.vw_referencias_servicos_evis
-- WHERE slug IN (
--   'evis-hidr-001-ponto-agua-fria-residencial',
--   'evis-hidr-002-ponto-agua-quente-residencial',
--   'evis-hidr-003-ponto-esgoto-residencial',
--   'evis-elet-001-ponto-tomada-tug-20a',
--   'evis-elet-002-ponto-tomada-tue-220v',
--   'evis-elet-003-ponto-iluminacao-residencial',
--   'evis-acab-001-piso-laminado-quickstep-vision',
--   'evis-acab-002-textura-projetada-massa-acrilica'
-- );
