-- ============================================
-- SEED: Catalogo Residencial EVIS
-- Data: 2026-04-17
-- Objetivo:
-- 1. Popular o catalogo residencial com itens canônicos
-- 2. Criar referencias iniciais por serviço
-- 3. Definir preços-base de partida para calibragem
--
-- ATENCAO:
-- - Este seed cria uma base inicial operacional.
-- - Os preços são de partida e devem ser revisados por competencia/localidade.
-- - Rerun seguro: usa UPSERT no catálogo e evita duplicação nas referências e preços.
-- ============================================

BEGIN;

WITH catalogo_seed AS (
  SELECT *
  FROM (
    VALUES
      (
        'demolicao-piso-ceramico-m2',
        'Demolição de piso cerâmico',
        'Remoção manual de piso cerâmico em áreas residenciais.',
        'Demolições',
        'm²',
        'residencial',
        'aprovado',
        'sinapi_direto',
        '["demolicao piso","retirada piso","quebra piso","remoção piso cerâmico"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'demolicao-revestimento-parede-m2',
        'Demolição de revestimento de parede',
        'Remoção de azulejo/revestimento cerâmico de parede.',
        'Demolições',
        'm²',
        'residencial',
        'aprovado',
        'sinapi_derivado',
        '["demolicao azulejo","remoção revestimento parede","retirada azulejo"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'alvenaria-vedacao-bloco-ceramico-m2',
        'Alvenaria de vedação em bloco cerâmico',
        'Execução de parede de vedação em bloco cerâmico 9x19x19.',
        'Alvenaria',
        'm²',
        'residencial',
        'aprovado',
        'sinapi_direto',
        '["alvenaria","parede bloco","vedacao bloco ceramico"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'chapisco-parede-m2',
        'Chapisco em parede',
        'Aplicação de chapisco em parede para base de revestimento.',
        'Revestimentos',
        'm²',
        'residencial',
        'aprovado',
        'sinapi_derivado',
        '["chapisco","chapisco parede","preparo parede"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'emboco-parede-m2',
        'Emboço em parede',
        'Aplicação de emboço para regularização de parede.',
        'Revestimentos',
        'm²',
        'residencial',
        'aprovado',
        'sinapi_derivado',
        '["emboço","emboco","regularizacao parede"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'reboco-parede-m2',
        'Reboco em parede',
        'Acabamento fino de parede com reboco para pintura.',
        'Revestimentos',
        'm²',
        'residencial',
        'aprovado',
        'sinapi_derivado',
        '["reboco","massa de reboco","acabamento parede"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'massa-corrida-pva-m2',
        'Massa corrida PVA',
        'Aplicação e lixamento de massa corrida em áreas internas.',
        'Pintura',
        'm²',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["massa corrida","emassamento","preparacao pintura"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'pintura-acrilica-parede-m2',
        'Pintura acrílica em parede',
        'Aplicação de pintura acrílica em duas demãos para parede interna.',
        'Pintura',
        'm²',
        'residencial',
        'aprovado',
        'sinapi_derivado',
        '["pintura parede","latex parede","duas demaos parede"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'pintura-acrilica-teto-m2',
        'Pintura acrílica em teto',
        'Aplicação de pintura acrílica em teto interno.',
        'Pintura',
        'm²',
        'residencial',
        'aprovado',
        'sinapi_derivado',
        '["pintura teto","latex teto","pintura forro"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"media"}'::jsonb
      ),
      (
        'contrapiso-cimentado-m2',
        'Contrapiso cimentado',
        'Execução de contrapiso cimentado com espessura residencial padrão.',
        'Pisos',
        'm²',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["contrapiso","regularizacao piso","base piso"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'assentamento-porcelanato-piso-m2',
        'Assentamento de porcelanato em piso',
        'Assentamento de porcelanato em piso com argamassa colante e rejunte.',
        'Pisos',
        'm²',
        'residencial',
        'aprovado',
        'sinapi_derivado',
        '["porcelanato piso","assentamento porcelanato","piso porcelanato"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'revestimento-ceramico-parede-m2',
        'Revestimento cerâmico em parede',
        'Assentamento de revestimento cerâmico em paredes de áreas molhadas.',
        'Revestimentos',
        'm²',
        'residencial',
        'aprovado',
        'sinapi_derivado',
        '["azulejo parede","revestimento parede","ceramica parede"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'forro-drywall-m2',
        'Forro em drywall',
        'Montagem e fechamento de forro em drywall.',
        'Forro e Drywall',
        'm²',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["forro drywall","gesso acartonado teto","forro gesso"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'parede-drywall-m2',
        'Parede em drywall',
        'Montagem de parede em drywall com estrutura metálica e placas.',
        'Forro e Drywall',
        'm²',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["parede drywall","divisoria drywall","gesso acartonado parede"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'impermeabilizacao-area-molhada-m2',
        'Impermeabilização de área molhada',
        'Impermeabilização de banheiros, cozinhas e áreas de serviço.',
        'Impermeabilização',
        'm²',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["impermeabilizacao","impermeabilizacao banheiro","manta liquida"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'ponto-eletrico-iluminacao-un',
        'Ponto elétrico de iluminação',
        'Execução completa de ponto elétrico para iluminação.',
        'Elétrica',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["ponto de luz","ponto iluminacao","instalacao iluminacao"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'ponto-eletrico-tomada-un',
        'Ponto elétrico de tomada',
        'Execução completa de ponto elétrico para tomada.',
        'Elétrica',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["ponto tomada","tomada","instalacao tomada"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'ponto-hidraulico-agua-fria-un',
        'Ponto hidráulico de água fria',
        'Execução completa de ponto hidráulico de água fria.',
        'Hidráulica',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["ponto agua fria","hidraulica agua","ponto de agua"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'ponto-hidraulico-esgoto-un',
        'Ponto hidráulico de esgoto',
        'Execução completa de ponto de esgoto sanitário.',
        'Hidráulica',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["ponto esgoto","hidraulica esgoto","esgoto sanitario"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"alta"}'::jsonb
      ),
      (
        'instalacao-bacia-sanitaria-un',
        'Instalação de bacia sanitária',
        'Instalação completa de vaso sanitário com acessórios.',
        'Louças e Metais',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["instalacao vaso","bacia sanitaria","vaso sanitario"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"media"}'::jsonb
      ),
      (
        'instalacao-lavatorio-un',
        'Instalação de lavatório',
        'Instalação completa de lavatório com fixação e ligação.',
        'Louças e Metais',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["instalacao lavatorio","pia banheiro","cuba banheiro"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"media"}'::jsonb
      ),
      (
        'instalacao-torneira-un',
        'Instalação de torneira',
        'Instalação e vedação de torneira para lavatório/cozinha.',
        'Louças e Metais',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["instalacao torneira","torneira","metais"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"media"}'::jsonb
      ),
      (
        'porta-interna-madeira-un',
        'Porta interna de madeira',
        'Fornecimento e instalação de porta interna de madeira.',
        'Esquadrias',
        'un',
        'residencial',
        'aprovado',
        'fornecedor',
        '["porta madeira","porta interna","esquadria madeira"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"media"}'::jsonb
      ),
      (
        'janela-aluminio-m2',
        'Janela de alumínio',
        'Fornecimento e instalação de esquadria de alumínio.',
        'Esquadrias',
        'm²',
        'residencial',
        'aprovado',
        'fornecedor',
        '["janela aluminio","esquadria aluminio","janela"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"media"}'::jsonb
      ),
      (
        'selador-acrilico-parede-m2',
        'Selador acrílico em parede',
        'Aplicação de selador acrílico para preparação de parede antes da pintura.',
        'Pintura',
        'm²',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["selador","fundo preparador","preparo pintura parede"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"media"}'::jsonb
      ),
      (
        'textura-acrilica-parede-m2',
        'Textura acrílica em parede',
        'Aplicação de textura acrílica decorativa em parede interna ou externa.',
        'Pintura',
        'm²',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["textura parede","grafiato leve","acabamento texturizado"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"media"}'::jsonb
      ),
      (
        'assentamento-ceramica-piso-m2',
        'Assentamento de cerâmica em piso',
        'Assentamento de piso cerâmico com argamassa colante e rejunte.',
        'Pisos',
        'm²',
        'residencial',
        'aprovado',
        'sinapi_derivado',
        '["piso ceramico","assentamento ceramica","ceramica piso"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"alta"}'::jsonb
      ),
      (
        'piso-vinilico-m2',
        'Piso vinílico',
        'Fornecimento e instalação de piso vinílico em manta ou régua.',
        'Pisos',
        'm²',
        'residencial',
        'aprovado',
        'fornecedor',
        '["vinilico","piso pvc","regua vinilica"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"media"}'::jsonb
      ),
      (
        'rodape-poliestireno-m',
        'Rodapé de poliestireno',
        'Fornecimento e instalação de rodapé de poliestireno.',
        'Acabamentos',
        'm',
        'residencial',
        'aprovado',
        'fornecedor',
        '["rodape","rodape branco","acabamento rodape"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"media"}'::jsonb
      ),
      (
        'soleira-granito-m',
        'Soleira de granito',
        'Fornecimento e instalação de soleira de granito para portas e transições.',
        'Pedras e Bancadas',
        'm',
        'residencial',
        'aprovado',
        'fornecedor',
        '["soleira granito","soleira pedra","acabamento porta granito"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"media"}'::jsonb
      ),
      (
        'bancada-granito-m',
        'Bancada de granito',
        'Fornecimento e instalação de bancada de granito para cozinha ou banheiro.',
        'Pedras e Bancadas',
        'm',
        'residencial',
        'aprovado',
        'fornecedor',
        '["bancada granito","pia granito","granito cozinha"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"media"}'::jsonb
      ),
      (
        'box-vidro-temperado-m2',
        'Box de vidro temperado',
        'Fornecimento e instalação de box de vidro temperado para banheiro.',
        'Esquadrias',
        'm²',
        'residencial',
        'aprovado',
        'fornecedor',
        '["box banheiro","vidro temperado banheiro","box vidro"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"media"}'::jsonb
      ),
      (
        'porta-pronta-lisa-un',
        'Porta pronta lisa',
        'Fornecimento e instalação de porta pronta lisa com ferragens básicas.',
        'Esquadrias',
        'un',
        'residencial',
        'aprovado',
        'fornecedor',
        '["porta pronta","kit porta","porta lisa"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"media"}'::jsonb
      ),
      (
        'pintura-esmalte-esquadria-m2',
        'Pintura esmalte em esquadria',
        'Pintura esmalte sintético em portas, portões e esquadrias metálicas ou de madeira.',
        'Pintura',
        'm²',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["esmalte sintetico","pintura porta","pintura esquadria"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"media"}'::jsonb
      ),
      (
        'impermeabilizacao-laje-m2',
        'Impermeabilização de laje',
        'Impermeabilização de laje exposta ou área técnica com manta ou membrana líquida.',
        'Impermeabilização',
        'm²',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["impermeabilizacao laje","manta laje","laje exposta"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"alta"}'::jsonb
      ),
      (
        'ponto-gas-glp-un',
        'Ponto de gás GLP',
        'Execução completa de ponto de gás residencial para fogão ou aquecedor.',
        'Gás',
        'un',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["ponto gas","gas glp","instalacao gas"]'::jsonb,
        '{"seed":"residencial_v2","prioridade":"media"}'::jsonb
      ),
      (
        'limpeza-pos-obra-m2',
        'Limpeza pós-obra',
        'Limpeza final para entrega da obra.',
        'Limpeza',
        'm²',
        'residencial',
        'aprovado',
        'composicao_propria',
        '["limpeza final","limpeza obra","entrega obra"]'::jsonb,
        '{"seed":"residencial_v1","prioridade":"media"}'::jsonb
      )
  ) AS t (
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
  metadados
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
      ('demolicao-piso-ceramico-m2', 'sinapi_direto', 'sinapi_composicoes', NULL, '97631', 'Demolição de piso cerâmico, manual', 'm²', NULL, NULL, 'Referência oficial SINAPI aderente ao serviço residencial.', 92, true, DATE '2026-03-01', 'PR', 'Curitiba'),
      ('demolicao-revestimento-parede-m2', 'sinapi_derivado', 'sinapi_composicoes', NULL, NULL, 'Base analítica de remoção de revestimento com adaptação residencial', 'm²', 1.000000, 'Conversão residencial por produtividade em parede revestida.', 'Usar como referência derivada até consolidar composição própria validada.', 78, true, DATE '2026-03-01', 'PR', 'Curitiba'),
      ('alvenaria-vedacao-bloco-ceramico-m2', 'sinapi_direto', 'sinapi_composicoes', NULL, '87492', 'Alvenaria de vedação em bloco cerâmico 9x19x19', 'm²', NULL, NULL, 'Referência oficial aderente para vedação residencial.', 93, true, DATE '2026-03-01', 'PR', 'Curitiba'),
      ('chapisco-parede-m2', 'sinapi_derivado', 'sinapi_composicoes', NULL, NULL, 'Base de chapisco derivada para parede residencial', 'm²', 1.000000, 'Consumo convertido para m² de parede interna.', 'Serviço com forte uso residencial e necessidade de conversão prática.', 80, true, DATE '2026-03-01', 'PR', 'Curitiba'),
      ('emboco-parede-m2', 'sinapi_derivado', 'sinapi_composicoes', NULL, NULL, 'Base de emboço derivada para parede residencial', 'm²', 1.000000, 'Conversão por espessura média de 20 mm.', 'Calibrar por espessura e regularidade da parede.', 80, true, DATE '2026-03-01', 'PR', 'Curitiba'),
      ('reboco-parede-m2', 'sinapi_derivado', 'sinapi_composicoes', NULL, NULL, 'Base de reboco derivada para parede residencial', 'm²', 1.000000, 'Conversão por espessura média e produtividade residencial.', 'Revisar conforme padrão de acabamento.', 82, true, DATE '2026-03-01', 'PR', 'Curitiba'),
      ('massa-corrida-pva-m2', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para massa corrida PVA', 'm²', 1.000000, NULL, 'Serviço residencial recorrente sem base oficial finalista aderente.', 86, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('pintura-acrilica-parede-m2', 'sinapi_derivado', 'sinapi_composicoes', NULL, NULL, 'Base de pintura acrílica em parede derivada para duas demãos', 'm²', 1.000000, 'Produtividade e consumo adaptados para parede interna.', 'Calibrar pela marca da tinta e preparação da base.', 84, true, DATE '2026-03-01', 'PR', 'Curitiba'),
      ('pintura-acrilica-teto-m2', 'sinapi_derivado', 'sinapi_composicoes', NULL, NULL, 'Base de pintura acrílica em teto derivada para duas demãos', 'm²', 1.000000, 'Conversão prática para teto interno.', 'Pode variar com acesso, altura e proteção.', 82, true, DATE '2026-03-01', 'PR', 'Curitiba'),
      ('contrapiso-cimentado-m2', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para contrapiso cimentado', 'm²', 1.000000, NULL, 'Valor-base operacional para regularização de piso.', 85, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('assentamento-porcelanato-piso-m2', 'sinapi_derivado', 'sinapi_composicoes', NULL, '87265', 'Revestimento cerâmico para piso com adaptação para porcelanato residencial', 'm²', 1.000000, 'Ajuste de insumo e produtividade para porcelanato.', 'Conferir padrão, dimensão e paginação.', 83, true, DATE '2026-03-01', 'PR', 'Curitiba'),
      ('revestimento-ceramico-parede-m2', 'sinapi_derivado', 'sinapi_composicoes', NULL, NULL, 'Base derivada para revestimento cerâmico em parede', 'm²', 1.000000, 'Conversão com consumo de argamassa e rejunte para parede.', 'Revisar pela dimensão da peça.', 83, true, DATE '2026-03-01', 'PR', 'Curitiba'),
      ('forro-drywall-m2', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para forro em drywall', 'm²', 1.000000, NULL, 'Serviço muito frequente em interiores residenciais.', 88, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('parede-drywall-m2', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para parede em drywall', 'm²', 1.000000, NULL, 'Serviço canônico para divisórias internas.', 88, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('impermeabilizacao-area-molhada-m2', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para impermeabilização de área molhada', 'm²', 1.000000, NULL, 'Aplicável a banheiros, lavabos, cozinhas e áreas de serviço.', 87, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('ponto-eletrico-iluminacao-un', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para ponto elétrico de iluminação', 'un', 1.000000, NULL, 'Inclui infraestrutura e mão de obra padrão.', 90, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('ponto-eletrico-tomada-un', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para ponto elétrico de tomada', 'un', 1.000000, NULL, 'Inclui infraestrutura e mão de obra padrão.', 90, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('ponto-hidraulico-agua-fria-un', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para ponto hidráulico de água fria', 'un', 1.000000, NULL, 'Base operacional residencial para água fria.', 90, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('ponto-hidraulico-esgoto-un', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para ponto hidráulico de esgoto', 'un', 1.000000, NULL, 'Base operacional residencial para esgoto sanitário.', 90, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('instalacao-bacia-sanitaria-un', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para instalação de bacia sanitária', 'un', 1.000000, NULL, 'Inclui fixação, ligação e vedação padrão.', 88, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('instalacao-lavatorio-un', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para instalação de lavatório', 'un', 1.000000, NULL, 'Inclui fixação e ligações básicas.', 88, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('instalacao-torneira-un', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para instalação de torneira', 'un', 1.000000, NULL, 'Serviço complementar de metais.', 86, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('porta-interna-madeira-un', 'fornecedor', NULL, NULL, NULL, 'Base de fornecedor para porta interna de madeira', 'un', 1.000000, NULL, 'Serviço fortemente dependente de fornecedor e padrão de ferragem.', 82, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('janela-aluminio-m2', 'fornecedor', NULL, NULL, NULL, 'Base de fornecedor para janela de alumínio', 'm²', 1.000000, NULL, 'Serviço fortemente dependente de projeto executivo e linha da esquadria.', 82, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('selador-acrilico-parede-m2', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para selador acrílico em parede', 'm²', 1.000000, NULL, 'Etapa preparatória antes da pintura final.', 84, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('textura-acrilica-parede-m2', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para textura acrílica em parede', 'm²', 1.000000, NULL, 'Acabamento decorativo com variação conforme tipo e padrão.', 82, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('assentamento-ceramica-piso-m2', 'sinapi_derivado', 'sinapi_composicoes', NULL, '87248', 'Base de assentamento de cerâmica para piso residencial', 'm²', 1.000000, 'Conversão prática para piso cerâmico residencial padrão.', 'Calibrar por dimensão da peça e paginação.', 84, true, DATE '2026-03-01', 'PR', 'Curitiba'),
      ('piso-vinilico-m2', 'fornecedor', NULL, NULL, NULL, 'Base de fornecedor para piso vinílico residencial', 'm²', 1.000000, NULL, 'Serviço dependente da linha do produto e preparação da base.', 80, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('rodape-poliestireno-m', 'fornecedor', NULL, NULL, NULL, 'Base de fornecedor para rodapé de poliestireno', 'm', 1.000000, NULL, 'Serviço complementar de acabamento linear.', 81, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('soleira-granito-m', 'fornecedor', NULL, NULL, NULL, 'Base de fornecedor para soleira de granito', 'm', 1.000000, NULL, 'Serviço dependente da espessura e acabamento da pedra.', 81, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('bancada-granito-m', 'fornecedor', NULL, NULL, NULL, 'Base de fornecedor para bancada de granito', 'm', 1.000000, NULL, 'Considerar espessura, recortes e frontão.', 80, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('box-vidro-temperado-m2', 'fornecedor', NULL, NULL, NULL, 'Base de fornecedor para box de vidro temperado', 'm²', 1.000000, NULL, 'Depende da ferragem, espessura e acabamento do vidro.', 82, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('porta-pronta-lisa-un', 'fornecedor', NULL, NULL, NULL, 'Base de fornecedor para porta pronta lisa', 'un', 1.000000, NULL, 'Considerar ferragens, batente e guarnições.', 82, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('pintura-esmalte-esquadria-m2', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para pintura esmalte em esquadria', 'm²', 1.000000, NULL, 'Pode incluir fundo anticorrosivo ou preparador conforme base.', 83, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('impermeabilizacao-laje-m2', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para impermeabilização de laje', 'm²', 1.000000, NULL, 'Aplicável a lajes expostas, técnicas ou coberturas acessíveis.', 86, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('ponto-gas-glp-un', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para ponto de gás GLP', 'un', 1.000000, NULL, 'Base operacional para instalação de gás residencial.', 85, true, DATE '2026-04-01', 'PR', 'Curitiba'),
      ('limpeza-pos-obra-m2', 'composicao_propria', NULL, NULL, NULL, 'Composição própria EVIS para limpeza pós-obra', 'm²', 1.000000, NULL, 'Serviço final de entrega e preparação do imóvel.', 84, true, DATE '2026-04-01', 'PR', 'Curitiba')
  ) AS t (
    slug,
    fonte,
    tabela_origem,
    chave_origem,
    codigo_origem,
    descricao_origem,
    unidade_origem,
    fator_conversao,
    formula_conversao,
    observacoes,
    confianca,
    principal,
    competencia_ref,
    uf,
    cidade
  )
)
INSERT INTO public.servicos_referencia_origem (
  catalogo_servico_id,
  fonte,
  tabela_origem,
  chave_origem,
  codigo_origem,
  descricao_origem,
  unidade_origem,
  fator_conversao,
  formula_conversao,
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
  r.chave_origem,
  r.codigo_origem,
  r.descricao_origem,
  r.unidade_origem,
  r.fator_conversao,
  r.formula_conversao,
  r.observacoes,
  r.confianca,
  r.principal,
  r.competencia_ref,
  r.uf,
  r.cidade
FROM referencias_seed r
JOIN public.catalogo_servicos_evis c
  ON c.slug = r.slug
WHERE NOT EXISTS (
  SELECT 1
  FROM public.servicos_referencia_origem existing
  WHERE existing.catalogo_servico_id = c.id
    AND existing.fonte = r.fonte
    AND coalesce(existing.codigo_origem, '') = coalesce(r.codigo_origem, '')
    AND existing.principal = r.principal
);

WITH precos_seed AS (
  SELECT *
  FROM (
    VALUES
      ('demolicao-piso-ceramico-m2', 'manual', 18.50, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('demolicao-revestimento-parede-m2', 'manual', 24.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('alvenaria-vedacao-bloco-ceramico-m2', 'manual', 85.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('chapisco-parede-m2', 'manual', 12.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('emboco-parede-m2', 'manual', 34.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('reboco-parede-m2', 'manual', 38.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('massa-corrida-pva-m2', 'manual', 16.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('pintura-acrilica-parede-m2', 'manual', 22.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('pintura-acrilica-teto-m2', 'manual', 20.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('contrapiso-cimentado-m2', 'manual', 36.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('assentamento-porcelanato-piso-m2', 'manual', 95.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('revestimento-ceramico-parede-m2', 'manual', 78.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('forro-drywall-m2', 'manual', 115.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('parede-drywall-m2', 'manual', 145.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('impermeabilizacao-area-molhada-m2', 'manual', 58.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('ponto-eletrico-iluminacao-un', 'manual', 185.00, 'un', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('ponto-eletrico-tomada-un', 'manual', 165.00, 'un', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('ponto-hidraulico-agua-fria-un', 'manual', 210.00, 'un', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('ponto-hidraulico-esgoto-un', 'manual', 245.00, 'un', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('instalacao-bacia-sanitaria-un', 'manual', 380.00, 'un', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('instalacao-lavatorio-un', 'manual', 290.00, 'un', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('instalacao-torneira-un', 'manual', 95.00, 'un', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('porta-interna-madeira-un', 'manual', 650.00, 'un', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('janela-aluminio-m2', 'manual', 980.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.'),
      ('selador-acrilico-parede-m2', 'manual', 8.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('textura-acrilica-parede-m2', 'manual', 32.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('assentamento-ceramica-piso-m2', 'manual', 72.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('piso-vinilico-m2', 'manual', 98.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('rodape-poliestireno-m', 'manual', 28.00, 'm', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('soleira-granito-m', 'manual', 85.00, 'm', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('bancada-granito-m', 'manual', 420.00, 'm', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('box-vidro-temperado-m2', 'manual', 480.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('porta-pronta-lisa-un', 'manual', 780.00, 'un', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('pintura-esmalte-esquadria-m2', 'manual', 28.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('impermeabilizacao-laje-m2', 'manual', 78.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('ponto-gas-glp-un', 'manual', 260.00, 'un', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v2', 'Preço-base inicial para calibragem.'),
      ('limpeza-pos-obra-m2', 'manual', 12.00, 'm²', DATE '2026-04-01', 'PR', 'Curitiba', 'Seed EVIS Residencial v1', 'Preço-base inicial para calibragem.')
  ) AS t (
    slug,
    tipo_preco,
    valor_unitario,
    unidade,
    competencia,
    uf,
    cidade,
    fonte_nome,
    observacoes
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
  p.uf,
  p.cidade,
  p.fonte_nome,
  p.observacoes,
  75
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

-- Validacao rapida:
-- SELECT COUNT(*) AS total_catalogo FROM public.catalogo_servicos_evis;
-- SELECT COUNT(*) AS total_view FROM public.vw_referencias_servicos_evis;
-- SELECT categoria, COUNT(*) FROM public.catalogo_servicos_evis GROUP BY categoria ORDER BY categoria;
-- SELECT slug, nome, origem_referencia, valor_unitario_referencia
-- FROM public.vw_referencias_servicos_evis
-- ORDER BY nome
-- LIMIT 20;
