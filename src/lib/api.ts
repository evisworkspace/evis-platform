import { Config } from '../types';

export async function sbFetch(path: string, opts: any = {}, cfg: Config) {
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

export async function geminiCall(parts: any[], temp = 0.2, maxTokens = 2048, cfg: Config) {
  if (!cfg.gemini) throw new Error('API Key não configurada.');
  const model = cfg.model || 'gemini-2.0-flash';
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
