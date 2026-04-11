import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import { Servico, Pendencia, Equipe, Nota, Foto, DiarioEntry, PendingChange } from './types';
import { Book, CheckSquare, FileText, Image as ImageIcon, FileBarChart, Settings, CloudDownload, CloudUpload, Calendar, TrendingUp, MessageSquare } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Diario from './components/Diario';
import Equipes from './components/Equipes';
import Servicos from './components/Servicos';
import Notas from './components/Notas';
import Fotos from './components/Fotos';
import Relatorios from './components/Relatorios';
import ConfigPage from './components/ConfigPage';
import Cronograma from './components/Cronograma';
import { useSupabaseQuery } from './hooks/useSupabaseQuery';
import { sbFetch } from './lib/api';
import { logger } from './services/logger';

function Main() {
  const [activeTab, setActiveTab] = useState('diario');
  const { state, setState, config, toast } = useAppContext();
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();
  const [loadingInitial, setLoadingInitial] = useState(false);

  // React Query hooks for caching data
  const servicos = useSupabaseQuery<Servico[]>(
    ['servicos', config.obraId],
    `servicos?obra_id=eq.${config.obraId}&select=id,id_servico,nome,categoria,avanco_atual,status_atual,data_inicio,data_fim,equipe&order=id_servico`,
    config,
    { staleTime: 5 * 60 * 1000 }
  );

  const pendencias = useSupabaseQuery<Pendencia[]>(
    ['pendencias', config.obraId],
    `pendencias?obra_id=eq.${config.obraId}&status=eq.ABERTA&order=created_at.desc`,
    config,
    { staleTime: 5 * 60 * 1000 }
  );

  const diario = useSupabaseQuery<{ id: string, created_at: string, transcricao: string, narrativa?: string }[]>(
    ['diario_obra', config.obraId],
    `diario_obra?obra_id=eq.${config.obraId}&order=created_at.desc&limit=30`,
    config,
    { staleTime: 5 * 60 * 1000 }
  );

  const notas = useSupabaseQuery<Nota[]>(
    ['notas', config.obraId],
    `notas?obra_id=eq.${config.obraId}&order=data_nota.desc`,
    config,
    { staleTime: 5 * 60 * 1000 }
  );

  const equipes = useSupabaseQuery<Equipe[]>(
    ['equipes_cadastro', config.obraId],
    `equipes_cadastro?obra_id=eq.${config.obraId}&order=nome`,
    config,
    { staleTime: 5 * 60 * 1000 }
  );

  const presencaData = useSupabaseQuery<{ data_presenca: string, nome_equipe: string }[]>(
    ['equipes_presenca', config.obraId],
    `equipes_presenca?obra_id=eq.${config.obraId}&order=data_presenca.desc`,
    config,
    { staleTime: 5 * 60 * 1000 }
  );

  // Effect to sync React Query data to App Context
  useEffect(() => {
    if (servicos.data || pendencias.data || diario.data || notas.data || equipes.data || presencaData.data) {
      const newDiario: Record<string, DiarioEntry> = { ...state.diario };
      const newNarrativas = { ...state.narrativas };
      (diario.data || []).forEach(d => {
        const day = (d.created_at || '').split('T')[0];
        if (!newDiario[day]) newDiario[day] = { texto: '' };
        newDiario[day].texto = d.transcricao;
        (newDiario[day] as any).db_id = d.id;
        if (d.narrativa) newNarrativas[day] = d.narrativa;
      });

      const newPresenca: Record<string, string[]> = {};
      (presencaData.data || []).forEach(p => {
        const day = (p.data_presenca || '').split('T')[0];
        if (!newPresenca[day]) newPresenca[day] = [];
        if (!newPresenca[day].includes(p.nome_equipe)) newPresenca[day].push(p.nome_equipe);
      });

      setState(prev => ({
        ...prev,
        servicos: servicos.data || prev.servicos,
        pendencias: pendencias.data || prev.pendencias,
        diario: Object.keys(newDiario).length > 0 ? newDiario : prev.diario,
        narrativas: Object.keys(newNarrativas).length > 0 ? newNarrativas : prev.narrativas,
        notas: notas.data || prev.notas,
        equipes: equipes.data || prev.equipes,
        presenca: Object.keys(newPresenca).length > 0 ? newPresenca : prev.presenca,
      }));
    }
  }, [servicos.data, pendencias.data, diario.data, notas.data, equipes.data, presencaData.data]);

  // Manual refetch function that triggers all queries
  const loadFromSupabase = async () => {
    if (!config.url || !config.key) {
      setActiveTab('config');
      toast('Configure Supabase primeiro.', 'error');
      return;
    }
    if (!config.obraId) {
      setActiveTab('config');
      toast('Informe o ID da obra.', 'error');
      return;
    }
    setLoadingInitial(true);
    try {
      // Refetch all queries
      await Promise.all([
        servicos.refetch(),
        pendencias.refetch(),
        diario.refetch(),
        notas.refetch(),
        equipes.refetch(),
        presencaData.refetch(),
      ]);
      toast('Dados carregados com sucesso!', 'success');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast('Erro ao carregar: ' + msg, 'error');
    } finally {
      setLoadingInitial(false);
    }
  };

  const syncToSupabase = async () => {
    if (!config.url || !config.key) {
      setActiveTab('config');
      toast('Configure Supabase primeiro.', 'error');
      return;
    }
    if (!state.pendingChanges.length) {
      toast('Nada a sincronizar.', 'info');
      return;
    }
    setSyncing(true);
    let ok = 0, fail = 0;
    for (const ch of state.pendingChanges) {
      try {
        if (ch.table === 'servicos') {
          const s = ch.data as Servico;
          if (s.id && !s.id.startsWith('SRV-')) {
            await sbFetch(`servicos?id=eq.${s.id}`, { method: 'PATCH', body: JSON.stringify({ avanco_atual: s.avanco_atual, status_atual: s.status_atual, data_inicio: s.data_inicio, data_fim: s.data_fim, equipe: s.equipe }), prefer: 'return=minimal' }, config);
          } else {
             await sbFetch('servicos', { method: 'POST', body: JSON.stringify({ ...s, obra_id: config.obraId }) }, config);
          }
        }
        if (ch.table === 'pendencias') {
          await sbFetch('pendencias', { method: 'POST', body: JSON.stringify({ ...ch.data, obra_id: config.obraId }) }, config);
        }
        if (ch.table === 'diario_obra') {
          const d = ch.data as any;
          if (d.db_id) {
            await sbFetch(`diario_obra?id=eq.${d.db_id}`, { method: 'PATCH', body: JSON.stringify({ transcricao: d.transcricao }), prefer: 'return=minimal' }, config);
          } else {
            const ins = await sbFetch('diario_obra', { method: 'POST', body: JSON.stringify({ obra_id: config.obraId, transcricao: d.transcricao }) }, config);
            if (ins?.[0]?.id && d.day) {
              setState(prev => {
                const nd = { ...prev.diario };
                if (!nd[d.day]) nd[d.day] = { texto: '' };
                (nd[d.day] as any).db_id = ins[0].id;
                return { ...prev, diario: nd };
              });
            }
          }
        }
        if (ch.table === 'brain_narrativas') {
          await sbFetch('brain_narrativas', { method: 'POST', body: JSON.stringify({ obra_id: config.obraId, entrada: (ch.data as any).entrada, resposta_ia: (ch.data as any).resposta_ia, confirmado: true }) }, config);
        }
        if (ch.table === 'equipes_presenca') {
          await sbFetch('equipes_presenca', { method: 'POST', body: JSON.stringify({ obra_id: config.obraId, nome_equipe: (ch.data as any).equipe, quantidade: 1, data_presenca: (ch.data as any).dia }) }, config);
        }
        if (ch.table === 'equipes_cadastro') {
          const e = ch.data as Equipe;
          if (e.id) {
             await sbFetch(`equipes_cadastro?id=eq.${e.id}`, { method: 'PATCH', body: JSON.stringify(e) }, config);
          } else {
             await sbFetch('equipes_cadastro', { method: 'POST', body: JSON.stringify({ ...e, obra_id: config.obraId }) }, config);
          }
        }
        if (ch.table === 'notas') {
          await sbFetch('notas', { method: 'POST', body: JSON.stringify({ ...ch.data, obra_id: config.obraId }) }, config);
        }
        if (ch.table === 'narrativas') {
          await sbFetch('diario_obra', { 
            method: 'POST', 
            body: JSON.stringify({ obra_id: config.obraId, created_at: (ch.data as any).dia, narrativa: (ch.data as any).texto }),
            headers: { 'Prefer': 'resolution=merge-duplicates' }
          }, config);
        }
         ok++;
       } catch (e) {
         fail++;
         logger.error(`Sync error for table: ${ch.table}`, e);
       }
     }
     setState(prev => ({ ...prev, pendingChanges: [] }));
     setSyncing(false);
     
     // Invalidate React Query caches for the modified tables to trigger refetch
     if (ok > 0) {
       const tablesToInvalidate = new Set(state.pendingChanges.map(ch => ch.table));
       
       if (tablesToInvalidate.has('servicos')) {
         queryClient.invalidateQueries({ queryKey: ['servicos', config.obraId] });
       }
       if (tablesToInvalidate.has('pendencias')) {
         queryClient.invalidateQueries({ queryKey: ['pendencias', config.obraId] });
       }
       if (tablesToInvalidate.has('diario_obra') || tablesToInvalidate.has('narrativas')) {
         queryClient.invalidateQueries({ queryKey: ['diario_obra', config.obraId] });
       }
       if (tablesToInvalidate.has('notas')) {
         queryClient.invalidateQueries({ queryKey: ['notas', config.obraId] });
       }
       if (tablesToInvalidate.has('equipes_cadastro')) {
         queryClient.invalidateQueries({ queryKey: ['equipes_cadastro', config.obraId] });
       }
       if (tablesToInvalidate.has('equipes_presenca')) {
         queryClient.invalidateQueries({ queryKey: ['equipes_presenca', config.obraId] });
       }
     }
     
     toast(`Sync concluído: ${ok} enviado(s).${fail ? ' Falhas: ' + fail : ''}`, fail ? 'error' : 'success');
   };

  const tabs = [
    { id: 'diario', label: 'Diário', icon: Book },
    { id: 'equipes', label: 'Equipes', icon: CheckSquare },
    { id: 'orcamento', label: 'Orçamento', icon: FileText },
    { id: 'cronograma', label: 'Cronograma', icon: Calendar },
    { id: 'notas', label: 'Notas', icon: MessageSquare },
    { id: 'fotos', label: 'Fotos', icon: ImageIcon },
    { id: 'relatorios', label: 'Relatórios', icon: FileBarChart },
    { id: 'config', label: 'Config', icon: Settings },
  ];

  const pendingCount = state.pendingChanges?.length || 0;

  return (
    <div className="flex flex-col h-screen bg-bg text-t1 font-sans overflow-hidden">
      {/* Topbar */}
      <div className="flex items-center bg-s1 border-b border-b1 h-[56px] shrink-0 px-4">
        <div className="flex items-center gap-3 border-r border-b1 pr-6 h-full">
          <div className="bg-brand-green/10 p-1.5 rounded-md">
            <TrendingUp className="w-5 h-5 text-brand-green" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="font-mono text-[9px] text-brand-green tracking-[0.15em] uppercase font-bold">Obra ativa</div>
            <div className="text-[14px] font-bold text-t1 leading-tight">Restaurante Badida</div>
          </div>
        </div>
        
        <div className="flex h-full flex-1 overflow-x-auto no-scrollbar px-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 h-full cursor-pointer text-[11px] font-bold tracking-[0.05em] uppercase border-b-2 whitespace-nowrap transition-all ${
                activeTab === t.id 
                  ? 'text-brand-green border-brand-green bg-brand-green/5' 
                  : 'text-t3 border-transparent hover:text-t2 hover:bg-s2'
              }`}
            >
              <t.icon className={`w-[14px] h-[14px] shrink-0 ${activeTab === t.id ? 'opacity-100' : 'opacity-60'}`} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 border-l border-b1 pl-6 h-full shrink-0">
          <div className="flex items-center gap-2 font-mono text-[10px] text-t3 bg-s2 px-3 py-1.5 rounded-full border border-b1">
            <div className={`w-2 h-2 rounded-full shrink-0 ${pendingCount > 0 ? 'bg-brand-amber animate-pulse shadow-[0_0_8px_rgba(210,153,34,0.4)]' : 'bg-brand-green shadow-[0_0_8px_rgba(63,185,80,0.4)]'}`}></div>
            <span className="font-bold">{pendingCount > 0 ? `${pendingCount} PENDENTE${pendingCount > 1 ? 'S' : ''}` : 'SINCRONIZADO'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={loadFromSupabase} 
              disabled={loadingInitial}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer font-sans text-[11px] font-bold tracking-[0.05em] whitespace-nowrap transition-all bg-s2 border border-b1 text-t2 hover:border-b3 hover:text-t1 disabled:opacity-40"
            >
              <CloudDownload className="w-4 h-4" /> {loadingInitial ? '...' : 'CARREGAR'}
            </button>
            <button 
              onClick={syncToSupabase}
              disabled={syncing || pendingCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer font-sans text-[11px] font-extrabold tracking-[0.05em] whitespace-nowrap transition-all bg-brand-green text-[#0a0d0a] hover:bg-brand-green2 shadow-lg shadow-brand-green/10 disabled:opacity-40"
            >
              <CloudUpload className="w-4 h-4" /> {syncing ? '...' : 'SYNC'}
            </button>
          </div>
        </div>
      </div>

      {/* Pages */}
      <div className="overflow-y-auto p-8 flex-1 bg-[radial-gradient(circle_at_top_right,rgba(63,185,80,0.03),transparent_40%)]">
        {activeTab === 'diario' && <Diario />}
        {activeTab === 'equipes' && <Equipes />}
        {activeTab === 'orcamento' && <Servicos />}
        {activeTab === 'cronograma' && <Cronograma />}
        {activeTab === 'notas' && <Notas />}
        {activeTab === 'fotos' && <Fotos />}
        {activeTab === 'relatorios' && <Relatorios />}
        {activeTab === 'config' && <ConfigPage />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Main />
    </AppProvider>
  );
}
