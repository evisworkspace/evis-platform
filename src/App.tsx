import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './AppContext';
import { Servico, Pendencia, Equipe, Nota, Foto, DiarioEntry, PendingChange } from './types';
import { 
  Book, CheckSquare, FileText, Image as ImageIcon, FileBarChart, Settings, CloudDownload, CloudUpload, Calendar, TrendingUp, MessageSquare,
  Building2, MapPin, Users, Camera, BarChart, Activity, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Layers, Maximize
} from 'lucide-react';
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
    `servicos?obra_id=eq.${config.obraId}&select=id,id_servico,nome,categoria,avanco_atual,status_atual,data_inicio,data_fim,equipe&order=data_inicio`,
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

  const presencaData = useSupabaseQuery<{ data_presenca: string, equipe_cod: string }[]>(
    ['equipes_presenca', config.obraId],
    `equipes_presenca?obra_id=eq.${config.obraId}&order=data_presenca.desc`,
    config,
    { staleTime: 5 * 60 * 1000 }
  );

  const fotosData = useSupabaseQuery<Foto[]>(
    ['fotos', config.obraId],
    `fotos?obra_id=eq.${config.obraId}&order=data_foto.desc`,
    config,
    { staleTime: 5 * 60 * 1000 }
  );

  // Effect to sync React Query data to App Context
  useEffect(() => {
    if (servicos.data || pendencias.data || diario.data || notas.data || equipes.data || presencaData.data || fotosData.data) {
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
        if (!newPresenca[day].includes(p.equipe_cod)) newPresenca[day].push(p.equipe_cod);
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
        fotos: fotosData.data || prev.fotos,
      }));
    }
  }, [servicos.data, pendencias.data, diario.data, notas.data, equipes.data, presencaData.data, fotosData.data]);

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
            await sbFetch(`servicos?id=eq.${s.id}`, { 
              method: 'PATCH', 
              body: JSON.stringify({ 
                avanco_atual: s.avanco_atual, 
                status_atual: s.status_atual, 
                data_inicio: s.data_inicio, 
                data_fim: s.data_fim, 
                equipe: s.equipe 
              }), 
              prefer: 'return=minimal' 
            }, config);
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
          const dPresenca = ch.data as unknown as { equipe: string, dia: string };
          await sbFetch('equipes_presenca', { 
            method: 'POST', 
            body: JSON.stringify({ 
              obra_id: config.obraId, 
              equipe_cod: dPresenca.equipe, 
              data_presenca: dPresenca.dia 
            }) 
          }, config);
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
        if (ch.table === 'fotos') {
          await sbFetch('fotos', { method: 'POST', body: JSON.stringify({ ...ch.data, obra_id: config.obraId }) }, config);
        }
        if (ch.table === 'narrativas') {
          await sbFetch('diario_obra', { 
            method: 'POST', 
            body: JSON.stringify({ obra_id: config.obraId, created_at: (ch.data as any).dia, narrativa: (ch.data as any).texto }),
            headers: { 'Prefer': 'resolution=merge-duplicates' }
          }, config);
        }
        if (ch.table === 'relatorios_semanais') {
          // Persistência da Snapshot do Relatório Semanal no BD
          // OBS: A tabela relatorios_semanais deve ser criada no Supabase para uso em produção, caso ainda não exista.
          await sbFetch('relatorios_semanais', { 
             method: 'POST', 
             body: JSON.stringify({ obra_id: config.obraId, data_snapshot: ch.data, semana: (ch.data as any).id }) 
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
        if (tablesToInvalidate.has('fotos')) {
          queryClient.invalidateQueries({ queryKey: ['fotos', config.obraId] });
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
      {/* Skip to Content Link (WCAG AA) */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-green focus:text-bg focus:top-2 focus:left-2 focus:rounded-md focus:font-bold focus:shadow-xl transition-all"
      >
        Pular para o conteúdo principal
      </a>

      <header className="flex items-center bg-s1 border-b border-b1 h-[56px] shrink-0 px-4">
        {/* ... header existente mantido ... */}
        <div className="flex items-center gap-3 border-r border-b1 pr-6 h-full">
          <div className="bg-brand-green/10 p-1.5 rounded-md">
            <TrendingUp className="w-5 h-5 text-brand-green" />
          </div>
          <div className="flex flex-col justify-center">
            <div className="font-mono text-[9px] text-brand-green tracking-[0.15em] uppercase font-bold">Obra ativa</div>
            <h1 className="text-[14px] font-bold text-t1 leading-tight">Restaurante Badida</h1>
          </div>
        </div>
        
        <nav className="flex h-full flex-1 overflow-x-auto no-scrollbar px-2" aria-label="Navegação Principal">
          <ul className="flex h-full list-none p-0 m-0">
            {tabs.map(t => (
              <li key={t.id} className="h-full">
                <button
                  onClick={() => setActiveTab(t.id)}
                  aria-current={activeTab === t.id ? 'page' : undefined}
                  className={`flex items-center gap-2 px-4 h-full cursor-pointer text-[11px] font-bold tracking-[0.05em] uppercase border-b-2 whitespace-nowrap transition-all ${
                    activeTab === t.id 
                      ? 'text-brand-green border-brand-green bg-brand-green/5' 
                      : 'text-t3 border-transparent hover:text-t2 hover:bg-s2'
                  }`}
                >
                  <t.icon aria-hidden="true" className={`w-[14px] h-[14px] shrink-0 ${activeTab === t.id ? 'opacity-100' : 'opacity-60'}`} />
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

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
      </header>

      {/* Global Filter Bar - mostra para Diario, Equipes, Orcamento, Cronograma, Notas */}
      {activeTab !== 'config' && activeTab !== 'fotos' && (
        <div className="flex items-center gap-4 px-6 py-3 bg-s1 border-b border-b1 shrink-0 overflow-x-auto no-scrollbar">
          
          {/* Navegação de Data */}
          <div className="flex items-center bg-s2 border border-b1 rounded-full px-1 py-1">
            <button 
              onClick={() => {
                const d = new Date(state.globalFilter.referenceDate);
                d.setDate(d.getDate() - state.globalFilter.periodDays);
                setState(p => ({ ...p, globalFilter: { ...p.globalFilter, referenceDate: d.toISOString().split('T')[0] } }));
              }}
              className="p-1.5 text-t3 hover:text-t1 hover:bg-s3 rounded-full transition-colors"
            >
              <ChevronsLeft size={14} />
            </button>
            <button 
              onClick={() => {
                const d = new Date(state.globalFilter.referenceDate);
                d.setDate(d.getDate() - 1);
                setState(p => ({ ...p, globalFilter: { ...p.globalFilter, referenceDate: d.toISOString().split('T')[0] } }));
              }}
              className="p-1.5 text-t3 hover:text-t1 hover:bg-s3 rounded-full transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            
            <button 
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setState(p => ({ ...p, globalFilter: { ...p.globalFilter, referenceDate: today } }));
              }}
              className="px-4 py-1 text-[11px] font-black uppercase tracking-widest text-brand-green hover:bg-s3 rounded-full transition-colors"
            >
              HOJE
            </button>

            <button 
              onClick={() => {
                const d = new Date(state.globalFilter.referenceDate);
                d.setDate(d.getDate() + 1);
                setState(p => ({ ...p, globalFilter: { ...p.globalFilter, referenceDate: d.toISOString().split('T')[0] } }));
              }}
              className="p-1.5 text-t3 hover:text-t1 hover:bg-s3 rounded-full transition-colors"
            >
              <ChevronRight size={14} />
            </button>
            <button 
               onClick={() => {
                const d = new Date(state.globalFilter.referenceDate);
                d.setDate(d.getDate() + state.globalFilter.periodDays);
                setState(p => ({ ...p, globalFilter: { ...p.globalFilter, referenceDate: d.toISOString().split('T')[0] } }));
              }}
              className="p-1.5 text-t3 hover:text-t1 hover:bg-s3 rounded-full transition-colors"
             >
              <ChevronsRight size={14} />
            </button>
          </div>

          <div className="w-px h-4 bg-b1 mx-1 shrink-0"></div>

          {/* Date Picker */}
          <div className="flex items-center">
            <input 
              type="date" 
              value={state.globalFilter.referenceDate}
              onChange={(e) => setState(p => ({ ...p, globalFilter: { ...p.globalFilter, referenceDate: e.target.value } }))}
              className="bg-s2 border border-b1 rounded-full px-4 py-1.5 text-[12px] font-mono text-t2 outline-none focus:border-brand-green transition-colors [color-scheme:dark]"
            />
          </div>

          <div className="w-px h-4 bg-b1 mx-1 shrink-0"></div>

          {/* Period Dropdown */}
          <select 
            value={state.globalFilter.periodDays}
            onChange={(e) => setState(p => ({ ...p, globalFilter: { ...p.globalFilter, periodDays: parseInt(e.target.value) } }))}
            className="bg-s2 border border-b1 rounded-full px-4 py-1.5 text-[12px] font-mono text-t2 outline-none focus:border-brand-green transition-colors appearance-none"
          >
            <option value={1}>1 dia</option>
            <option value={7}>7 dias</option>
            <option value={15}>15 dias</option>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
          </select>

          <div className="w-px h-4 bg-b1 mx-1 shrink-0"></div>

          {/* View Modes Toggle */}
          <div className="flex items-center bg-s2 border border-b1 rounded-full p-1">
            <button 
              onClick={() => setState(p => ({ ...p, globalFilter: { ...p.globalFilter, viewMode: 'time' } }))}
              className={`p-1.5 rounded-full transition-colors ${state.globalFilter.viewMode === 'time' ? 'bg-s4 text-t1' : 'text-t3 hover:text-t2'}`}
            >
              <Calendar size={14} />
            </button>
            <button 
              onClick={() => setState(p => ({ ...p, globalFilter: { ...p.globalFilter, viewMode: 'layers' } }))}
              className={`p-1.5 rounded-full transition-colors ${state.globalFilter.viewMode === 'layers' ? 'bg-s4 text-brand-green' : 'text-t3 hover:text-t2'}`}
            >
              <Layers size={14} />
            </button>
            <button 
              onClick={() => setState(p => ({ ...p, globalFilter: { ...p.globalFilter, viewMode: 'people' } }))}
              className={`p-1.5 rounded-full transition-colors ${state.globalFilter.viewMode === 'people' ? 'bg-s4 text-t1' : 'text-t3 hover:text-t2'}`}
            >
              <Users size={14} />
            </button>
          </div>

          <div className="w-px h-4 bg-b1 mx-1 shrink-0"></div>

          {/* Expand */}
          <button className="p-2 border border-b1 bg-s2 text-brand-green hover:bg-s3 rounded-full transition-colors">
            <Maximize size={14} />
          </button>
          
        </div>
      )}

      {/* Pages */}
      <main 
        id="main-content" 
        tabIndex={-1} 
        className="overflow-y-auto p-8 flex-1 bg-[radial-gradient(circle_at_top_right,rgba(63,185,80,0.03),transparent_40%)] outline-none"
      >
        {activeTab === 'diario' && <Diario />}
        {activeTab === 'equipes' && <Equipes />}
        {activeTab === 'orcamento' && <Servicos />}
        {activeTab === 'cronograma' && <Cronograma />}
        {activeTab === 'notas' && <Notas />}
        {activeTab === 'fotos' && <Fotos />}
        {activeTab === 'relatorios' && <Relatorios />}
        {activeTab === 'config' && <ConfigPage />}
      </main>
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
