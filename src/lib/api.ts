import { Config } from '../types';

export type SbFetchOptions = RequestInit & {
  prefer?: string;
};

/**
 * Extrai o primeiro objeto JSON aninhado balanceado de uma string de texto livre.
 * Resolve o problema 'Unexpected non-whitespace character after JSON' se a IA produzir lixo ou múltiplos objetos.
 */
export function extractJSON(text: string): string {
  const start = text.indexOf('{');
  if (start === -1) throw new Error('A IA não retornou nenhum objeto JSON válido.');
  
  let braceCount = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (char === '\\') escape = true;
      else if (char === '"') inString = false;
    } else {
      if (char === '"') inString = true;
      else if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
    }
    
    // Se voltamos a zero chaves e não estamos no primeiro caractere (braceCount === 0), temos o bjeto fechado.
    if (braceCount === 0 && text[i] === '}') {
      return text.substring(start, i + 1);
    }
  }
  throw new Error('A IA gerou um JSON incompleto ou com sintaxe incorreta (chaves não fechadas).');
}


export async function sbFetch(path: string, opts: SbFetchOptions = {}, cfg: Config) {
  if (!cfg.url || !cfg.key) throw new Error('Configure Supabase nas Configurações.');
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
    ...opts,
    headers: {
      'apikey': cfg.key,
      'Authorization': `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      'Prefer': opts.prefer || 'return=representation',
      ...(opts.headers || {})
    }
  });
  if (!res.ok) {
    let errorMessage = `Erro na requisição (${res.status})`;
    try {
      const errorData = await res.json();
      if (errorData.code === 'PGRST301') {
        errorMessage = 'Erro de Permissão (RLS): Você não tem autorização.';
      } else {
        errorMessage = errorData.message || errorData.hint || JSON.stringify(errorData);
      }
    } catch {
      errorMessage = await res.text() || res.statusText;
    }
    throw new Error(errorMessage);
  }
  if (opts.method === 'PATCH' && opts.prefer === 'return=minimal') return null;
  return res.json().catch(() => null);
}

export type GeminiPart = { text: string } | { inline_data: { mime_type: string, data: string } };

export async function geminiCall(
  _parts: (string | GeminiPart)[],
  _temp = 0.2,
  _maxTokens = 2048,
  _cfg: Config
): Promise<string> {
  throw new Error('Gemini client-side bloqueado por segurança. Use um endpoint backend com HITL.');
}

export async function ollamaCall(prompt: string, temp = 0.2, _maxTokens = 2048, cfg: Config): Promise<string> {
  const url = cfg.ollama || 'http://localhost:11434/api/generate';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "qwen2.5-coder:7b",
      prompt,
      options: { temperature: temp },
      stream: false
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.response || '';
}

export async function minimaxCall(_prompt: string, _temp = 0.2, _maxTokens = 2048, _cfg: Config): Promise<string> {
  throw new Error('OpenRouter/Minimax client-side bloqueado por segurança. Use um endpoint backend com HITL.');
}

export async function claudeCall(prompt: string, temp = 0.2, maxTokens = 4096, cfg: Config): Promise<string> {
  void prompt;
  void temp;
  void maxTokens;
  void cfg;
  throw new Error('Claude client-side bloqueado por segurança. Use um endpoint backend com HITL.');
}

export async function aiCall(prompt: string, temp = 0.2, maxTokens = 2048, cfg: Config, provider?: 'gemini' | 'ollama' | 'minimax' | 'claude'): Promise<string> {
  const target = provider || 'gemini';

  if (target === 'ollama') return ollamaCall(prompt, temp, maxTokens, cfg);
  if (target === 'minimax') return minimaxCall(prompt, temp, maxTokens, cfg);
  if (target === 'claude') return claudeCall(prompt, temp, maxTokens, cfg);
  return geminiCall([prompt], temp, maxTokens, cfg);
}

/**
 * Processa narrativa do diário via orquestrador backend (8 camadas).
 * Retorna processamento completo com HITL para revisão.
 */
export async function processarDiarioOrchestrator(
  transcricao: string,
  obra_id: string,
  data_referencia: string
): Promise<any> {
  const orchestratorUrl = 'http://localhost:3001/api/diario/processar-diario';

  const res = await fetch(orchestratorUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcricao, obra_id, data_referencia })
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText);
    throw new Error(`Orquestrador falhou (${res.status}): ${errorText}`);
  }

  const result = await res.json();

  if (!result.success) {
    throw new Error(result.error || 'Orquestrador retornou erro desconhecido');
  }

  return result.data;
}
