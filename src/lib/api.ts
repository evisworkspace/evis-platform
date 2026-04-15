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

export async function geminiCall(parts: (string | GeminiPart)[], temp = 0.2, maxTokens = 2048, cfg: Config) {
  if (!cfg.gemini) throw new Error('API Key Gemini não configurada.');
  const model = cfg.model || 'gemini-1.5-flash';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cfg.gemini}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: parts.map(p => typeof p === 'string' ? { text: p } : p) }],
      generationConfig: { temperature: temp, maxOutputTokens: maxTokens }
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

export async function minimaxCall(prompt: string, temp = 0.2, maxTokens = 2048, cfg: Config): Promise<string> {
  // Se cfg.minimax for uma URL de proxy/local, usa ela. Senão tenta OpenRouter.
  const apiKey = cfg.minimax || (import.meta as any).env.VITE_OPENROUTER_API_KEY || '';
  if (!apiKey) throw new Error('Minimax/OpenRouter Key não configurada.');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://evis-app.vercel.app',
      'X-Title': 'EVIS Diário de Obra'
    },
    body: JSON.stringify({
      model: 'minimax/minimax-m1',
      messages: [{ role: 'user', content: prompt }],
      temperature: temp,
      max_tokens: maxTokens,
      stream: false
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(typeof data.error === 'string' ? data.error : data.error.message);
  return data.choices?.[0]?.message?.content || '';
}

export async function claudeCall(prompt: string, temp = 0.2, maxTokens = 4096, cfg: Config): Promise<string> {
  const apiKey = (import.meta as any).env.VITE_ANTHROPIC_API_KEY || '';
  if (!apiKey) throw new Error('Anthropic API Key não configurada.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
      temperature: temp
    })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text || '';
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
