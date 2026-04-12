import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { 
  AlertTriangle, 
  Package, 
  MessageSquare,
  Eye,
  X
} from 'lucide-react';
import { format } from 'date-fns';

export default function Notas() {
  const { state, setState, markPending } = useAppContext();
  const [filterType, setFilterType] = useState('todos');

  // Calcula a janela de tempo com base no GlobalFilter
  const refDate = new Date(state.globalFilter.referenceDate);
  refDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date(refDate);
  startDate.setDate(refDate.getDate() - state.globalFilter.periodDays + 1);
  startDate.setHours(0, 0, 0, 0);

  // Filtrar notas ativas
  const notasFiltradas = state.notas
    .filter(n => {
       const noteDate = new Date(n.data_nota);
       const inTime = noteDate >= startDate && noteDate <= refDate;
       if (!inTime) return false;
       if (filterType !== 'todos' && n.tipo !== filterType) return false;
       return true;
    })
    .sort((a, b) => new Date(b.data_nota).getTime() - new Date(a.data_nota).getTime());

  const getIcon = (t: string) => {
    switch (t) {
      case 'pendencia': return <AlertTriangle size={14} className="text-brand-red" />;
      case 'observacao': return <Eye size={14} className="text-brand-blue" />;
      case 'material': return <Package size={14} className="text-brand-amber" />;
      default: return <MessageSquare size={14} className="text-brand-green" />;
    }
  };

  const getStyle = (t: string) => {
    switch (t) {
      case 'pendencia': return 'bg-brand-red/5 border-brand-red/20';
      case 'observacao': return 'bg-brand-blue/5 border-brand-blue/20';
      case 'material': return 'bg-brand-amber/5 border-brand-amber/20';
      default: return 'bg-brand-green/5 border-brand-green/20';
    }
  };

  const deleteNota = (id: string) => {
    setState(prev => {
      const filtered = prev.notas.filter(n => n.id !== id);
      return { ...prev, notas: filtered };
    });
    // Marcar como deletado para envio (Supabase API expects delete logic if implementing, currently mock or relies on offline map)
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-start justify-between mb-8 gap-3 shrink-0">
        <div>
          <h2 className="text-[20px] font-bold text-t1 uppercase tracking-tight">Registro de Notas</h2>
          <p className="font-mono text-[11px] text-t3 uppercase mt-1">
            Exibindo registros de {startDate.toLocaleDateString('pt-BR')} a {refDate.toLocaleDateString('pt-BR')} ({notasFiltradas.length} notas no período)
          </p>
        </div>
        </div>
        <div className="flex gap-1.5 flex-wrap mb-6 border-b border-b1 pb-4">
        {[
          { id: 'todos', label: 'Todas as Notas' },
          { id: 'observacao', label: 'Observações' },
          { id: 'pendencia', label: 'Pendências' },
          { id: 'nota', label: 'Notas' },
          { id: 'material', label: 'Materiais' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3 py-1.5 rounded-md border font-mono text-[10px] uppercase tracking-[0.08em] transition-all ${
              filterType === f.id ? 'border-brand-green text-brand-green bg-brand-green/5 shadow-sm' : 'border-b1 bg-s1 text-t3 hover:border-b2 hover:text-t2'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-20">
        {notasFiltradas.map((n) => (
            <div key={n.id} className={`flex gap-4 p-4 rounded-lg border ${getStyle(n.tipo)} group relative items-start`}>
            <div className="flex flex-col items-center justify-center pt-1">
                {getIcon(n.tipo)}
            </div>
            <div className="flex-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-t3 block mb-1 opacity-80">{n.tipo}</span>
                <p className="text-[13px] text-t1 leading-relaxed font-serif">{n.texto}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-mono text-t4 bg-bg/50 px-2 py-0.5 rounded-full">{format(new Date(n.data_nota), 'dd/MM/yyyy HH:mm')}</span>
                <button 
                  onClick={() => deleteNota(n.id)} 
                  className="text-t4 hover:text-brand-red opacity-0 group-hover:opacity-100 transition-all absolute right-4 bottom-4 p-1 bg-white/10 rounded"
                  title="Remover Nota"
                >
                <X size={14} />
                </button>
            </div>
            </div>
        ))}
        
        {notasFiltradas.length === 0 && (
            <div className="text-center py-20 bg-bg/50 border border-dashed border-b1 rounded-lg">
            <div className="flex justify-center mb-4"><MessageSquare size={24} className="text-t4"/></div>
            <p className="text-[12px] font-mono text-t4 uppercase tracking-widest leading-relaxed">
                Nenhum registro de nota gerado pela Inteligência Artificial<br/> neste escopo de datas.
            </p>
            </div>
        )}
      </div>
    </div>
  );
}
