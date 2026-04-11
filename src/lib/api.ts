import { Config } from '../types';

export type SbFetchOptions = RequestInit & {
  prefer?: string;
};

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
    const t = await res.text();
    throw new Error(t);
  }
  if (opts.method === 'PATCH' && opts.prefer === 'return=minimal') return null;
  return res.json().catch(() => null);
}

export type GeminiPart = { text: string } | { inline_data: { mime_type: string, data: string } };

export async function geminiCall(parts: (string | GeminiPart)[], temp = 0.2, maxTokens = 2048, cfg: Config) {
  if (!cfg.gemini) throw new Error('API Key não configurada.');
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

export async function aiCall(prompt: string, temp = 0.2, maxTokens = 2048, cfg: Config): Promise<string> {
  const openrouterKey = (import.meta as any).env.VITE_OPENROUTER_API_KEY || '';
  
  if (openrouterKey) {
    const model = 'minimax/minimax-m1';
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openrouterKey}`,
        'HTTP-Referer': 'https://evis-app.vercel.app',
        'X-Title': 'EVIS Diário de Obra'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: temp,
        max_tokens: maxTokens,
        stream: false
      })
    });
    const data = await res.json();
    if (data.error) throw new Error(typeof data.error === 'string' ? data.error : (data.error as any).message || JSON.stringify(data.error));
    return data.choices?.[0]?.message?.content || '';
  }
  
  if (cfg.gemini) {
    return geminiCall([prompt], temp, maxTokens, cfg);
  }
  
  throw new Error('Nenhuma API de IA configurada. Adicione VITE_OPENROUTER_API_KEY ou VITE_GEMINI_API_KEY no .env');
}
