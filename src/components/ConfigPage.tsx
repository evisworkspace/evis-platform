import React from 'react';
import { useAppContext } from '../AppContext';
import { LLMProviderOption } from '../hooks/useAnalyzeOpportunity';
import { sbFetch } from '../lib/api';

export default function ConfigPage() {
  const { config, setConfig, resetState, toast } = useAppContext();
  const [testStatus, setTestStatus] = React.useState('');
  const [ollamaModels, setOllamaModels] = React.useState<string[]>([]);
  const [loadingModels, setLoadingModels] = React.useState(false);
  const [providerStatus, setProviderStatus] = React.useState<Record<string, boolean>>({});

  const fetchLLMProviders = async () => {
    setLoadingModels(true);
    try {
      const res = await fetch('/api/orcamentista/llm-providers');
      const data = await res.json();
      if (data.success) {
        setOllamaModels(data.providers?.ollama?.models ?? []);
        setProviderStatus({
          gemini: data.providers?.gemini?.available ?? false,
          ollama: data.providers?.ollama?.available ?? false,
          openrouter: data.providers?.openrouter?.available ?? false,
        });
      }
    } catch {
      setOllamaModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const testConn = async () => {
    setTestStatus('Testando...');
    try {
      await sbFetch('servicos?limit=1', {}, config);
      setTestStatus('✓ Supabase conectado');
      toast('Conexão bem-sucedida!', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setTestStatus('✗ ' + msg);
      toast('Erro: ' + msg, 'error');
    }
  };

  const handleReset = () => {
    resetState();
    toast('Dados locais apagados.', 'success');
  };

  const [jsonText, setJsonText] = React.useState('');

  const handleImportJSON = async () => {
    if (!config.url || !config.key) {
      toast('Configure Supabase primeiro.', 'error');
      return;
    }

    try {
      const data = JSON.parse(jsonText);
      toast('Iniciando importação direta para o Supabase...', 'info');

      const upsert = 'resolution=merge-duplicates,return=minimal';

      // 1. IMPORTAR SERVIÇOS
      const services = (data.servicos || []).map((s: Record<string, any>) => ({
        obra_id: config.obraId,
        id_servico: s.id_servico || s.cod || s.codigo,
        nome: s.nome || s.descricao,
        categoria: s.categoria || s.setor || '',
        avanco_atual: s.avanco_atual || 0,
        status: (s.status || 'nao_iniciado').toLowerCase().replace(' ', '_'),
        data_prevista: s.data_prevista || null,
        data_conclusao: s.data_conclusao || null,
        equipe: s.equipe || s.equipe_cod || null,
      }));

      if (services.length > 0) {
        toast(`Enviando ${services.length} serviços...`, 'info');
        await sbFetch('servicos', { method: 'POST', body: JSON.stringify(services), prefer: upsert }, config);
      }

      // 2. IMPORTAR EQUIPES
      const teams = (data.equipes || data.fornecedores || []).map((f: Record<string, any>) => ({
        obra_id: config.obraId,
        cod: f.cod || f.equipe_cod,
        nome: f.nome
      }));

      if (teams.length > 0) {
        await sbFetch('equipes_cadastro', { method: 'POST', body: JSON.stringify(teams), prefer: upsert }, config);
      }

      // 3. IMPORTAR NOTAS (Anotações/Observações)
      const notes = (data.notas || []).map((n: Record<string, any>) => ({
        obra_id: config.obraId,
        tipo: n.tipo || 'observacao',
        texto: n.texto,
        data_nota: n.data_nota || n.data || new Date().toISOString()
      }));

      if (notes.length > 0) {
        toast(`Enviando ${notes.length} notas/anotações...`, 'info');
        await sbFetch('notas', { method: 'POST', body: JSON.stringify(notes), prefer: upsert }, config);
      }

      // 4. IMPORTAR DIÁRIO (Narrativas)
      if (data.narrativa_visita) {
        await sbFetch('diario_obra', {
          method: 'POST',
          body: JSON.stringify({
            obra_id: config.obraId,
            narrativa: data.narrativa_visita,
            transcricao: 'Importação inicial JSON',
            created_at: new Date().toISOString()
          }),
          prefer: upsert,
        }, config);
      }

      // 5. IMPORTAR PENDÊNCIAS
      const pendings = (data.pendencias || []).map((p: Record<string, any>) => ({
        obra_id: config.obraId,
        descricao: p.descricao,
        prioridade: p.prioridade || 'media',
        status: p.status || 'ABERTA'
      }));

      if (pendings.length > 0) {
        await sbFetch('pendencias', { method: 'POST', body: JSON.stringify(pendings), prefer: upsert }, config);
      }

      toast('Dados importados.', 'success');
      setJsonText('');
      
      // Auto-refresh do estado local para refletir o que foi enviado
      window.location.reload(); 
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast('Não foi possível importar os dados. Tente novamente.', 'error');
    }
  };



  return (
    <div>

      <div className="bg-s1 border border-b1 rounded-[10px] p-5 mb-3">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-widest mb-3.5 pb-2.5 border-b border-b1">Supabase</div>
        
        <div className="flex items-center justify-between py-2.5 border-b border-b1">
          <div>
            <div className="text-[13px] text-t1 font-semibold">URL do projeto</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">https://xxxx.supabase.co</div>
          </div>
          <input name="url" value={config.url} onChange={handleChange} className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[300px] focus:border-b3 transition-colors" placeholder="https://..." />
        </div>

        <div className="flex items-center justify-between py-2.5 border-b border-b1">
          <div>
            <div className="text-[13px] text-t1 font-semibold">Anon Key</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">Chave pública do projeto</div>
          </div>
          <input name="key" type="password" value={config.key} onChange={handleChange} className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[300px] focus:border-b3 transition-colors" placeholder="[REDACTED_JWT_REMOVED]" />
        </div>

        <div className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-[13px] text-t1 font-semibold">ID da obra</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">UUID da obra no Supabase</div>
          </div>
          <input name="obraId" value={config.obraId} onChange={handleChange} className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[300px] focus:border-b3 transition-colors" placeholder="uuid-da-obra" />
        </div>
      </div>

      <div className="bg-s1 border border-b1 rounded-[10px] p-5 mb-3">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-widest mb-3.5 pb-2.5 border-b border-b1">Gemini API</div>
        
        <div className="flex items-center justify-between py-2.5 border-b border-b1">
          <div>
            <div className="text-[13px] text-t1 font-semibold">API Key</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">Google AI Studio → Get API Key</div>
          </div>
          <input name="gemini" type="password" value={config.gemini} onChange={handleChange} className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[300px] focus:border-b3 transition-colors" placeholder="AIza..." />
        </div>

        <div className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-[13px] text-t1 font-semibold">Modelo</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">Recomendado: gemini-2.0-flash</div>
          </div>
          <select name="model" value={config.model} onChange={handleChange} className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[300px] focus:border-b3 transition-colors">
            <option value="gemini-2.0-flash">gemini-2.0-flash — rápido, gratuito</option>
            <option value="gemini-1.5-pro">gemini-1.5-pro — mais preciso</option>
            <option value="gemini-2.5-pro-preview-03-25">gemini-2.5-pro — avançado</option>
          </select>
        </div>
      </div>

      <div className="bg-s1 border border-b1 rounded-[10px] p-5 mb-3">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-widest mb-3.5 pb-2.5 border-b border-b1">Ollama (Soldado Local)</div>
        
        <div className="flex items-center justify-between py-2.5 border-b border-b1">
          <div>
            <div className="text-[13px] text-t1 font-semibold">Endpoint</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">Padrão: http://localhost:11434/api/generate</div>
          </div>
          <input name="ollama" value={config.ollama || ''} onChange={handleChange} className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[300px] focus:border-b3 transition-colors" placeholder="http://localhost:11434/..." />
        </div>
      </div>

      <div className="bg-s1 border border-b1 rounded-[10px] p-5 mb-3">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-widest mb-3.5 pb-2.5 border-b border-b1">Minimax / OpenRouter</div>
        
        <div className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-[13px] text-t1 font-semibold">API Key</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">Usado para o Agente Analista (Minimax)</div>
          </div>
          <input name="minimax" type="password" value={config.minimax || ''} onChange={handleChange} className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[300px] focus:border-b3 transition-colors" placeholder="sk-or-v1-..." />
        </div>
      </div>

      <div className="bg-s1 border border-b1 rounded-[10px] p-5 mb-3">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-widest mb-3.5 pb-2.5 border-b border-b1 flex items-center justify-between">
          <span>Orçamentista IA — Motor de Análise</span>
          <button
            onClick={fetchLLMProviders}
            disabled={loadingModels}
            className="text-[9px] font-bold text-brand-green hover:text-green-300 transition-colors disabled:opacity-50"
          >
            {loadingModels ? 'Verificando...' : 'Verificar disponibilidade'}
          </button>
        </div>

        <div className="flex items-center justify-between py-2.5 border-b border-b1">
          <div>
            <div className="text-[13px] text-t1 font-semibold">Provedor ativo</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">Motor usado na análise de documentos</div>
          </div>
          <div className="flex items-center gap-2">
            <select
              name="aiProvider"
              value={(config as any).aiProvider || 'ollama'}
              onChange={handleChange}
              className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[200px] focus:border-b3 transition-colors"
            >
              <option value="ollama">Ollama (local, gratuito)</option>
              <option value="gemini">Gemini (Google AI)</option>
              <option value="openrouter">OpenRouter (Minimax/Llama)</option>
            </select>
            {Object.keys(providerStatus).length > 0 && (
              <div className={`w-2 h-2 rounded-full shrink-0 ${providerStatus[(config as any).aiProvider || 'ollama'] ? 'bg-green-400' : 'bg-red-400'}`} />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between py-2.5 border-b border-b1">
          <div>
            <div className="text-[13px] text-t1 font-semibold">Modelo</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">
              {(config as any).aiProvider === 'ollama' ? 'Modelos disponíveis no Ollama local' : 'Nome exato do modelo'}
            </div>
          </div>
          {(config as any).aiProvider === 'ollama' && ollamaModels.length > 0 ? (
            <select
              name="aiModel"
              value={(config as any).aiModel || ''}
              onChange={handleChange}
              className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[280px] focus:border-b3 transition-colors"
            >
              <option value="">— padrão do servidor —</option>
              {ollamaModels.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          ) : (
            <input
              name="aiModel"
              value={(config as any).aiModel || ''}
              onChange={handleChange}
              className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[280px] focus:border-b3 transition-colors"
              placeholder={
                (config as any).aiProvider === 'gemini' ? 'gemini-2.5-flash' :
                (config as any).aiProvider === 'openrouter' ? 'minimax/minimax-01' :
                'llama3.1'
              }
            />
          )}
        </div>

        {(config as any).aiProvider === 'ollama' && (
          <div className="pt-2.5 text-[11px] text-t3">
            {providerStatus.ollama === true && (
              <span className="text-green-400">Ollama online · {ollamaModels.length} modelo{ollamaModels.length !== 1 ? 's' : ''} disponível{ollamaModels.length !== 1 ? 'is' : ''}</span>
            )}
            {providerStatus.ollama === false && (
              <span className="text-amber-400">Ollama offline — inicie com: <code className="font-mono bg-s2 px-1 rounded">ollama serve</code></span>
            )}
            {!Object.keys(providerStatus).length && (
              <span>Clique em "Verificar disponibilidade" para listar modelos locais.</span>
            )}
          </div>
        )}
      </div>

      <div className="bg-s1 border border-b1 rounded-[10px] p-5 mb-3">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-widest mb-3.5 pb-2.5 border-b border-b1">Contexto e Ferramentas (MCP)</div>
        
        <div className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-[13px] text-t1 font-semibold">Servidor MCP</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">Conecta a IA a ferramentas externas</div>
          </div>
          <input name="mcpServer" value={config.mcpServer || ''} onChange={handleChange} className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[300px] focus:border-b3 transition-colors" placeholder="https://..." />
        </div>
      </div>

      <div className="bg-s1 border border-b1 rounded-[10px] p-5 mb-3">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-widest mb-3.5 pb-2.5 border-b border-b1">ImgBB API (Fotos)</div>
        
        <div className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-[13px] text-t1 font-semibold">API Key</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">Para salvar fotos na nuvem (api.imgbb.com)</div>
          </div>
          <input name="imgbbKey" type="password" value={config.imgbbKey || ''} onChange={handleChange} className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[300px] focus:border-b3 transition-colors" placeholder="Chave da API ImgBB..." />
        </div>
      </div>


      <div className="bg-s1 border border-b1 rounded-[10px] p-5 mb-3">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-widest mb-3.5 pb-2.5 border-b border-b1">Inicializar Projeto (JSON)</div>
        <div className="text-[12px] text-t3 mb-3">
          Cole o JSON gerado pelo agente de orçamento para popular o sistema. Isso substituirá os dados atuais.
        </div>
        <textarea 
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          placeholder='{"servicos": [...], "equipes": [...]}'
          className="w-full h-[120px] bg-s2 border border-b1 rounded-lg text-t1 font-mono text-[10px] p-3 outline-none focus:border-b3 mb-3 resize-y"
        />
        <button onClick={handleImportJSON} className="px-3.5 py-[7px] rounded-md font-sans text-[11px] font-extrabold tracking-[0.05em] bg-brand-blue text-[#0a0d0a] hover:bg-blue-400 transition-colors">
          Processar e Inicializar
        </button>
      </div>


      <div className="flex items-center gap-2.5 mt-3 justify-between">
        <div className="flex items-center gap-2.5">
          <button onClick={testConn} className="px-3.5 py-[7px] rounded-md font-sans text-[11px] font-extrabold tracking-[0.05em] bg-brand-green text-[#0a0d0a] hover:bg-brand-green2 transition-colors">
            Testar conexão
          </button>
          <span className={`font-mono text-[11px] ${testStatus.startsWith('✓') ? 'text-brand-green' : testStatus.startsWith('✗') ? 'text-brand-red' : 'text-t3'}`}>
            {testStatus}
          </span>
        </div>
        <button onClick={handleReset} className="px-3.5 py-[7px] rounded-md font-sans text-[11px] font-bold tracking-[0.05em] bg-brand-red/10 border border-brand-red/30 text-brand-red hover:bg-brand-red/20 transition-colors">
          Zerar Dados Locais
        </button>
      </div>
    </div>
  );
}
