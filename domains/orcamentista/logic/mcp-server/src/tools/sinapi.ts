import { supabase } from '../supabase.js';

/** Remove acentos para compatibilidade com dados SINAPI em maiúsculas sem acento */
function normalizar(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
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
  if (normalized.includes('concreto') && (normalized.includes('30') || normalized.includes('35'))) {
    candidates.add('concreto 30mpa');
    candidates.add('concretagem 30 mpa');
  }
  if (normalized.includes('concreto') && normalized.includes('40')) {
    candidates.add('concreto 40mpa');
    candidates.add('concretagem 40 mpa');
  }
  if ((normalized.includes('arm') || normalized.includes('aco')) && normalized.includes('ca-50')) {
    candidates.add('armacao aco ca-50');
    candidates.add('armadura aco ca-50');
    candidates.add('armação aço ca-50');
    candidates.add('armação de bloco utilizando aço ca-50');
  }
  if ((normalized.includes('arm') || normalized.includes('aco')) && normalized.includes('ca-60')) {
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

type ReferenciaItem = {
  codigo: string;
  descricao: string;
  unidade: string | null;
  custo_referencia: string;
  origem: 'catalogo_evis' | 'sinapi';
  origem_detalhe: string | null;
  competencia: string | null;
  fonte_preco: string | null;
  confianca: number | null;
};

function formatCurrency(value: unknown): string {
  if (value === null || value === undefined) {
    return 'Não informado';
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? `R$ ${numeric.toFixed(2)}` : 'Não informado';
}

function formatCatalogoResult(items: any[]) {
  const formatted: ReferenciaItem[] = items.map(item => ({
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

  return { success: true, total: formatted.length, data: formatted };
}

async function buscarCatalogoViewPorSlugs(slugs: string[], limite: number) {
  if (!slugs.length) {
    return { success: true, total: 0, data: [] as ReferenciaItem[] };
  }

  const camposView = [
    'slug',
    'nome',
    'descricao',
    'unidade_referencia',
    'origem_referencia',
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
    return { success: true, total: 0, data: [] as ReferenciaItem[] };
  }

  const ordered = slugs
    .map((slug) => (data as any[]).find((item) => item.slug === slug))
    .filter(Boolean);

  return formatCatalogoResult(ordered);
}

async function buscarCatalogoEvis(termo: string, limite: number) {
  const camposView = [
    'slug',
    'nome',
    'descricao',
    'unidade_referencia',
    'origem_referencia',
    'confianca_referencia',
    'valor_unitario_referencia',
    'competencia_referencia',
    'fonte_preco',
  ].join(', ');

  const { data: ftsData, error: ftsError } = await supabase
    .from('vw_referencias_servicos_evis')
    .select(camposView)
    .textSearch('busca_tsv', termo, { type: 'websearch' })
    .limit(limite);

  if (!ftsError && ftsData && ftsData.length > 0) {
    return formatCatalogoResult(ftsData);
  }

  const camposBusca = buildSearchPatterns(termo);

  for (const [campo, patterns] of Object.entries(camposBusca) as Array<
    [keyof typeof camposBusca, string[]]
  >) {
    for (const pattern of patterns) {
      const { data, error } = await supabase
        .from('vw_referencias_servicos_evis')
        .select(camposView)
        .ilike(campo, pattern)
        .limit(limite);

      if (!error && data && data.length > 0) {
        return formatCatalogoResult(data);
      }
    }
  }

  const { data: fallbackData, error: fallbackError } = await supabase
    .from('catalogo_servicos_evis')
    .select('slug')
    .eq('status_catalogo', 'aprovado')
    .ilike('nome', `%${termo}%`)
    .limit(limite);

  if (fallbackError || !fallbackData?.length) {
    return { success: true, total: 0, data: [] as ReferenciaItem[] };
  }

  const slugs = (fallbackData as Array<{ slug: string | null }>)
    .map((item) => String(item.slug || '').trim())
    .filter(Boolean);

  const enriched = await buscarCatalogoViewPorSlugs(slugs, limite);
  if (enriched.total > 0) {
    return enriched;
  }

  return { success: true, total: 0, data: [] as ReferenciaItem[] };
}

/**
 * Busca referências por texto livre.
 * Estratégia:
 * 1. Catálogo residencial EVIS (view agregada com preço)
 * 2. SINAPI oficial como fallback
 */
export async function sinapiSearch(termo: string, limite = 10) {
  const catalogo = await buscarCatalogoEvis(termo, limite);
  if (catalogo.total > 0) {
    return {
      ...catalogo,
      camadas_consultadas: ['catalogo_evis'],
    };
  }

  const deterministicCodes = getSinapiDeterministicCodeHints(termo);
  if (deterministicCodes.length > 0) {
    const { data, error } = await supabase
      .from('sinapi_composicoes')
      .select('codigo, descricao, unidade, valor_unitario, competencia')
      .in('codigo', deterministicCodes)
      .limit(Math.max(limite, deterministicCodes.length));

    if (!error && data && data.length > 0) {
      const ordered = deterministicCodes
        .map((codigo) => data.find((item) => item.codigo === codigo))
        .filter(Boolean);

      return {
        ...formatSinapiResult(ordered.slice(0, limite)),
        camadas_consultadas: ['sinapi'],
      };
    }
  }

  const candidates = buildSinapiSearchCandidates(termo);

  for (const candidate of candidates) {
    const { data: ftsData, error: ftsError } = await supabase
      .from('sinapi_composicoes')
      .select('codigo, descricao, unidade, valor_unitario, competencia')
      .textSearch('descricao_tsv', candidate, { type: 'websearch' })
      .limit(limite);

    if (!ftsError && ftsData && ftsData.length > 0) {
      return {
        ...formatSinapiResult(ftsData),
        camadas_consultadas: ['sinapi'],
      };
    }
  }

  for (const candidate of candidates) {
    const termoNorm = normalizar(candidate);
    const palavras = termoNorm.split(/\s+/).filter((p) => p.length > 3);
    const termoPrincipal = palavras[0] || termoNorm;

    const { data, error } = await supabase
      .from('sinapi_composicoes')
      .select('codigo, descricao, unidade, valor_unitario, competencia')
      .ilike('descricao', `%${termoPrincipal}%`)
      .limit(limite);

    if (!error && data && data.length > 0) {
      return {
        ...formatSinapiResult(data),
        camadas_consultadas: ['sinapi'],
      };
    }
  }

  return {
    ...formatSinapiResult([]),
    camadas_consultadas: ['sinapi'],
  };
}

/**
 * Busca composição SINAPI específica pelo código
 */
export async function sinapiGetByCodigo(codigo: string) {
  const { data, error } = await supabase
    .from('sinapi_composicoes')
    .select('*')
    .eq('codigo', codigo)
    .single();

  if (error) return { success: false, error: `SINAPI ${codigo} não encontrado`, data: null };

  return {
    success: true,
    data: {
      codigo: data.codigo,
      descricao: data.descricao,
      unidade: data.unidade,
      valor_unitario: data.valor_unitario,
      composicao: data.composicao || null,
    }
  };
}

/**
 * Busca múltiplos SINAPI por lista de códigos
 */
export async function sinapiGetMultiple(codigos: string[]) {
  const { data, error } = await supabase
    .from('sinapi_composicoes')
    .select('codigo, descricao, unidade, valor_unitario')
    .in('codigo', codigos);

  if (error) return { success: false, error: error.message, data: [] };

  return formatSinapiResult(data || []);
}

function formatSinapiResult(items: any[]) {
  const formatted: ReferenciaItem[] = items.map(item => ({
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

  return { success: true, total: formatted.length, data: formatted };
}
