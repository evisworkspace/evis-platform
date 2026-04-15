import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { initialData } from '../initialData';
import { 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Hash, 
  Plus, 
  Save, 
  CheckCircle,
  Clock,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Equipe } from '../types';

export default function Equipes() {
  const { state, setState, markPending, toast } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Equipe>>({});
  const [matrixOffset, setMatrixOffset] = useState(0);
  
  // Week calculations based on active day + offset
  const currentDd = new Date(state.currentDay);
  const startD = startOfWeek(addDays(new Date(currentDd.getTime() + currentDd.getTimezoneOffset() * 60000), matrixOffset * 7), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 6 }).map((_, i) => addDays(startD, i)); // Seg a Sab

  const handleEdit = (eq: Equipe) => {
    setEditingId(eq.cod);
    setFormData(eq);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.cod) return;
    
    // Check if it's new
    const isNew = !state.equipes.find(e => e.cod === formData.cod);
    
    setState(prev => {
      const novas = isNew ? [...prev.equipes, formData as Equipe] : prev.equipes.map(e => e.cod === formData.cod ? formData as Equipe : e);
      return { ...prev, equipes: novas };
    });
    
    markPending('equipes_cadastro', formData as Equipe);
    setEditingId(null);
    setFormData({});
    toast('Equipe salva na fila de sincronização.', 'success');
  };

  const togglePresenca = (eqCod: string, dayDate: Date) => {
    const dayStr = format(dayDate, 'yyyy-MM-dd');
    setState(prev => {
      const p = prev.presenca[dayStr] || [];
      const newP = p.includes(eqCod) ? p.filter(c => c !== eqCod) : [...p, eqCod];
      
      if (!p.includes(eqCod)) {
        markPending('equipes_presenca', { id: `${dayStr}-${eqCod}`, equipe: eqCod, dia: dayStr });
      }
      return { ...prev, presenca: { ...prev.presenca, [dayStr]: newP } };
    });
  };

  const popularEquipes = () => {
    // Inject all from initialData to DB queue
    const rawEquipes = initialData?.equipes || [];
    const novasEquipes = rawEquipes.map((e) => ({
      ...e,
      ativo: true
    }));
    
    setState(prev => {
      // Merge unique
      const merged = [...prev.equipes];
      novasEquipes.forEach(n => {
        if (!merged.find(m => m.cod === n.cod)) {
          merged.push(n);
          markPending('equipes_cadastro', n);
        }
      });
      return { ...prev, equipes: merged };
    });
    toast('Fornecedores originais injetados para Sincronização!', 'success');
  };

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-6xl mx-auto">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-t1 uppercase tracking-tight flex items-center gap-2">
            <Users className="text-brand-green" /> Hub de Equipes
          </h2>
          <p className="text-[12px] text-t3 mt-1 font-mono">Gerencie perfis e rastreie presenças</p>
        </div>
        
        {state.equipes.length === 0 && (
           <button onClick={popularEquipes} className="bg-s2 border border-b1 text-t1 px-3 py-2 rounded flex items-center gap-2 text-xs uppercase font-bold hover:bg-s3 transition-colors">
              <Download size={14} /> Popular Fornecedores
           </button>
        )}
      </div>

      {/* MATRIX DE PRESENÇA */}
      <div className="bg-s1 border border-b1 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-b1 bg-s2/30 flex items-center justify-between">
          <span className="text-[10px] font-bold text-t3 uppercase tracking-widest">Matriz de Presença Semanal</span>
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <button 
                onClick={() => setMatrixOffset(prev => prev - 1)}
                className="p-1 rounded bg-s2 border border-b1 text-t3 hover:text-t1 hover:border-b2 transition-colors"
                title="Semana anterior"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setMatrixOffset(0)}
                className="px-2 py-1 rounded bg-s2 border border-b1 text-[9px] font-bold uppercase text-t3 hover:text-t1 transition-colors"
              >
                Atual
              </button>
              <button 
                onClick={() => setMatrixOffset(prev => prev + 1)}
                className="p-1 rounded bg-s2 border border-b1 text-t3 hover:text-t1 hover:border-b2 transition-colors"
                title="Próxima semana"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <span className="text-[10px] font-mono text-t3 uppercase bg-s3 px-2 py-0.5 rounded border border-b2">
              {format(weekDays[0], 'dd/MM')} - {format(weekDays[5], 'dd/MM')}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-b1 bg-s1/50">
                <th className="px-4 py-3 font-mono text-[10px] text-t3 uppercase tracking-widest w-[200px]">Equipe</th>
                {weekDays.map(d => (
                  <th key={d.getTime()} className={`px-2 py-3 text-center font-mono text-[10px] uppercase ${isSameDay(d, currentDd) ? 'text-brand-green font-bold' : 'text-t3'}`}>
                    {format(d, 'EE dd', { locale: ptBR })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-b1/50">
              {state.equipes.map(eq => (
                <tr key={eq.cod} className="hover:bg-s2/30 transition-colors">
                  <td className="px-4 py-2 border-r border-b1/50">
                    <div className="text-[12px] font-bold text-t2 truncate w-[180px]">{eq.nome}</div>
                    <div className="text-[9px] font-mono text-t4">{eq.cod}</div>
                  </td>
                  {weekDays.map(d => {
                    const dayStr = format(d, 'yyyy-MM-dd');
                    const present = (state.presenca[dayStr] || []).includes(eq.cod);
                    return (
                      <td key={d.getTime()} className="px-2 py-2 text-center border-r border-b1/50 last:border-r-0">
                        <button 
                          onClick={() => togglePresenca(eq.cod, d)}
                          className={`w-6 h-6 rounded mx-auto flex items-center justify-center transition-all ${present ? 'bg-brand-green text-bg' : 'bg-s3 text-t4 hover:bg-s2 hover:text-t3'}`}
                        >
                          {present ? <CheckCircle size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-t4/50"></div>}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {state.equipes.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-xs text-t4 uppercase font-mono tracking-widest">
                    Nenhuma equipe cadastrada no Supabase
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CARDS DE EQUIPES */}
      <div>
         <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] font-bold text-t2 uppercase tracking-widest">Painel de Fornecedores</span>
            <button 
              onClick={() => { setEditingId('NOVO'); setFormData({ cod: 'EQ-NOV-01', nome: '', ativo: true }); }}
              className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1.5 rounded flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider hover:bg-brand-green/20 transition-all"
            >
              <Plus size={14} /> Adicionar Equipe
            </button>
         </div>
         
         <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {state.equipes.map(eq => (
              <div key={eq.cod} className="bg-s1 border border-b1 hover:border-b2 transition-colors rounded-xl overflow-hidden flex flex-col shadow-sm">
                
                {editingId === eq.cod ? (
                   <div className="p-4 flex flex-col gap-3">
                      <input 
                         placeholder="Código" 
                         value={formData.cod} 
                         onChange={e => setFormData({...formData, cod: e.target.value})}
                         className="bg-bg border border-b1 rounded px-2 py-1 text-xs text-t1 outline-none font-mono"
                      />
                      <input 
                         placeholder="Nome da Equipe" 
                         value={formData.nome} 
                         onChange={e => setFormData({...formData, nome: e.target.value})}
                         className="bg-bg border border-b1 rounded px-2 py-1 text-xs text-t1 outline-none font-bold"
                      />
                      <input 
                         placeholder="funcao" 
                         value={formData.funcao} 
                         onChange={e => setFormData({...formData, funcao: e.target.value})}
                         className="bg-bg border border-b1 rounded px-2 py-1 text-xs text-t2 outline-none"
                      />
                       <input 
                         placeholder="Telefone" 
                         value={formData.telefone} 
                         onChange={e => setFormData({...formData, telefone: e.target.value})}
                         className="bg-bg border border-b1 rounded px-2 py-1 text-xs text-t2 outline-none"
                      />
                       <input 
                         placeholder="PIX" 
                         value={formData.pix} 
                         onChange={e => setFormData({...formData, pix: e.target.value})}
                         className="bg-bg border border-b1 rounded px-2 py-1 text-xs text-t2 outline-none"
                      />
                      <div className="flex gap-2 mt-2">
                         <button onClick={() => setEditingId(null)} className="flex-1 bg-s2 border border-b1 text-t2 rounded py-1.5 text-[10px] font-bold uppercase transition-colors hover:text-t1">Cancela</button>
                         <button onClick={handleSave} className="flex-1 bg-brand-green text-bg rounded py-1.5 text-[10px] font-bold uppercase transition-colors flex justify-center items-center gap-1"><Save size={12}/> Salva</button>
                      </div>
                   </div>
                ) : (
                   <>
                      <div className="p-4 border-b border-b1 flex items-start justify-between">
                         <div>
                            <div className="font-mono text-[9px] text-brand-green tracking-[0.1em] bg-brand-green/10 px-1.5 py-0.5 rounded inline-block mb-1.5">{eq.cod}</div>
                            <div className="text-[13px] font-bold text-t1 leading-tight">{eq.nome}</div>
                            {eq.funcao && <div className="text-[11px] text-t3 mt-1 line-clamp-1">{eq.funcao}</div>}
                         </div>
                      </div>
                      <div className="p-4 flex flex-col gap-2 flex-1">
                         {eq.telefone && (
                            <div className="flex items-center gap-2 text-[11px] text-t2">
                               <Phone size={12} className="text-t4" /> <span>{eq.telefone}</span>
                            </div>
                         )}
                         {eq.pix && (
                            <div className="flex items-center gap-2 text-[11px] text-t2">
                               <Hash size={12} className="text-t4" /> <span className="font-mono truncate">{eq.pix}</span>
                            </div>
                         )}
                         {eq.email && (
                            <div className="flex items-center gap-2 text-[11px] text-t2">
                               <Mail size={12} className="text-t4" /> <span className="truncate">{eq.email}</span>
                            </div>
                         )}
                         {!eq.telefone && !eq.pix && !eq.email && (
                            <div className="text-[10px] text-t4 italic font-mono flex items-center gap-2">
                               <MapPin size={10} /> Cadastro Incompleto
                            </div>
                         )}
                      </div>
                      <div className="bg-s2 border-t border-b1 p-2 flex">
                         <button onClick={() => handleEdit(eq)} className="w-full text-center text-[10px] font-bold text-t3 hover:text-t1 uppercase tracking-widest py-1 transition-colors">
                            Editar Ficha
                         </button>
                      </div>
                   </>
                )}
              </div>
            ))}
            
            {editingId === 'NOVO' && (
               <div className="bg-s1 border border-brand-green/30 rounded-xl overflow-hidden flex flex-col shadow-sm">
                  <div className="p-4 flex flex-col gap-3">
                      <div className="text-xs font-bold text-brand-green mb-2 uppercase tracking-widest flex items-center gap-2">
                         <Plus size={14} /> Nova Equipe
                      </div>
                      <input placeholder="Código (ex: EQ-XXX-01)" value={formData.cod} onChange={e => setFormData({...formData, cod: e.target.value})} className="bg-bg border border-b1 rounded px-2 py-1.5 text-xs text-t1 outline-none font-mono" />
                      <input placeholder="Nome da Equipe" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="bg-bg border border-b1 rounded px-2 py-1.5 text-xs text-t1 outline-none font-bold" />
                      <input placeholder="funcao" value={formData.funcao} onChange={e => setFormData({...formData, funcao: e.target.value})} className="bg-bg border border-b1 rounded px-2 py-1.5 text-xs text-t2 outline-none" />
                      <div className="flex gap-2 mt-4">
                         <button onClick={() => setEditingId(null)} className="flex-1 bg-s2 border border-b1 text-t2 rounded py-1.5 text-[10px] font-bold uppercase transition-colors hover:text-t1">Cancela</button>
                         <button onClick={handleSave} className="flex-1 bg-brand-green text-bg rounded py-1.5 text-[10px] font-bold uppercase transition-colors flex justify-center items-center gap-1"><Save size={12}/> Adicionar</button>
                      </div>
                   </div>
               </div>
            )}
         </div>
      </div>

    </div>
  );
}
