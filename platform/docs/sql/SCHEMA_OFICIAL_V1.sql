-- ============================================
-- SCHEMA OFICIAL DO EVIS AI - VERSÃO 1.0
-- ============================================
-- Data: 2026-04-15
-- Fonte: Mapeamento real do Supabase
-- Status: PRODUÇÃO
-- ============================================

-- TABELA: obras
-- Descrição: Cadastro de obras/projetos
-- ============================================
CREATE TABLE IF NOT EXISTS public.obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cliente TEXT,
  status TEXT DEFAULT 'ATIVA',
  data_inicio DATE,
  data_fim DATE,
  descricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.obras IS 'Cadastro principal de obras/projetos';
COMMENT ON COLUMN public.obras.status IS 'Status: ATIVA, PAUSADA, CONCLUIDA, CANCELADA';

-- ============================================
-- TABELA: servicos
-- Descrição: Serviços/atividades da obra
-- ============================================
CREATE TABLE IF NOT EXISTS public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
  id_servico TEXT NOT NULL,
  nome TEXT NOT NULL,
  categoria TEXT,
  avanco_atual INTEGER DEFAULT 0,
  status TEXT DEFAULT 'nao_iniciado',
  equipe TEXT,
  responsavel TEXT,
  data_prevista DATE,
  data_conclusao DATE,
  aliases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.servicos IS 'Serviços e atividades da obra com controle de avanço';
COMMENT ON COLUMN public.servicos.status IS 'Status: nao_iniciado, em_andamento, concluido, pausado';
COMMENT ON COLUMN public.servicos.equipe IS 'Código da equipe responsável (FK soft para equipes_cadastro.cod)';
COMMENT ON COLUMN public.servicos.avanco_atual IS 'Percentual de conclusão (0-100)';
COMMENT ON COLUMN public.servicos.aliases IS 'Termos alternativos para reconhecimento por IA';

-- ============================================
-- TABELA: equipes_cadastro
-- Descrição: Cadastro de equipes/fornecedores
-- ============================================
CREATE TABLE IF NOT EXISTS public.equipes_cadastro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
  cod TEXT NOT NULL,
  nome TEXT NOT NULL,
  funcao TEXT,
  telefone TEXT,
  email TEXT,
  pix TEXT,
  contato TEXT,
  obs_obras TEXT,
  status TEXT,
  ativo BOOLEAN DEFAULT true,
  aliases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.equipes_cadastro IS 'Cadastro de equipes, fornecedores e prestadores de serviço';
COMMENT ON COLUMN public.equipes_cadastro.cod IS 'Código único da equipe (ex: EQ-OBR-01)';
COMMENT ON COLUMN public.equipes_cadastro.aliases IS 'Apelidos e variações do nome para reconhecimento';

-- Constraint: cod único por obra
CREATE UNIQUE INDEX IF NOT EXISTS idx_equipes_obra_cod
  ON public.equipes_cadastro(obra_id, cod);

-- ============================================
-- TABELA: equipes_presenca
-- Descrição: Registro de presença diária das equipes
-- ============================================
CREATE TABLE IF NOT EXISTS public.equipes_presenca (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
  equipe_cod TEXT NOT NULL,
  data_presenca DATE NOT NULL,
  quantidade INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.equipes_presenca IS 'Controle de presença diária das equipes';
COMMENT ON COLUMN public.equipes_presenca.equipe_cod IS 'Código da equipe (FK soft para equipes_cadastro.cod)';
COMMENT ON COLUMN public.equipes_presenca.quantidade IS 'Número de pessoas da equipe presentes';

-- Constraint: uma presença por equipe por dia
CREATE UNIQUE INDEX IF NOT EXISTS idx_presenca_unica
  ON public.equipes_presenca(obra_id, equipe_cod, data_presenca);

-- ============================================
-- TABELA: diario_obra
-- Descrição: Diário de obra com narrativas
-- ============================================
CREATE TABLE IF NOT EXISTS public.diario_obra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
  transcricao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.diario_obra IS 'Registro cronológico de narrativas da obra';
COMMENT ON COLUMN public.diario_obra.transcricao IS 'Narrativa bruta ou processada do dia';

-- ============================================
-- TABELA: notas
-- Descrição: Notas, observações e alertas
-- ============================================
CREATE TABLE IF NOT EXISTS public.notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID NOT NULL REFERENCES public.obras(id) ON DELETE CASCADE,
  tipo TEXT,
  texto TEXT,
  autor TEXT,
  data_nota TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.notas IS 'Notas, observações e alertas gerais da obra';
COMMENT ON COLUMN public.notas.tipo IS 'Tipo: observacao, alerta, importante, etc';

-- ============================================
-- TABELA: pendencias
-- Descrição: Gestão de pendências
-- ============================================
CREATE TABLE IF NOT EXISTS public.pendencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  prioridade TEXT DEFAULT 'media',
  status TEXT DEFAULT 'ABERTA',
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.pendencias IS 'Controle de pendências e ações necessárias';
COMMENT ON COLUMN public.pendencias.prioridade IS 'Prioridade: baixa, media, alta, critica';
COMMENT ON COLUMN public.pendencias.status IS 'Status: ABERTA, EM_ANDAMENTO, RESOLVIDA, CANCELADA';

-- ============================================
-- TABELA: fotos
-- Descrição: Registro fotográfico da obra
-- ============================================
CREATE TABLE IF NOT EXISTS public.fotos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id UUID REFERENCES public.obras(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  ambiente TEXT,
  legenda TEXT,
  data_foto TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

COMMENT ON TABLE public.fotos IS 'Registro fotográfico com categorização por ambiente';
COMMENT ON COLUMN public.fotos.url IS 'URL da imagem (ImgBB ou Supabase Storage)';
COMMENT ON COLUMN public.fotos.ambiente IS 'Ambiente/local da foto (ex: Sala, Cozinha, Fachada)';

-- ============================================
-- TABELA: alias_conhecimento
-- Descrição: Base de conhecimento de aliases globais
-- ============================================
CREATE TABLE IF NOT EXISTS public.alias_conhecimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT NOT NULL,
  categoria TEXT NOT NULL,
  tipo TEXT DEFAULT 'servico' NOT NULL,
  confianca DOUBLE PRECISION DEFAULT 0.80 NOT NULL,
  exemplos TEXT[] DEFAULT '{}'
);

COMMENT ON TABLE public.alias_conhecimento IS 'Base global de aliases para reconhecimento de entidades por IA';
COMMENT ON COLUMN public.alias_conhecimento.tipo IS 'Tipo: servico, equipe, material, etc';
COMMENT ON COLUMN public.alias_conhecimento.confianca IS 'Score de confiança para resolução (0.0-1.0)';
COMMENT ON COLUMN public.alias_conhecimento.exemplos IS 'Exemplos de uso em contexto';

-- Constraint: alias único por categoria
CREATE UNIQUE INDEX IF NOT EXISTS idx_alias_categoria
  ON public.alias_conhecimento(alias, categoria);

-- ============================================
-- ÍNDICES DE PERFORMANCE
-- ============================================

-- Busca por obra
CREATE INDEX IF NOT EXISTS idx_servicos_obra ON public.servicos(obra_id);
CREATE INDEX IF NOT EXISTS idx_equipes_obra ON public.equipes_cadastro(obra_id);
CREATE INDEX IF NOT EXISTS idx_presenca_obra ON public.equipes_presenca(obra_id);
CREATE INDEX IF NOT EXISTS idx_diario_obra ON public.diario_obra(obra_id);
CREATE INDEX IF NOT EXISTS idx_notas_obra ON public.notas(obra_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_obra ON public.pendencias(obra_id);
CREATE INDEX IF NOT EXISTS idx_fotos_obra ON public.fotos(obra_id);

-- Busca por data
CREATE INDEX IF NOT EXISTS idx_presenca_data ON public.equipes_presenca(data_presenca);
CREATE INDEX IF NOT EXISTS idx_fotos_data ON public.fotos(data_foto);

-- Busca por status
CREATE INDEX IF NOT EXISTS idx_servicos_status ON public.servicos(status);
CREATE INDEX IF NOT EXISTS idx_pendencias_status ON public.pendencias(status);

-- Full-text search (preparação futura)
-- CREATE INDEX IF NOT EXISTS idx_alias_fts ON public.alias_conhecimento USING gin(to_tsvector('portuguese', alias));

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- NOTA: RLS deve ser configurado em ambiente de produção
-- Por ora, acesso é controlado via anon key do Supabase
--
-- Exemplo de política básica:
-- ALTER TABLE public.obras ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Acesso autenticado" ON public.obras
--   FOR ALL USING (auth.role() = 'authenticated');
-- ============================================

-- ============================================
-- VERSÃO E METADADOS
-- ============================================
CREATE TABLE IF NOT EXISTS public._schema_version (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ DEFAULT now(),
  description TEXT
);

INSERT INTO public._schema_version (version, description)
VALUES ('1.0.0', 'Schema inicial documentado - mapeamento real Supabase 2026-04-15')
ON CONFLICT (version) DO NOTHING;

-- ============================================
-- FIM DO SCHEMA OFICIAL V1.0
-- ============================================
