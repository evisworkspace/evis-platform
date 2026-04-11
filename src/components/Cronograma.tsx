import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Servico } from '../types';

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${className}`}>
    {children}
  </span>
);

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
const DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function Cronograma() {
  const { state, setState, markPending } = useAppContext();
  const [search, setSearch] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [selectedEquipe, setSelectedEquipe] = useState('');
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7); // Start 7 days ago
    return d;
  });
  
  const daysToShow = 60; // Show 60 days
  const colWidth = 28; // Width of each day column
  
  // Helper: converte uma data (string YYYY-MM-DD ou Date) em string YYYY-MM-DD sem desvio de timezone
  const toDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  const dates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < daysToShow; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [startDate, daysToShow]);

  // Pre-compute date strings for performance
  const dateStrings = useMemo(() => dates.map(toDateStr), [dates]);

  const filteredServicos = state.servicos.filter(s => {
    if (hideCompleted && s.avanco_atual >= 100) return false;
    if (selectedEquipe && s.equipe !== selectedEquipe) return false;
    if (search && !s.nome.toLowerCase().includes(search.toLowerCase()) && !s.id_servico.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleUpdate = <K extends keyof Servico>(idOrSrvId: string, field: K, value: Servico[K]) => {
    const newServicos = [...state.servicos];
    const idx = newServicos.findIndex(s => s.id === idOrSrvId || s.id_servico === idOrSrvId);
    if (idx >= 0) {
      newServicos[idx] = { ...newServicos[idx], [field]: value };
      setState({ ...state, servicos: newServicos });
      markPending('servicos', newServicos[idx]);
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    setStartDate(d);
  };

  const [viewMode, setViewMode] = useState<'gantt' | 'daily'>('gantt');

  const dailyTasks = useMemo(() => {
    const map: Record<string, Servico[]> = {};
    dates.forEach((_, i) => {
      const dStr = dateStrings[i];
      map[dStr] = state.servicos.filter(s => {
        if (!s.data_inicio || !s.data_fim) return false;
        const start = s.data_inicio.split('T')[0];
        const end = s.data_fim.split('T')[0];
        return dStr >= start && dStr <= end;
      });
    });
    return map;
  }, [dates, dateStrings, state.servicos]);

  const todayStr = toDateStr(new Date());

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <button onClick={() => shiftDate(-15)} className="p-1.5 border border-b2 rounded hover:bg-s2 text-t2"><ChevronLeft size={16} /></button>
          <button onClick={() => setStartDate(new Date(new Date().setDate(new Date().getDate() - 7)))} className="px-3 py-1.5 border border-b2 rounded text-[11px] font-bold hover:bg-s2 text-t1">HOJE</button>
          <button onClick={() => shiftDate(15)} className="p-1.5 border border-b2 rounded hover:bg-s2 text-t2"><ChevronRight size={16} /></button>
          
          <div className="h-6 w-[1px] bg-b2 mx-2" />
          
          <div className="flex bg-s1 border border-b2 rounded p-0.5">
            <button 
              onClick={() => setViewMode('gantt')}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'gantt' ? 'bg-b2 text-brand-green shadow-sm' : 'text-t3 hover:text-t2'}`}
            >
              Gantt
            </button>
            <button 
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${viewMode === 'daily' ? 'bg-b2 text-brand-green shadow-sm' : 'text-t3 hover:text-t2'}`}
            >
              Diário
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 text-t3" size={14} />
            <input 
              type="text" 
              placeholder="Buscar serviço..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-s1 border border-b2 rounded text-[12px] text-t1 focus:outline-none focus:border-brand-green placeholder:text-t4"
            />
          </div>
          <select 
            value={selectedEquipe} 
            onChange={e => setSelectedEquipe(e.target.value)}
            className="px-3 py-1.5 bg-s1 border border-b2 rounded text-[12px] text-t2 focus:outline-none focus:border-brand-green"
          >
            <option value="">Todas as equipes</option>
            {state.equipes.map(eq => (
              <option key={eq.cod} value={eq.nome}>{eq.nome}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-[12px] text-t2 cursor-pointer select-none">
            <input type="checkbox" checked={hideCompleted} onChange={e => setHideCompleted(e.target.checked)} className="rounded border-b2 text-brand-green focus:ring-brand-green bg-s1" />
            Ocultar 100%
          </label>
        </div>
      </div>

      {viewMode === 'gantt' ? (
        /* Gantt Container */
        <div className="flex flex-1 border border-b2 rounded-lg overflow-hidden bg-bg relative">
          
          {/* Header Row (Sticky Top) */}
          <div className="absolute top-0 left-0 right-0 h-12 flex bg-s1 z-20 border-b border-b2">
            {/* Left Header */}
            <div className="w-80 flex-shrink-0 border-r border-b2 flex items-center px-4 text-[11px] font-bold text-t3 bg-s1 sticky left-0 z-30 uppercase tracking-widest">
              Serviço
            </div>
            {/* Right Header */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Months */}
              <div className="flex flex-1 border-b border-b2">
                {(() => {
                  const months = [];
                  let currentMonth = dates[0].getMonth();
                  let count = 0;
                  for (let i = 0; i < dates.length; i++) {
                    if (dates[i].getMonth() === currentMonth) {
                      count++;
                    } else {
                      months.push({ month: currentMonth, year: dates[i-1].getFullYear(), count });
                      currentMonth = dates[i].getMonth();
                      count = 1;
                    }
                  }
                  months.push({ month: currentMonth, year: dates[dates.length-1].getFullYear(), count });
                  
                  return months.map((m, i) => (
                    <div key={i} className="flex items-center justify-center text-[10px] font-bold text-t3 border-r border-b2 bg-s1/50" style={{ width: `${m.count * colWidth}px`, minWidth: `${m.count * colWidth}px` }}>
                      {MONTHS[m.month]} {m.year}
                    </div>
                  ));
                })()}
              </div>
              {/* Days */}
              <div className="flex flex-1">
                {dates.map((d, i) => {
                  const isToday = d.toISOString().split('T')[0] === todayStr;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div key={i} className={`flex flex-col items-center justify-center flex-shrink-0 border-r border-b2 text-[9px] ${isToday ? 'bg-brand-green/10 text-brand-green font-bold' : isWeekend ? 'bg-s1 text-t4' : 'text-t3'}`} style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}>
                      <span>{DAYS[d.getDay()]}</span>
                      <span>{d.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Body (Scrollable) */}
          <div className="absolute top-12 left-0 right-0 bottom-0 overflow-auto">
             {(() => {
               const groups: Record<string, typeof filteredServicos> = {};
               filteredServicos.forEach(s => {
                 const cat = s.categoria || 'Sem Categoria';
                 if (!groups[cat]) groups[cat] = [];
                 groups[cat].push(s);
               });
               
               return Object.entries(groups).map(([cat, services]) => (
                 <React.Fragment key={cat}>
                    {/* Category Header */}
                    <div className="flex bg-s2/50 border-b border-b2/50 group w-max min-w-full sticky top-0 z-10">
                       <div className="w-80 flex-shrink-0 border-r border-b2/50 p-2 pl-4 flex items-center bg-s2/80 sticky left-0 z-20">
                          <span className="text-[11px] font-extrabold text-brand-green uppercase tracking-widest">{cat}</span>
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-s1 text-[9px] text-t3 border border-b2">{services.length}</span>
                       </div>
                       <div className="flex-1 flex">
                          {dates.map((d, i) => (
                             <div key={i} className="flex-shrink-0 border-r border-b2/10 bg-s2/20" style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }} />
                          ))}
                       </div>
                    </div>
                    
                    {services.map(s => {
                      // Calculate bar position
                      let startIdx = -1;
                      let endIdx = -1;
                      
                      if (s.data_inicio && s.data_fim) {
                        const startStr = s.data_inicio.split('T')[0];
                        const endStr = s.data_fim.split('T')[0];
                        
                        startIdx = dateStrings.findIndex(d => d === startStr);
                        endIdx = dateStrings.findIndex(d => d === endStr);
                        
                        // Handle cases where dates are outside the current view
                        if (startIdx === -1 && new Date(startStr) < dates[0]) startIdx = 0;
                        if (endIdx === -1 && new Date(endStr) > dates[dates.length - 1]) endIdx = dates.length - 1;
                      }

                      const isPending = state.pendingChanges.some(ch => {
                        const d = ch.data as any;
                        return ch.table === 'servicos' && (d.id === s.id || ('id_servico' in d && d.id_servico === s.id_servico));
                      });

                      return (
                        <div key={s.id} className="flex border-b border-b2/30 group hover:bg-s1/30 w-max min-w-full">
                          {/* Left Cell (Sticky Left) */}
                          <div className={`w-80 flex-shrink-0 border-r border-b2/30 p-3 bg-bg sticky left-0 z-10 group-hover:bg-s1/30 ${isPending ? 'bg-brand-amber/5' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-bold bg-s3 px-1.5 py-0.5 rounded text-t2">{s.id_servico}</span>
                              <div className="w-16 shrink-0">
                               <input 
                                 type="number" 
                                 value={s.avanco_atual} 
                                 onChange={e => handleUpdate(s.id || s.id_servico, 'avanco_atual', Number(e.target.value))}
                                 className="w-full text-right text-[11px] bg-s1 border border-b2 rounded px-1 py-0.5 text-t1 outline-none focus:border-brand-green"
                                 min="0" max="100"
                               />
                               <span className="text-[10px] text-t3 font-mono">%</span>
                             </div>
                            </div>
                            <div className="text-[12px] font-medium text-t1 leading-tight mb-2">{s.nome}</div>
                            <select 
                               value={s.equipe || ''} 
                               onChange={e => handleUpdate(s.id || s.id_servico, 'equipe', e.target.value)}
                               className="w-full text-[10px] text-t3 bg-transparent border-none p-0 mb-2 focus:ring-0 cursor-pointer hover:text-t2 transition-colors"
                             >
                              <option value="" className="bg-s2">Sem equipe</option>
                              {state.equipes.map(eq => (
                                <option key={eq.cod} value={eq.nome} className="bg-s2">{eq.nome}</option>
                              ))}
                            </select>
                            <div className="flex items-center gap-2 text-[10px]">
                              <div className="flex-1">
                                <div className="text-t4 mb-0.5 font-bold uppercase tracking-tighter">Início</div>
                                <input 
                                  type="date" 
                                  value={s.data_inicio ? s.data_inicio.split('T')[0] : ''} 
                                  onChange={e => handleUpdate(s.id || s.id_servico, 'data_inicio', e.target.value)}
                                  className="w-full bg-s1 border border-b2 rounded px-1.5 py-1 text-t2 outline-none focus:border-brand-green"
                                />
                              </div>
                              <div className="flex-1">
                                <div className="text-t4 mb-0.5 font-bold uppercase tracking-tighter">Fim</div>
                                <input 
                                  type="date" 
                                  value={s.data_fim ? s.data_fim.split('T')[0] : ''} 
                                  onChange={e => handleUpdate(s.id || s.id_servico, 'data_fim', e.target.value)}
                                  className="w-full bg-s1 border border-b2 rounded px-1.5 py-1 text-t2 outline-none focus:border-brand-green"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Right Cell (Timeline Row) */}
                          <div className="flex relative">
                            {/* Grid lines */}
                            {dates.map((d, i) => {
                              const isToday = d.toISOString().split('T')[0] === todayStr;
                              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                              return (
                                <div key={i} className={`flex-shrink-0 border-r border-b2/20 ${isToday ? 'bg-brand-green/5' : isWeekend ? 'bg-s1/50' : ''}`} style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }} />
                              );
                            })}
                            
                            {/* Bar */}
                            {startIdx >= 0 && endIdx >= startIdx && (
                              <div 
                                className="absolute top-1/2 -translate-y-1/2 h-6 bg-brand-green/40 border border-brand-green/60 rounded-sm shadow-sm flex items-center px-2 overflow-hidden cursor-pointer hover:bg-brand-green/60 transition-colors"
                                style={{ 
                                  left: `${startIdx * colWidth + 4}px`, 
                                  width: `${(endIdx - startIdx + 1) * colWidth - 8}px` 
                                }}
                              >
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-brand-green/40"
                                  style={{ width: `${s.avanco_atual}%` }}
                                />
                                <span className="text-[9px] text-white font-bold relative z-10 truncate drop-shadow-md">
                                  {s.avanco_atual}%
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                 </React.Fragment>
               ));
             })()}
          </div>
        </div>
      ) : (
        /* Daily View */
        <div className="flex-1 overflow-auto border border-b2 rounded-lg bg-s1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dates.map((d, i) => {
              const dStr = d.toISOString().split('T')[0];
              const tasks = dailyTasks[dStr] || [];
              const isToday = dStr === todayStr;
              const isWeekend = d.getDay() === 0 || d.getDay() === 6;

              return (
                <div key={i} className={`flex flex-col border rounded-lg overflow-hidden transition-all ${isToday ? 'border-brand-green ring-1 ring-brand-green/50 bg-brand-green/5' : 'border-b2 bg-bg hover:border-b3'}`}>
                  <div className={`px-3 py-2 border-b flex justify-between items-center ${isToday ? 'bg-brand-green/10 border-brand-green/20' : 'bg-s2 border-b2'}`}>
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-brand-green' : 'text-t3'}`}>
                        {format(d, 'EEEE', { locale: ptBR })}
                      </span>
                      <span className="text-[14px] font-bold text-t1">
                        {format(d, "dd 'de' MMMM", { locale: ptBR })}
                      </span>
                    </div>
                    {isToday && <Badge className="bg-brand-green text-bg font-bold text-[9px]">HOJE</Badge>}
                  </div>
                  <div className="p-3 flex-1 space-y-2">
                    {tasks.length === 0 ? (
                      <div className="h-full flex items-center justify-center py-8">
                        <span className="text-[10px] text-t4 font-mono uppercase">Sem atividades</span>
                      </div>
                    ) : (
                      tasks.map(t => (
                        <div key={t.id} className="p-2 rounded bg-s1 border border-b2 text-[11px] space-y-1 group hover:border-b3 transition-colors">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-t1 leading-tight">{t.nome}</span>
                            <span className="text-[9px] font-mono text-brand-green">{t.avanco_atual}%</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-t3">
                            <span className="bg-s3 px-1 rounded text-t2">{t.equipe || 'Sem equipe'}</span>
                            <span className="text-t4">{t.id_servico}</span>
                          </div>
                          <div className="h-1 w-full bg-s3 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-brand-green/60" style={{ width: `${t.avanco_atual}%` }} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
