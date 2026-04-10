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
  Calendar,
  History
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Notas() {
  const { state, setState, markPending, toast } = useAppContext();
  const [tipo, setTipo] = useState('observacao');
  const [texto, setTexto] = useState('');
  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({});
  const [expandedVisits, setExpandedVisits] = useState<Record<string, boolean>>({});
  const [showTotal, setShowTotal] = useState(false);

  const currentDay = state.currentDay;
  const currentNarrativa = state.narrativas[currentDay] || '';

  const addNota = () => {
    if (!texto.trim()) return;
    const n = {
      id: crypto.randomUUID(),
      tipo: tipo as any,
      texto,
      data_nota: new Date().toISOString()
    };
    setState(prev => ({ ...prev, notas: [n, ...prev.notas] }));
    markPending('notas', n);
    setTexto('');
  };

  const deleteNota = (id: string) => {
    setState(prev => ({ ...prev, notas: prev.notas.filter(n => n.id !== id) }));
    // In a real app, we'd mark for deletion in Supabase
  };

  const updateNarrativa = (val: string) => {
    setState(prev => ({
      ...prev,
      narrativas: { ...prev.narrativas, [currentDay]: val }
    }));
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

  // Filter notes for the current day
  const currentDayNotes = useMemo(() => {
    return state.notas.filter(n => isSameDay(new Date(n.data_nota), new Date(currentDay)));
  }, [state.notas, currentDay]);

  // Group everything by week for history
  const historyByWeek = useMemo(() => {
    const weeks: Record<string, any> = {};
    
    // Get all unique days that have either a narrative or notes
    const daysWithActivity = new Set([
      ...Object.keys(state.narrativas),
      ...state.notas.map(n => n.data_nota.split('T')[0])
    ]);

    Array.from(daysWithActivity).sort().reverse().forEach(day => {
      const date = new Date(day);
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          label: `Semana ${format(weekStart, 'w')}`,
          start: weekStart,
          visits: []
        };
      }

      weeks[weekKey].visits.push({
        day,
        narrativa: state.narrativas[day],
        notes: state.notas.filter(n => n.data_nota.split('T')[0] === day)
      });
    });

    return weeks;
  }, [state.narrativas, state.notas]);

  const toggleWeek = (key: string) => {
    setExpandedWeeks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleVisit = (key: string) => {
    setExpandedVisits(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header Section */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-s3 p-2 rounded-lg">
            <History className="w-5 h-5 text-brand-green" />
          </div>
          <h2 className="text-[20px] font-bold text-t1 uppercase tracking-tight">Notas & Visita</h2>
        </div>
        <div className="text-[11px] font-mono text-t3 uppercase tracking-widest">
          {format(new Date(currentDay), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </div>
      </div>

      {/* Narrativa Section */}
      <div className="bg-s1 border border-b1 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-b1 bg-s2/30 flex items-center justify-between">
          <span className="text-[10px] font-bold text-t3 uppercase tracking-widest">Narrativa da Visita</span>
        </div>
        <div className="p-4">
          <textarea 
            value={currentNarrativa}
            onChange={e => updateNarrativa(e.target.value)}
            placeholder="Descreva os principais acontecimentos da visita..."
            className="w-full min-h-[120px] bg-bg border border-b1 rounded-lg p-3 text-[13px] text-t1 leading-relaxed outline-none focus:border-brand-green transition-colors resize-none"
          />
        </div>
      </div>

      {/* Structured Notes Section */}
      <div className="bg-s1 border border-b1 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-b1 bg-s2/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-t3 uppercase tracking-widest">Notas Estruturadas</span>
            <select 
              value={tipo} 
              onChange={e => setTipo(e.target.value)} 
              className="bg-s3 border border-b2 rounded px-2 py-0.5 text-[10px] text-t2 outline-none cursor-pointer"
            >
              <option value="observacao">Observação</option>
              <option value="decisao">Decisão</option>
              <option value="alerta">Alerta</option>
              <option value="lembrete">Lembrete</option>
            </select>
          </div>
          <span className="text-[10px] font-mono text-t4 uppercase">{currentDayNotes.length} notas</span>
        </div>
        
        <div className="p-4 flex flex-col gap-3">
          {/* Add Note Input */}
          <div className="flex gap-2">
            <input 
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNota()}
              placeholder="Nova nota técnica..."
              className="flex-1 bg-bg border border-b1 rounded-lg px-3 py-2 text-[13px] text-t1 outline-none focus:border-brand-green"
            />
            <button 
              onClick={addNota}
              className="bg-brand-green text-bg px-4 py-2 rounded-lg text-[12px] font-bold hover:bg-brand-green2 transition-colors"
            >
              Adicionar
            </button>
          </div>

          {/* Notes List */}
          <div className="flex flex-col gap-2 mt-2">
            {currentDayNotes.map(n => (
              <div key={n.id} className="group flex items-start gap-3 bg-bg border border-b1 rounded-lg p-3 hover:border-b2 transition-colors">
                <div className="mt-0.5">{getIcon(n.tipo)}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-t3 uppercase">{getLabel(n.tipo)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-mono text-t4">{format(new Date(n.data_nota), 'HH:mm')}</span>
                      <button onClick={() => deleteNota(n.id)} className="text-t4 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[12px] text-t2 leading-relaxed">{n.texto}</p>
                </div>
              </div>
            ))}
            {currentDayNotes.length === 0 && (
              <div className="text-center py-6 text-t4 text-[11px] font-mono uppercase">Nenhuma nota para este dia</div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly History Section */}
      <div className="bg-s1 border border-b1 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-b1 bg-s2/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-t3" />
            <span className="text-[10px] font-bold text-t3 uppercase tracking-widest">Histórico de Semanas</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowTotal(!showTotal)}
              className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${showTotal ? 'bg-brand-green text-bg' : 'bg-s3 text-t3 hover:text-t2'}`}
            >
              {showTotal ? 'Ver por Semanas' : 'Ver Tudo'}
            </button>
            <span className="text-[10px] font-mono text-t4 uppercase">{Object.keys(historyByWeek).length} semanas</span>
          </div>
        </div>

        <div className="p-2 flex flex-col gap-2">
          {showTotal ? (
            <div className="flex flex-col gap-2">
              {Object.values(historyByWeek).flatMap((w: any) => w.visits).map((visit: any) => (
                <div key={visit.day} className="border border-b1 rounded-lg bg-bg overflow-hidden shadow-sm">
                  <button 
                    onClick={() => toggleVisit(visit.day)}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-s1/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold text-t2">
                        {format(new Date(visit.day), 'dd/MM/yyyy')}
                      </span>
                      <span className="text-[10px] font-mono text-t4 uppercase">
                        {format(new Date(visit.day), 'EEEE', { locale: ptBR })}
                      </span>
                      {visit.notes.length > 0 && (
                        <span className="bg-brand-green/10 text-brand-green text-[9px] px-1.5 py-0.5 rounded font-bold">
                          {visit.notes.length} ITENS
                        </span>
                      )}
                    </div>
                    {expandedVisits[visit.day] ? <ChevronUp size={12} className="text-t4" /> : <ChevronDown size={12} className="text-t4" />}
                  </button>

                  {expandedVisits[visit.day] && (
                    <div className="p-3 border-t border-b1 flex flex-col gap-3">
                      {visit.narrativa && (
                        <div className="bg-s1/40 p-3 rounded-lg border border-b1/50">
                          <span className="text-[9px] font-bold text-t4 uppercase tracking-widest mb-2 block">Narrativa</span>
                          <p className="text-[12px] text-t2 leading-relaxed italic">"{visit.narrativa}"</p>
                        </div>
                      )}
                      {visit.notes.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-[9px] font-bold text-t4 uppercase tracking-widest mb-1 block">Notas Estruturadas</span>
                          {visit.notes.map((n: any) => (
                            <div key={n.id} className="flex items-start gap-2 text-[11px] text-t3 border-l-2 border-b2 pl-2 py-0.5">
                              <span className="font-bold text-t2">[{getLabel(n.tipo).toUpperCase()}]</span>
                              <span>{n.texto}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            Object.entries(historyByWeek).map(([weekKey, week]: [string, any]) => (
              <div key={weekKey} className="border border-b1 rounded-lg overflow-hidden bg-bg">
                <button 
                  onClick={() => toggleWeek(weekKey)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-s1/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-[13px] font-bold text-t1">{week.label}</span>
                    <span className="text-[10px] font-mono text-t4">
                      {format(week.start, 'dd/MM')} - {format(endOfWeek(week.start, { weekStartsOn: 1 }), 'dd/MM')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono text-t3 uppercase">{week.visits.length} visitas</span>
                    {expandedWeeks[weekKey] ? <ChevronUp size={14} className="text-t4" /> : <ChevronDown size={14} className="text-t4" />}
                  </div>
                </button>

                {expandedWeeks[weekKey] && (
                  <div className="border-t border-b1 p-2 flex flex-col gap-2 bg-s1/20">
                    {week.visits.map((visit: any) => (
                      <div key={visit.day} className="border border-b1 rounded-lg bg-bg overflow-hidden shadow-sm">
                        <button 
                          onClick={() => toggleVisit(visit.day)}
                          className="w-full px-3 py-2 flex items-center justify-between hover:bg-s1/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] font-bold text-t2">
                              {format(new Date(visit.day), 'dd/MM/yyyy')}
                            </span>
                            <span className="text-[10px] font-mono text-t4 uppercase">
                              {format(new Date(visit.day), 'EEEE', { locale: ptBR })}
                            </span>
                            {visit.notes.length > 0 && (
                              <span className="bg-brand-green/10 text-brand-green text-[9px] px-1.5 py-0.5 rounded font-bold">
                                {visit.notes.length} ITENS
                              </span>
                            )}
                          </div>
                          {expandedVisits[visit.day] ? <ChevronUp size={12} className="text-t4" /> : <ChevronDown size={12} className="text-t4" />}
                        </button>

                        {expandedVisits[visit.day] && (
                          <div className="p-3 border-t border-b1 flex flex-col gap-3">
                            {visit.narrativa && (
                              <div className="bg-s1/40 p-3 rounded-lg border border-b1/50">
                                <span className="text-[9px] font-bold text-t4 uppercase tracking-widest mb-2 block">Narrativa</span>
                                <p className="text-[12px] text-t2 leading-relaxed italic">"{visit.narrativa}"</p>
                              </div>
                            )}
                            {visit.notes.length > 0 && (
                              <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-bold text-t4 uppercase tracking-widest mb-1 block">Notas Estruturadas</span>
                                {visit.notes.map((n: any) => (
                                  <div key={n.id} className="flex items-start gap-2 text-[11px] text-t3 border-l-2 border-b2 pl-2 py-0.5">
                                    <span className="font-bold text-t2">[{getLabel(n.tipo).toUpperCase()}]</span>
                                    <span>{n.texto}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
