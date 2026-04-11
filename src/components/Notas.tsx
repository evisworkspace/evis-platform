import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { 
  MessageSquare, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Trash2, 
  ChevronDown, 
  ChevronUp,
  X
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function Accordion({ 
  num, 
  title, 
  subtitle, 
  isOpen, 
  onToggle, 
  children,
  icon
}: any) {
  return (
    <div className="border border-b1 mb-3 rounded-lg overflow-hidden bg-bg">
      <button 
        onClick={onToggle} 
        className="w-full flex items-center justify-between py-3 px-4 bg-s1/50 hover:bg-s1 transition-colors"
      >
        <div className="flex items-center gap-3">
          {num && <div className="bg-[#0b1412] text-brand-green font-bold w-6 h-6 flex items-center justify-center text-[10px] rounded shrink-0">{num}</div>}
          {icon && <div className="text-t3 shrink-0">{icon}</div>}
          <span className="text-[12px] font-bold text-t1 uppercase tracking-widest">{title}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-mono text-t3 truncate">{subtitle}</span>
          {isOpen ? <ChevronUp size={14} className="text-t4 shrink-0" /> : <ChevronDown size={14} className="text-t4 shrink-0" />}
        </div>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-b1 bg-s1/10">
          {children}
        </div>
      )}
    </div>
  );
}

export default function Notas() {
  const { state, setState, markPending } = useAppContext();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    notas: true,
    pendencias: false,
    historico: false
  });
  const [tipo, setTipo] = useState('observacao');
  const [texto, setTexto] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});

  const currentDay = state.currentDay;
  const currentNarrativa = state.narrativas[currentDay] || '';

  const toggleSection = (s: string) => setOpenSections(p => ({ ...p, [s]: !p[s] }));

  // ---- FUNÇÕES DE NOTAS ----
  const addNota = () => {
    if (!texto.trim()) return;
    const n = { id: crypto.randomUUID(), tipo: tipo as any, texto, data_nota: new Date().toISOString() };
    setState(prev => ({ ...prev, notas: [n, ...prev.notas] }));
    markPending('notas', n);
    setTexto('');
  };
  const deleteNota = (id: string) => setState(prev => ({ ...prev, notas: prev.notas.filter(n => n.id !== id) }));
  
  const updateNarrativa = (val: string) => {
    setState(prev => ({ ...prev, narrativas: { ...prev.narrativas, [currentDay]: val } }));
    markPending('narrativas', { dia: currentDay, texto: val });
  };

  const getIcon = (t: string) => {
    switch(t) {
      case 'alerta': return <AlertCircle className="w-4 h-4 text-brand-red" />;
      case 'decisao': return <CheckCircle className="w-4 h-4 text-brand-green" />;
      case 'lembrete': return <Clock className="w-4 h-4 text-brand-amber" />;
      default: return <MessageSquare className="w-4 h-4 text-brand-blue" />;
    }
  };
  const getLabel = (t: string) => {
    switch(t) {
      case 'alerta': return 'Alerta';
      case 'decisao': return 'Decisão';
      case 'lembrete': return 'Lembrete';
      default: return 'Observação';
    }
  };

  // ---- DADOS COMPUTADOS ----
  const currentDayNotes = useMemo(() => state.notas.filter(n => isSameDay(new Date(n.data_nota), new Date(currentDay))), [state.notas, currentDay]);
  const abertas = state.pendencias.filter(p => p.status === 'ABERTA');
  
  const historyByWeek = useMemo(() => {
    const weeks: Record<string, any> = {};
    const daysWithActivity = new Set([...Object.keys(state.narrativas), ...state.notas.map(n => n.data_nota.split('T')[0])]);

    Array.from(daysWithActivity).sort().reverse().forEach(day => {
      const date = new Date(day);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      if (!weeks[weekKey]) weeks[weekKey] = { label: `Semana ${format(weekStart, 'w')}`, start: weekStart, visits: [] };
      weeks[weekKey].visits.push({ day, narrativa: state.narrativas[day], notes: state.notas.filter(n => n.data_nota.split('T')[0] === day) });
    });
    return weeks;
  }, [state.narrativas, state.notas]);

  const updatePendencia = (id: string, field: string, value: string) => {
    setState(prev => {
      const newPend = prev.pendencias.map(p => p.id === id ? { ...p, [field]: value } : p);
      markPending('pendencias', newPend.find(p => p.id === id));
      return { ...prev, pendencias: newPend };
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-bold text-t1 uppercase tracking-tight">Registro de Diário</h2>
        <div className="text-[11px] font-mono text-t3 uppercase tracking-widest">{format(new Date(currentDay), "dd/MM/yyyy")}</div>
      </div>

      {/* 6 PENDÊNCIAS */}
      <Accordion 
        num="6" 
        title="Pendências" 
        subtitle={`${abertas.length} abertas (${state.pendencias.length} total)`} 
        isOpen={openSections.pendencias}
        onToggle={() => toggleSection('pendencias')}
      >
        <div className="flex flex-col gap-3">
          {state.pendencias.map(p => (
            <div key={p.id} className="bg-bg border border-b1 rounded-lg p-3 grid grid-cols-[1fr_120px_24px] gap-3 items-start hover:border-b2 transition-colors">
              <div className="flex flex-col gap-2">
                <input 
                  value={p.descricao} 
                  onChange={e => updatePendencia(p.id, 'descricao', e.target.value)}
                  className="bg-transparent text-[13px] text-t1 outline-none w-full border-b border-transparent focus:border-b1 pb-1"
                />
                <div className="flex items-center gap-2">
                  <select 
                    value={p.prioridade} 
                    onChange={e => updatePendencia(p.id, 'prioridade', e.target.value)}
                    className="bg-s2 border border-b1 text-t2 text-[10px] rounded px-2 py-1 outline-none uppercase font-bold tracking-wider"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${p.status === 'RESOLVIDA' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-amber/10 text-brand-amber'}`}>
                    {p.status}
                  </span>
                </div>
              </div>
              <select 
                value={p.status} 
                onChange={e => updatePendencia(p.id, 'status', e.target.value)}
                className="bg-s3 border border-b1 text-[11px] font-bold uppercase tracking-wider rounded p-1.5 outline-none text-t1"
              >
                <option value="ABERTA">EM ANDAMENTO</option>
                <option value="RESOLVIDA">RESOLVIDA</option>
              </select>
              <button className="text-t4 hover:text-brand-red p-1"><X size={14}/></button>
            </div>
          ))}
          {state.pendencias.length === 0 && <div className="text-center text-t4 text-xs font-mono uppercase py-4">Nenhuma pendência</div>}
        </div>
      </Accordion>

      {/* 8 NOTAS & VISITA */}
      <Accordion 
        num="8" 
        title="Notas & Visita" 
        subtitle={`${currentDayNotes.length} notas`} 
        isOpen={openSections.notas}
        onToggle={() => toggleSection('notas')}
      >
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-2 px-1">Narrativa da Visita</div>
            <textarea 
              value={currentNarrativa}
              onChange={e => updateNarrativa(e.target.value)}
              placeholder="Descreva os principais acontecimentos da visita..."
              className="w-full min-h-[120px] bg-bg border border-b1 rounded-lg p-3 text-[13px] text-t1 leading-relaxed outline-none focus:border-brand-green transition-colors resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[10px] font-bold text-t3 uppercase tracking-widest">Notas Estruturadas</span>
            </div>
            
            <div className="flex flex-col gap-2">
              {currentDayNotes.map(n => (
                <div key={n.id} className="flex gap-3 bg-bg border border-b1 rounded-lg p-3 hover:border-b2 transition-colors relative group">
                  <div className="flex-col gap-1 w-[100px] shrink-0 border-r border-b1 pr-2">
                    <div className="flex items-center gap-1.5">
                      {getIcon(n.tipo)}
                      <span className="text-[10px] font-bold text-t3 uppercase">{getLabel(n.tipo)}</span>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <p className="text-[12px] text-t2 leading-snug">{n.texto}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] font-mono text-t4">{format(new Date(n.data_nota), 'dd/MM/yyyy HH:mm')}</span>
                    <button onClick={() => deleteNota(n.id)} className="text-t4 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-all absolute right-2 bottom-2">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="flex gap-2 mt-2">
                <select 
                  value={tipo} 
                  onChange={e => setTipo(e.target.value)} 
                  className="bg-bg border border-b1 rounded-lg px-2 text-[11px] text-t2 outline-none uppercase font-bold tracking-wider shrink-0"
                >
                  <option value="observacao">Observação</option>
                  <option value="decisao">Decisão</option>
                  <option value="alerta">Alerta</option>
                  <option value="lembrete">Lembrete</option>
                </select>
                <input 
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addNota()}
                  placeholder="Nova nota..."
                  className="flex-1 bg-bg border border-b1 rounded-lg px-3 py-2 text-[13px] text-t1 outline-none focus:border-brand-green"
                />
              </div>
            </div>
          </div>
        </div>
      </Accordion>

      {/* HISTÓRICO DE SEMANAS */}
      <Accordion 
        icon={<Clock size={16} />} 
        title="Histórico de Semanas" 
        subtitle={`${Object.keys(historyByWeek).length} semanas · ${Object.values(historyByWeek).reduce((sum, w: any) => sum + w.visits.length, 0)} visitas`} 
        isOpen={openSections.historico}
        onToggle={() => toggleSection('historico')}
      >
        <div className="flex flex-col gap-3">
          {Object.entries(historyByWeek).map(([weekKey, week]: [string, any]) => (
            <div key={weekKey} className="border border-b1 rounded-lg overflow-hidden bg-bg">
              <button 
                onClick={() => setExpandedWeeks(p => ({ ...p, [weekKey]: !p[weekKey] }))}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-s1/30 transition-colors bg-s2/20"
              >
                <span className="text-[12px] font-bold text-t1">{week.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-mono text-t4">{week.visits.length} visitas</span>
                  {expandedWeeks[weekKey] ? <ChevronUp size={14} className="text-t4" /> : <ChevronDown size={14} className="text-t4" />}
                </div>
              </button>

              {expandedWeeks[weekKey] && (
                <div className="border-t border-b1 flex flex-col divide-y divide-b1/50 bg-s1/10">
                  {week.visits.map((visit: any) => (
                    <div key={visit.day} className="p-4 flex flex-col gap-3 hover:bg-s1/20 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-brand-green">{format(new Date(visit.day), 'dd/MM/yyyy HH:mm')}</span>
                        {visit.notes.length > 0 && (
                          <span className="bg-brand-green/10 text-brand-green text-[9px] px-1.5 py-0.5 rounded font-bold">
                            {visit.notes.length} ITENS
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-t2 leading-relaxed italic border-l-2 border-brand-green/50 pl-2 py-0.5">
                        {visit.narrativa || "(Sem narrativa)"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Accordion>
    </div>
  );
}
