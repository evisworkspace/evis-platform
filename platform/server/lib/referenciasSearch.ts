import { createClient } from '@supabase/supabase-js';
import { getServerEnv, loadServerEnv } from './serverEnv';

loadServerEnv();

export const supabase = createClient(
  getServerEnv('SUPABASE_URL', ['VITE_SUPABASE_URL']) || '',
  getServerEnv('SUPABASE_SERVICE_ROLE_KEY', ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY']) || ''
);

export type ReferenciaBusca = {
  codigo: string;
  descricao: string;
  unidade: string | null;
  custo_referencia: string | null;
  origem: 'catalogo_evis' | 'sinapi';
  origem_detalhe: string | null;
  competencia: string | null;
  fonte_preco: string | null;
  confianca: number | null;
};

export function parseLimit(rawLimit: unknown): number {
  const parsed = Number.parseInt(String(rawLimit || '8'), 10);
  if (Number.isNaN(parsed)) {
    return 8;
  }
  return Math.min(Math.max(parsed, 1), 20);
}

export function formatCurrency(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : null;
}

function normalizarBuscaLivre(termo: string): string {
  return termo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function buildSearchPatterns(termo: string) {
  const raw = termo.trim().toLowerCase().replace(/\s+/g, ' ');
  const normalized = normalizarBuscaLivre(termo).replace(/\s+/g, ' ');
  const rawTokens = raw.split(/[\s-]+/).filter(Boolean);
  const normalizedTokens = normalized.split(/[\s-]+/).filter(Boolean);

  return {
    nome: Array.from(new Set([`%${raw}%`, `%${rawTokens.join('%')}%`])),
    descricao: Array.from(new Set([`%${raw}%`, `%${rawTokens.join('%')}%`])),
    slug: Array.from(new Set([`%${normalized}%`, `%${normalizedTokens.join('%')}%`])),
  };
}

function buildSinapiSearchCandidates(termo: string): string[] {
  const raw = termo.trim();
  const normalized = normalizarBuscaLivre(termo);
  const candidates = new Set<string>();

  if (normalized.includes('concreto') && normalized.includes('25')) {
    candidates.add('concreto 25mpa');
    candidates.add('concreto fck = 25mpa');
    candidates.add('concretagem vigas lajes 25 mpa');
    candidates.add('concretagem de vigas e lajes');
  }
  if (normalized.includes('concreto') && normalized.includes('30')) {
    candidates.add('concreto 30mpa');
    candidates.add('concretagem 30 mpa');
  }
  if (normalized.includes('concreto') && normalized.includes('35')) {
    candidates.add('concreto 35mpa');
    candidates.add('concretagem 35 mpa');
  }
  if (normalized.includes('concreto') && normalized.includes('40')) {
    candidates.add('concreto 40mpa');
    candidates.add('concretagem 40 mpa');
  }
  if (normalized.includes('arm') && normalized.includes('ca-50')) {
    candidates.add('armacao aco ca-50');
    candidates.add('armadura aco ca-50');
    candidates.add('armação aço ca-50');
    candidates.add('armação de bloco utilizando aço ca-50');
  }
  if (normalized.includes('arm') && normalized.includes('ca-60')) {
    candidates.add('armacao aco ca-60');
    candidates.add('armadura aco ca-60');
    candidates.add('armação aço ca-60');
    candidates.add('armação de bloco utilizando aço ca-60');
  }
  if (normalized.includes('forma') && normalized.includes('laje')) {
    candidates.add('forma lajes');
    candidates.add('montagem desmontagem forma lajes');
    candidates.add('fôrma lajes');
    candidates.add('montagem e desmontagem de fôrma');
  }
  if (normalized.includes('forma') && normalized.includes('viga')) {
    candidates.add('forma vigas');
    candidates.add('montagem desmontagem forma vigas');
    candidates.add('fôrma vigas');
    candidates.add('montagem e desmontagem de fôrma');
  }
  if (normalized.includes('forma') && normalized.includes('pilar')) {
    candidates.add('forma pilares');
    candidates.add('montagem desmontagem forma pilares');
    candidates.add('fôrma pilares');
    candidates.add('montagem e desmontagem de fôrma');
  }
  if (normalized.includes('vigota') || normalized.includes('pre moldad')) {
    candidates.add('lajes premoldadas');
    candidates.add('vigotas premoldadas');
  }

  candidates.add(raw);

  return Array.from(candidates);
}

function getSinapiDeterministicCodeHints(termo: string): string[] {
  const normalized = normalizarBuscaLivre(termo);

  if (normalized.includes('concreto') && normalized.includes('25')) {
    return ['103674', '94971', '103670'];
  }
  if (normalized.includes('concreto') && (normalized.includes('30') || normalized.includes('35'))) {
    return ['94973', '103670', '94971'];
  }
  if ((normalized.includes('arm') || normalized.includes('aco')) && normalized.includes('ca-50')) {
    return ['96544', '96545', '96546', '95577', '95578', '95579', '95580', '95581'];
  }
  if ((normalized.includes('arm') || normalized.includes('aco')) && normalized.includes('ca-60')) {
    return ['96543'];
  }
  if (normalized.includes('forma') && normalized.includes('laje')) {
    return ['97086', '97085', '92431', '92439'];
  }
  if (normalized.includes('forma') && normalized.includes('viga')) {
    return ['92431', '92439'];
  }
  if (normalized.includes('forma') && normalized.includes('pilar')) {
    return ['92431', '92439'];
  }
  if (normalized.includes('vigota') || normalized.includes('pre moldad')) {
    return ['103674', '95241'];
  }

  return [];
}

async function buscarSinapiPorCodigos(codigos: string[], limite: number): Promise<ReferenciaBusca[]> {
  if (!codigos.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('sinapi_composicoes')
    .select('codigo, descricao, unidade, valor_unitario, competencia')
    .in('codigo', codigos)
    .limit(Math.max(limite, codigos.length));

  if (error || !data?.length) {
    return [];
  }

  const ordered = codigos
    .map((codigo) => data.find((item) => item.codigo === codigo))
    .filter(Boolean);

  return ordered.slice(0, limite).map((item) => ({
    codigo: item!.codigo,
    descricao: item!.descricao,
    unidade: item!.unidade || null,
    custo_referencia: formatCurrency(item!.valor_unitario),
    origem: 'sinapi',
    origem_detalhe: 'sinapi_oficial',
    competencia: item!.competencia || null,
    fonte_preco: 'SINAPI',
    confianca: 92,
  }));
}

function mapCatalogoViewRows(rows: Array<Record<string, any>>): ReferenciaBusca[] {
  return rows.map((item) => ({
    codigo: item.slug,
    descricao: item.descricao ? `${item.nome} — ${item.descricao}` : item.nome,
    unidade: item.unidade_referencia || null,
    custo_referencia: formatCurrency(item.valor_unitario_referencia),
    origem: 'catalogo_evis',
    origem_detalhe: item.origem_referencia || 'catalogo_residencial',
    competencia: item.competencia_referencia || null,
    fonte_preco: item.fonte_preco || null,
    confianca: item.confianca_referencia ?? null,
  }));
}

async function buscarCatalogoViewPorSlugs(slugs: string[], limite: number): Promise<ReferenciaBusca[]> {
  if (!slugs.length) {
    return [];
  }

  const camposView = [
    'catalogo_servico_id',
    'slug',
    'nome',
    'descricao',
    'categoria',
    'unidade_referencia',
    'origem_referencia',
    'codigo_origem',
    'confianca_referencia',
    'valor_unitario_referencia',
    'competencia_referencia',
    'fonte_preco',
  ].join(', ');

  const { data, error } = await supabase
    .from('vw_referencias_servicos_evis')
    .select(camposView)
    .in('slug', slugs)
    .limit(limite);

  if (error || !data?.length) {
    return [];
  }

  const ordered = slugs
    .map((slug) => (data as Array<Record<string, any>>).find((item) => item.slug === slug))
    .filter(Boolean) as Array<Record<string, any>>;

  return mapCatalogoViewRows(ordered);
}

export async function buscarCatalogoEvis(termo: string, limite: number): Promise<ReferenciaBusca[]> {
  const resultados: ReferenciaBusca[] = [];
  const camposView = [
    'catalogo_servico_id',
    'slug',
    'nome',
    'descricao',
    'categoria',
    'unidade_referencia',
    'origem_referencia',
    'codigo_origem',
    'confianca_referencia',
    'valor_unitario_referencia',
    'competencia_referencia',
    'fonte_preco',
  ].join(', ');

  const { data: viewData, error: viewError } = await supabase
    .from('vw_referencias_servicos_evis')
    .select(camposView)
    .textSearch('busca_tsv', termo, { type: 'websearch' })
    .limit(limite);

  if (!viewError && viewData?.length) {
    return mapCatalogoViewRows(viewData as Array<Record<string, any>>);
  }

  const camposBuscaView = buildSearchPatterns(termo);

  for (const [campo, patterns] of Object.entries(camposBuscaView) as Array<
    [keyof typeof camposBuscaView, string[]]
  >) {
    for (const pattern of patterns) {
      const { data: viewIlikeData, error: viewIlikeError } = await supabase
        .from('vw_referencias_servicos_evis')
        .select(camposView)
        .ilike(campo, pattern)
        .limit(limite);

      if (!viewIlikeError && viewIlikeData?.length) {
        return mapCatalogoViewRows(viewIlikeData as Array<Record<string, any>>);
      }
    }
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('catalogo_servicos_evis')
    .select('slug, nome, descricao, unidade_referencia, origem_principal')
    .eq('status_catalogo', 'aprovado')
    .ilike('nome', `%${termo}%`)
    .limit(limite);

  if (fallbackError || !fallbackData?.length) {
    return resultados;
  }

  const fallbackSlugs = (fallbackData as Array<Record<string, any>>)
    .map((item) => String(item.slug || '').trim())
    .filter(Boolean);

  const enrichedFallback = await buscarCatalogoViewPorSlugs(fallbackSlugs, limite);
  if (enrichedFallback.length) {
    return enrichedFallback;
  }

  return (fallbackData as Array<Record<string, any>>).map((item) => ({
    codigo: item.slug,
    descricao: item.descricao ? `${item.nome} — ${item.descricao}` : item.nome,
    unidade: item.unidade_referencia || null,
    custo_referencia: null,
    origem: 'catalogo_evis',
    origem_detalhe: item.origem_principal || 'catalogo_residencial',
    competencia: null,
    fonte_preco: null,
    confianca: null,
  }));
}

export async function buscarSinapi(termo: string, limite: number): Promise<ReferenciaBusca[]> {
  const deterministicCodes = getSinapiDeterministicCodeHints(termo);
  const deterministicMatches = await buscarSinapiPorCodigos(deterministicCodes, limite);
  if (deterministicMatches.length) {
    return deterministicMatches;
  }

  let data:
    | Array<{
        codigo: string;
        descricao: string;
        unidade: string | null;
        valor_unitario: number | null;
        competencia: string | null;
      }>
    | null
    | undefined;

  const candidates = buildSinapiSearchCandidates(termo);

  for (const candidate of candidates) {
    const { data: ftsData, error: ftsError } = await supabase
      .from('sinapi_composicoes')
      .select('codigo, descricao, unidade, valor_unitario, competencia')
      .textSearch('descricao_tsv', candidate, { type: 'websearch' })
      .limit(limite);

    if (!ftsError && ftsData?.length) {
      data = ftsData;
      break;
    }
  }

  if (!data || data.length === 0) {
    for (const candidate of candidates) {
      const normalized = normalizarBuscaLivre(candidate);
      const ilikePattern = `%${candidate}%`;
      const uppercasePattern = `%${candidate.toUpperCase()}%`;
      const collapsedPattern = `%${normalized.replace(/\s+/g, '%')}%`;

      const { data: ilikeData } = await supabase
        .from('sinapi_composicoes')
        .select('codigo, descricao, unidade, valor_unitario, competencia')
        .or(
          [
            `descricao.ilike.${ilikePattern}`,
            `descricao.ilike.${uppercasePattern}`,
            `descricao.ilike.${collapsedPattern}`,
          ].join(',')
        )
        .limit(limite);

      if (ilikeData?.length) {
        data = ilikeData;
        break;
      }
    }
  }

  return (data || []).map((item) => ({
    codigo: item.codigo,
    descricao: item.descricao,
    unidade: item.unidade || null,
    custo_referencia: formatCurrency(item.valor_unitario),
    origem: 'sinapi',
    origem_detalhe: 'sinapi_oficial',
    competencia: item.competencia || null,
    fonte_preco: 'SINAPI',
    confianca: 90,
  }));
}

export async function buscarReferencias(termo: string, limite: number) {
  const catalogo = await buscarCatalogoEvis(termo, limite);
  const restante = Math.max(limite - catalogo.length, 0);
  const sinapi = restante > 0 ? await buscarSinapi(termo, restante) : [];

  const dedupe = new Map<string, ReferenciaBusca>();
  [...catalogo, ...sinapi].forEach((item) => {
    const key = `${item.origem}:${item.codigo}`;
    if (!dedupe.has(key)) {
      dedupe.set(key, item);
    }
  });

  const data = Array.from(dedupe.values());

  return {
    success: true,
    total: data.length,
    data,
    camadas_consultadas: ['catalogo_evis', 'sinapi'],
  };
}
