import React from 'react';
import { useAppContext } from '../AppContext';
import { initialData } from '../initialData';

export default function ConfigPage() {
  const { config, setConfig, state, setState, resetState, markPending, toast } = useAppContext();
  const [testStatus, setTestStatus] = React.useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const testConn = async () => {
    setTestStatus('Testando...');
    try {
      const res = await fetch(`${config.url}/rest/v1/servicos?limit=1`, {
        headers: {
          'apikey': config.key,
          'Authorization': `Bearer ${config.key}`,
        }
      });
      if (!res.ok) throw new Error(await res.text());
      setTestStatus('✓ Supabase conectado');
      toast('Conexão com Supabase bem-sucedida!', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setTestStatus('✗ ' + msg);
      toast('Erro na conexão: ' + msg, 'error');
    }
  };

  const updateEquipe = (index: number, field: 'cod' | 'nome', value: string) => {
    const newEquipes = [...state.equipes];
    newEquipes[index] = { ...newEquipes[index], [field]: value };
    setState({ ...state, equipes: newEquipes });
  };

  const removeEquipe = (index: number) => {
    const newEquipes = state.equipes.filter((_, i) => i !== index);
    setState({ ...state, equipes: newEquipes });
  };

  const addEquipe = () => {
    setState({ ...state, equipes: [...state.equipes, { cod: `EQ-${state.equipes.length + 1}`, nome: 'Nova equipe' }] });
  };

  const [jsonText, setJsonText] = React.useState('');

  const handleImportJSON = () => {
    try {
      const data = JSON.parse(jsonText) as any;
      
      const newServicos = (data.servicos || []).map((s: any) => ({
        id: crypto.randomUUID(),
        id_servico: s.id_servico || s.cod || s.codigo,
        nome: s.nome || s.descricao,
        categoria: s.categoria || s.setor || '',
        avanco_atual: s.avanco_atual || s.pct_atual || 0,
        status_atual: (s.status_atual || 'a_executar').toLowerCase().replace(' ', '_'),
        data_inicio: s.data_inicio || null,
        data_fim: s.data_fim || null,
        equipe: s.equipe || s.equipe_cod || null,
      }));

      const newPendencias = (data.pendencias || []).map((p: any) => ({
        id: crypto.randomUUID(),
        descricao: p.descricao,
        prioridade: p.prioridade || 'media',
        status: p.status || 'ABERTA',
      }));

      const newNotas = (data.notas || []).map((n: any) => ({
        id: crypto.randomUUID(),
        tipo: n.tipo || 'observacao',
        texto: n.texto,
        data_nota: n.data_nota || n.data || new Date().toISOString()
      }));

      const newFotos = (data.fotos || []).map((f: any) => ({
        id: crypto.randomUUID(),
        url: f.url || f.src,
        legenda: f.legenda || '',
        data_foto: f.data_foto || f.data || new Date().toISOString()
      }));

      const newEquipes = (data.equipes || data.fornecedores || []).map((f: any) => ({
        cod: f.cod || f.equipe_cod,
        nome: f.nome
      }));

      const newNarrativas: Record<string, string> = { ...state.narrativas };
      if (data.narrativa_visita) {
        const day = new Date().toISOString().split('T')[0];
        newNarrativas[day] = data.narrativa_visita;
      }

      setState(prev => ({
        ...prev,
        servicos: newServicos,
        pendencias: newPendencias,
        notas: newNotas,
        fotos: newFotos,
        equipes: newEquipes.length > 0 ? newEquipes : prev.equipes,
        narrativas: newNarrativas
      }));

      newServicos.forEach((s: any) => markPending('servicos', s));
      newPendencias.forEach((p: any) => markPending('pendencias', p));
      newNotas.forEach((n: any) => markPending('notas', n));

      toast(`Projeto inicializado: ${newServicos.length} serviços, ${newPendencias.length} pendências, ${newNotas.length} notas, ${newFotos.length} fotos.`, 'success');
      setJsonText('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast('Erro ao importar JSON: ' + msg, 'error');
    }
  };

  const handleReset = () => {
    // Note: window.confirm is blocked in iframe, so we just reset directly or use a custom modal.
    // For now, we'll just reset directly to avoid blocking.
    resetState();
    toast('Dados locais apagados com sucesso. A tela está limpa.', 'success');
  };

  const handleSeedData = () => {
    setState(prev => ({
      ...prev,
      ...initialData,
      pendingChanges: [] 
    }));
    toast('Dados iniciais carregados com sucesso!', 'success');
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div className="flex-1">
          <h2 className="text-[20px] font-bold text-t1">Configurações</h2>
        </div>
        <button onClick={handleSeedData} className="px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-[0.05em] bg-brand-blue/20 text-brand-blue border border-brand-blue/30 hover:bg-brand-blue/30 transition-all">
          Importar Dados de Exemplo
        </button>
      </div>

      <div className="bg-s1 border border-b1 rounded-[10px] p-5 mb-3">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-[0.1em] mb-3.5 pb-2.5 border-b border-b1">Supabase</div>
        
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
          <input name="key" type="password" value={config.key} onChange={handleChange} className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[300px] focus:border-b3 transition-colors" placeholder="eyJ..." />
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
        <div className="font-mono text-[10px] text-t3 uppercase tracking-[0.1em] mb-3.5 pb-2.5 border-b border-b1">Gemini API</div>
        
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
        <div className="font-mono text-[10px] text-t3 uppercase tracking-[0.1em] mb-3.5 pb-2.5 border-b border-b1">ImgBB API (Fotos)</div>
        
        <div className="flex items-center justify-between py-2.5">
          <div>
            <div className="text-[13px] text-t1 font-semibold">API Key</div>
            <div className="font-mono text-[10px] text-t3 mt-0.5">Para salvar fotos na nuvem (api.imgbb.com)</div>
          </div>
          <input name="imgbbKey" type="password" value={config.imgbbKey || ''} onChange={handleChange} className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[11px] px-3 py-2 outline-none w-[300px] focus:border-b3 transition-colors" placeholder="Chave da API ImgBB..." />
        </div>
      </div>

      <div className="bg-s1 border border-b1 rounded-[10px] p-5 mb-3">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-[0.1em] mb-3.5 pb-2.5 border-b border-b1">Equipes</div>
        
        {state.equipes.map((eq, i) => (
          <div key={i} className="flex items-center gap-2 py-2.5 border-b border-b1 last:border-b-0">
            <input 
              value={eq.cod} 
              onChange={(e) => updateEquipe(i, 'cod', e.target.value)} 
              className="bg-s2 border border-b1 rounded-[5px] text-t1 font-mono text-[11px] px-2.5 py-1.5 w-[100px] outline-none focus:border-b3" 
              placeholder="CÓDIGO"
            />
            <input 
              value={eq.nome} 
              onChange={(e) => updateEquipe(i, 'nome', e.target.value)} 
              className="bg-s2 border border-b1 rounded-[5px] text-t1 font-mono text-[12px] px-2.5 py-1.5 flex-1 outline-none focus:border-b3" 
              placeholder="Nome da equipe"
            />
            <button onClick={() => removeEquipe(i)} className="px-2.5 py-1.5 rounded-md text-[11px] font-bold tracking-[0.05em] text-t2 border border-b2 hover:border-b3 hover:text-t1 transition-colors">
              remover
            </button>
          </div>
        ))}
        
        <button onClick={addEquipe} className="mt-2.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold tracking-[0.05em] text-t2 border border-b2 hover:border-b3 hover:text-t1 transition-colors">
          + Equipe
        </button>
      </div>

      <div className="bg-s1 border border-b1 rounded-[10px] p-5 mb-3">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-[0.1em] mb-3.5 pb-2.5 border-b border-b1">Inicializar Projeto (JSON)</div>
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
