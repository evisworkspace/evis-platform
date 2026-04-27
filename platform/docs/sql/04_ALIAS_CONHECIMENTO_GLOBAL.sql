-- ================================================================
-- ALIAS_CONHECIMENTO GLOBAL — EVIS AI
-- Tabela de conhecimento semântico sem escopo de obra.
-- Um alias aponta para uma categoria; a Camada 3 do orchestrator
-- usa a categoria para localizar o serviço ou equipe na obra atual.
-- ================================================================

-- ── DDL ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.alias_conhecimento (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  alias      TEXT    NOT NULL,
  categoria  TEXT    NOT NULL,  -- ex: 'Marcenaria', 'Elétrica', 'PPCI'
  tipo       TEXT    NOT NULL DEFAULT 'servico', -- 'servico' | 'equipe'
  confianca  FLOAT   NOT NULL DEFAULT 0.80,
  exemplos   TEXT[]  DEFAULT '{}'  -- contexto de auditoria
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_alias_conhecimento_alias_tipo
  ON public.alias_conhecimento(alias, tipo);

CREATE INDEX IF NOT EXISTS idx_alias_conhecimento_categoria
  ON public.alias_conhecimento(categoria);

-- RLS: leitura pública, escrita restrita ao service_role
ALTER TABLE public.alias_conhecimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alias_conhecimento_select_all"
  ON public.alias_conhecimento FOR SELECT USING (true);

CREATE POLICY "alias_conhecimento_insert_service"
  ON public.alias_conhecimento FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "alias_conhecimento_update_service"
  ON public.alias_conhecimento FOR UPDATE
  USING (auth.role() = 'service_role');

-- ── SEED — SERVIÇOS ──────────────────────────────────────────────

INSERT INTO public.alias_conhecimento (alias, categoria, tipo, confianca, exemplos)
VALUES

-- Administração / Vistoria
('vistoria',           'Administração', 'servico', 0.80, ARRAY['vistoria final', 'aprovação final']),
('aprovação',          'Administração', 'servico', 0.75, ARRAY['aprovação de obra', 'vistoria final']),
('entrega de obra',    'Administração', 'servico', 0.80, ARRAY['entrega final', 'vistoria de entrega']),

-- Ar-condicionado
('ar condicionado',    'Ar-condicionado', 'servico', 0.90, ARRAY['ac', 'climatização']),
('ac',                 'Ar-condicionado', 'servico', 0.90, ARRAY['ar condicionado']),
('climatização',       'Ar-condicionado', 'servico', 0.85, ARRAY['ar condicionado', 'ac']),
('infra ac',           'Ar-condicionado', 'servico', 0.85, ARRAY['infraestrutura de drenos', 'infra do ar']),
('infra do ar',        'Ar-condicionado', 'servico', 0.85, ARRAY['infra ac', 'tubulação do ar']),
('drenos ac',          'Ar-condicionado', 'servico', 0.85, ARRAY['drenos do ar condicionado']),
('tubulação do ar',    'Ar-condicionado', 'servico', 0.80, ARRAY['infra ac']),
('instalação do ar',   'Ar-condicionado', 'servico', 0.85, ARRAY['colocar ar', 'equipamento ac']),
('colocar ar',         'Ar-condicionado', 'servico', 0.80, ARRAY['instalação do ar', 'cassete']),
('cassete',            'Ar-condicionado', 'servico', 0.80, ARRAY['fancoil', 'equipamento ac']),
('fancoil',            'Ar-condicionado', 'servico', 0.80, ARRAY['cassete', 'instalação do ar']),
('equipamento ac',     'Ar-condicionado', 'servico', 0.80, ARRAY['cassete', 'fancoil']),
('acabamentos ac',     'Ar-condicionado', 'servico', 0.80, ARRAY['acabamento do ar']),
('acabamento do ar',   'Ar-condicionado', 'servico', 0.80, ARRAY['acabamentos ac']),
('desmontar duto',     'Ar-condicionado', 'servico', 0.80, ARRAY['desmontagem de duto']),
('desmontagem de duto','Ar-condicionado', 'servico', 0.80, ARRAY['desmontar duto']),
('câmara fria',        'Ar-condicionado', 'servico', 0.80, ARRAY['rede frigorífica']),
('rede frigorífica',   'Ar-condicionado', 'servico', 0.80, ARRAY['câmara fria', 'frigorífico']),
('frigorífico',        'Ar-condicionado', 'servico', 0.80, ARRAY['câmara fria', 'rede frigorífica']),

-- Demolições
('demolição',          'Demolições', 'servico', 0.90, ARRAY['quebra', 'retirada']),
('quebra',             'Demolições', 'servico', 0.85, ARRAY['demolição', 'quebrar parede']),
('retirada',           'Demolições', 'servico', 0.80, ARRAY['demolição', 'remover']),
('quebrar parede',     'Demolições', 'servico', 0.90, ARRAY['abrir parede', 'demolição de parede']),
('abrir parede',       'Demolições', 'servico', 0.90, ARRAY['quebrar parede']),
('quebrar teto',       'Demolições', 'servico', 0.90, ARRAY['abrir teto', 'demolição de teto']),
('tirar piso',         'Demolições', 'servico', 0.85, ARRAY['retirar cerâmica', 'demolição de piso']),
('retirar cerâmica',   'Demolições', 'servico', 0.85, ARRAY['tirar piso']),

-- Drywall / Forro
('forro',              'Drywall / Forro', 'servico', 0.85, ARRAY['teto', 'gesso acartonado']),
('teto falso',         'Drywall / Forro', 'servico', 0.85, ARRAY['forro', 'drywall']),
('drywall',            'Drywall / Forro', 'servico', 0.90, ARRAY['gesso acartonado', 'parede seca']),
('forro de gesso',     'Drywall / Forro', 'servico', 0.85, ARRAY['forro', 'gesso acartonado']),
('gesso acartonado',   'Drywall / Forro', 'servico', 0.85, ARRAY['drywall', 'forro de gesso']),
('tarugamento',        'Drywall / Forro', 'servico', 0.85, ARRAY['estrutura do forro', 'aramação']),
('estrutura do forro', 'Drywall / Forro', 'servico', 0.80, ARRAY['tarugamento', 'aramação do forro']),
('fechamento do forro','Drywall / Forro', 'servico', 0.85, ARRAY['placas do forro', 'forro de gesso']),

-- Elétrica
('elétrica',           'Elétrica', 'servico', 0.90, ARRAY['instalação elétrica', 'infra elétrica']),
('instalação elétrica','Elétrica', 'servico', 0.90, ARRAY['elétrica', 'fiação']),
('infra elétrica',     'Elétrica', 'servico', 0.85, ARRAY['tubulação elétrica', 'eletrocalha']),
('tubulação elétrica', 'Elétrica', 'servico', 0.85, ARRAY['infra elétrica', 'eletroduto']),
('eletrocalha',        'Elétrica', 'servico', 0.85, ARRAY['tubulação elétrica', 'eletroduto']),
('eletroduto',         'Elétrica', 'servico', 0.85, ARRAY['tubulação elétrica', 'eletrocalha']),
('fiação',             'Elétrica', 'servico', 0.85, ARRAY['instalação elétrica', 'cabeamento']),
('acabamento elétrico','Elétrica', 'servico', 0.85, ARRAY['tomadas', 'interruptores', 'luminárias']),
('tomadas',            'Elétrica', 'servico', 0.80, ARRAY['acabamento elétrico', 'pontos elétricos']),
('interruptores',      'Elétrica', 'servico', 0.80, ARRAY['acabamento elétrico', 'tomadas']),
('luminárias',         'Elétrica', 'servico', 0.80, ARRAY['iluminação', 'acabamento elétrico']),
('pontos elétricos',   'Elétrica', 'servico', 0.80, ARRAY['tomadas', 'interruptores']),
('quadro elétrico',    'Elétrica', 'servico', 0.90, ARRAY['qd', 'disjuntor', 'quadro de distribuição']),
('qd',                 'Elétrica', 'servico', 0.85, ARRAY['quadro elétrico', 'quadro de distribuição']),
('disjuntor',          'Elétrica', 'servico', 0.80, ARRAY['quadro elétrico', 'qd']),

-- Limpeza
('limpeza',            'Limpeza', 'servico', 0.90, ARRAY['limpeza final', 'limpeza pós-obra']),
('limpeza final',      'Limpeza', 'servico', 0.90, ARRAY['limpeza pós-obra', 'limpeza de entrega']),
('limpeza pós-obra',   'Limpeza', 'servico', 0.90, ARRAY['limpeza final', 'limpeza de entrega']),
('limpeza de entrega', 'Limpeza', 'servico', 0.85, ARRAY['limpeza final']),
('faxina',             'Limpeza', 'servico', 0.80, ARRAY['limpeza', 'limpeza geral']),

-- Marcenaria
('marcenaria',         'Marcenaria', 'servico', 0.90, ARRAY['móveis', 'mobiliário planejado']),
('marceneiro',         'Marcenaria', 'servico', 0.90, ARRAY['marcenaria', 'móveis']),
('marceneiros',        'Marcenaria', 'servico', 0.90, ARRAY['marcenaria', 'equipe de marcenaria']),
('móveis',             'Marcenaria', 'servico', 0.85, ARRAY['mobiliário', 'marcenaria']),
('mobiliário',         'Marcenaria', 'servico', 0.85, ARRAY['móveis', 'mobiliário planejado']),
('mobiliário planejado','Marcenaria','servico', 0.85, ARRAY['móveis', 'marcenaria']),
('armários',           'Marcenaria', 'servico', 0.80, ARRAY['marcenaria', 'móveis planejados']),
('prateleiras',        'Marcenaria', 'servico', 0.75, ARRAY['marcenaria', 'armários']),
('forro de madeira',   'Marcenaria', 'servico', 0.85, ARRAY['lambri', 'madeira no teto']),
('lambri',             'Marcenaria', 'servico', 0.90, ARRAY['forro de madeira', 'revestimento de madeira']),
('madeira no teto',    'Marcenaria', 'servico', 0.80, ARRAY['forro de madeira', 'lambri']),

-- Pintura
('pintura',            'Pintura', 'servico', 0.90, ARRAY['tinta', 'pintura final']),
('tinta',              'Pintura', 'servico', 0.85, ARRAY['pintura', 'demão']),
('massa corrida',      'Pintura', 'servico', 0.90, ARRAY['emassamento', 'preparo da parede']),
('emassamento',        'Pintura', 'servico', 0.90, ARRAY['massa corrida', 'lixamento']),
('lixamento',          'Pintura', 'servico', 0.85, ARRAY['emassamento', 'preparo da parede']),
('preparo da parede',  'Pintura', 'servico', 0.85, ARRAY['emassamento', 'lixamento']),
('pintura final',      'Pintura', 'servico', 0.90, ARRAY['última mão', 'acabamento de pintura']),
('última mão',         'Pintura', 'servico', 0.85, ARRAY['pintura final', 'acabamento de pintura']),
('primeira mão',       'Pintura', 'servico', 0.85, ARRAY['1ª mão', 'primera demão']),
('1ª mão',             'Pintura', 'servico', 0.85, ARRAY['primeira mão', 'primera demão']),
('segunda mão',        'Pintura', 'servico', 0.85, ARRAY['2ª mão', 'última mão']),
('demão de pintura',   'Pintura', 'servico', 0.85, ARRAY['mão de tinta', 'primeira mão']),

-- PPCI / Incêndio
('ppci',               'PPCI', 'servico', 0.95, ARRAY['incêndio', 'combate a incêndio']),
('incêndio',           'PPCI', 'servico', 0.85, ARRAY['ppci', 'combate a incêndio']),
('combate a incêndio', 'PPCI', 'servico', 0.85, ARRAY['ppci', 'incêndio']),
('sprinkler',          'PPCI', 'servico', 0.90, ARRAY['ppci', 'chuveiro automático']),
('hidrante',           'PPCI', 'servico', 0.90, ARRAY['ppci', 'combate a incêndio']),
('estrutura ppci',     'PPCI', 'servico', 0.85, ARRAY['estalonamento', 'suporte ppci']),
('estalonamento',      'PPCI', 'servico', 0.85, ARRAY['estrutura ppci', 'ppci']),
('detector de fumaça', 'PPCI', 'servico', 0.90, ARRAY['ppci', 'alarme de incêndio']),
('pontos de incêndio', 'PPCI', 'servico', 0.85, ARRAY['ppci', 'instalação ppci']),

-- Preliminares
('mobilização',        'Preliminares', 'servico', 0.85, ARRAY['canteiro de obras', 'início de obra']),
('canteiro de obras',  'Preliminares', 'servico', 0.85, ARRAY['mobilização', 'montagem do canteiro']),
('tapume',             'Preliminares', 'servico', 0.90, ARRAY['isolamento de obra', 'proteção']),
('isolamento de obra', 'Preliminares', 'servico', 0.85, ARRAY['tapume', 'proteção']),
('proteção de piso',   'Preliminares', 'servico', 0.85, ARRAY['tapume', 'proteção de esquadrias']),
('desmobilização',     'Preliminares', 'servico', 0.85, ARRAY['retirada de andaimes', 'fim de obra']),

-- Revestimento
('porcelanato',        'Revestimento', 'servico', 0.90, ARRAY['assentamento porcelanato', 'piso']),
('assentamento porcelanato', 'Revestimento', 'servico', 0.90, ARRAY['colocar porcelanato', 'piso']),
('colocar porcelanato','Revestimento', 'servico', 0.85, ARRAY['assentamento porcelanato']),
('azulejo',            'Revestimento', 'servico', 0.85, ARRAY['cerâmica', 'revestimento cerâmico']),
('cerâmica',           'Revestimento', 'servico', 0.85, ARRAY['azulejo', 'revestimento cerâmico']),
('rejunte',            'Revestimento', 'servico', 0.85, ARRAY['rejuntamento', 'porcelanato']),
('argamassa',          'Revestimento', 'servico', 0.75, ARRAY['assentamento', 'reboco'])

ON CONFLICT (alias, tipo) DO UPDATE
  SET categoria = EXCLUDED.categoria,
      confianca  = EXCLUDED.confianca,
      exemplos   = EXCLUDED.exemplos;

-- ── SEED — EQUIPES ───────────────────────────────────────────────

INSERT INTO public.alias_conhecimento (alias, categoria, tipo, confianca, exemplos)
VALUES

-- Ar-condicionado (equipe)
('equipe do ar',       'Ar-condicionado', 'equipe', 0.85, ARRAY['pessoal do ar', 'ademarcos']),
('pessoal do ar',      'Ar-condicionado', 'equipe', 0.85, ARRAY['equipe do ar', 'equipe de ac']),
('equipe de ac',       'Ar-condicionado', 'equipe', 0.85, ARRAY['equipe do ar']),
('refrigeração',       'Ar-condicionado', 'equipe', 0.80, ARRAY['frigorífico', 'câmara fria']),

-- Civil / Estrutural
('pedreiros',          'Civil', 'equipe', 0.90, ARRAY['equipe civil', 'empreiteiro civil']),
('equipe civil',       'Civil', 'equipe', 0.90, ARRAY['pedreiros', 'empreiteiro']),
('empreiteiro civil',  'Civil', 'equipe', 0.85, ARRAY['pedreiros', 'empreiteiro']),
('pessoal da obra',    'Civil', 'equipe', 0.80, ARRAY['pedreiros', 'equipe civil']),

-- Elétrica (equipe)
('eletricistas',       'Elétrica', 'equipe', 0.90, ARRAY['equipe elétrica', 'pessoal da elétrica']),
('equipe elétrica',    'Elétrica', 'equipe', 0.90, ARRAY['eletricistas', 'pessoal da elétrica']),
('pessoal da elétrica','Elétrica', 'equipe', 0.85, ARRAY['eletricistas', 'time da elétrica']),
('time da elétrica',   'Elétrica', 'equipe', 0.85, ARRAY['equipe elétrica', 'eletricistas']),
('os da elétrica',     'Elétrica', 'equipe', 0.85, ARRAY['equipe elétrica', 'eletricistas']),

-- Limpeza (equipe)
('equipe de limpeza',  'Limpeza', 'equipe', 0.90, ARRAY['pessoal da limpeza', 'faxineiros']),
('pessoal da limpeza', 'Limpeza', 'equipe', 0.85, ARRAY['equipe de limpeza', 'faxineiros']),
('faxineiros',         'Limpeza', 'equipe', 0.85, ARRAY['equipe de limpeza', 'limpadores']),
('limpadores',         'Limpeza', 'equipe', 0.80, ARRAY['equipe de limpeza', 'faxineiros']),

-- Marcenaria (equipe)
('equipe de marcenaria','Marcenaria', 'equipe', 0.90, ARRAY['marceneiros', 'pessoal da marcenaria']),
('pessoal da marcenaria','Marcenaria','equipe', 0.85, ARRAY['marceneiros', 'equipe de marcenaria']),
('os da marcenaria',   'Marcenaria', 'equipe', 0.85, ARRAY['marceneiros', 'equipe de marcenaria']),
('time de marcenaria', 'Marcenaria', 'equipe', 0.85, ARRAY['marceneiros', 'equipe de marcenaria']),

-- PPCI (equipe)
('equipe ppci',        'PPCI', 'equipe', 0.90, ARRAY['pessoal do ppci', 'bombeiros civis']),
('pessoal do ppci',    'PPCI', 'equipe', 0.85, ARRAY['equipe ppci']),

-- Som / AV
('equipe de som',      'Som', 'equipe', 0.90, ARRAY['pessoal do som', 'sonorização']),
('pessoal do som',     'Som', 'equipe', 0.85, ARRAY['equipe de som', 'sonorização']),
('sonorização',        'Som', 'equipe', 0.80, ARRAY['som', 'áudio'])

ON CONFLICT (alias, tipo) DO UPDATE
  SET categoria = EXCLUDED.categoria,
      confianca  = EXCLUDED.confianca,
      exemplos   = EXCLUDED.exemplos;

-- ── VERIFICAÇÃO ──────────────────────────────────────────────────
SELECT tipo, categoria, COUNT(*) AS total
FROM public.alias_conhecimento
GROUP BY tipo, categoria
ORDER BY tipo, categoria;
