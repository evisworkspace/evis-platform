/**
 * Pesquisa de preços de mercado via Tavily AI
 * Plano gratuito: 1.000 queries/mês, sem cartão de crédito
 * Cadastro: https://app.tavily.com
 */

const TAVILY_API_KEY = process.env.TAVILY_API_KEY || '';
const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

export interface WebSearchResult {
  titulo: string;
  url: string;
  descricao: string;
  score?: number;
}

/**
 * Busca preços de materiais/equipamentos que não estão no SINAPI
 */
export async function cotacaoWeb(item: string, contexto = 'construção civil Brasil preço'): Promise<{
  success: boolean;
  query: string;
  data: WebSearchResult[];
  error?: string;
}> {
  if (!TAVILY_API_KEY) {
    return {
      success: false,
      query: item,
      data: [],
      error: 'TAVILY_API_KEY não configurada. Cadastre-se em app.tavily.com (grátis) e adicione a key ao claude_desktop_config.json.',
    };
  }

  const query = `${item} ${contexto} 2024 2025`;

  try {
    const response = await fetch(TAVILY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'basic',
        max_results: 5,
        include_answer: false,
        include_domains: [],
        exclude_domains: [],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return { success: false, query, data: [], error: `Tavily API error ${response.status}: ${text}` };
    }

    const json = await response.json() as any;
    const results: WebSearchResult[] = (json.results || []).map((r: any) => ({
      titulo: r.title || '',
      url: r.url || '',
      descricao: r.content || '',
      score: r.score,
    }));

    return { success: true, query, data: results };
  } catch (err) {
    return {
      success: false,
      query,
      data: [],
      error: err instanceof Error ? err.message : 'Erro desconhecido',
    };
  }
}
