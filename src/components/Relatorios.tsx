import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { FileDown, Calendar, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';

export default function Relatorios() {
  const { state, config } = useAppContext();
  const [semana, setSemana] = useState('');

  const getWeekString = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
  };

  const availableWeeks = new Set<string>();
  Object.keys(state.diario).forEach(d => { const w = getWeekString(d); if(w) availableWeeks.add(w); });
  state.fotos.forEach(f => { const w = getWeekString(f.data_foto); if(w) availableWeeks.add(w); });
  state.notas.forEach(n => { const w = getWeekString(n.data_nota); if(w) availableWeeks.add(w); });
  
  const weeks = Array.from(availableWeeks).sort().reverse();
  
  if (!semana && weeks.length > 0) {
    setSemana(weeks[0]);
  }

  const handlePrint = () => {
    window.print();
  };

  const weekFotos = state.fotos.filter(f => getWeekString(f.data_foto) === semana);
  const weekNotas = state.notas.filter(n => getWeekString(n.data_nota) === semana);
  const latestDiarioDate = Object.keys(state.diario)
    .filter(d => getWeekString(d) === semana)
    .sort((a, b) => b.localeCompare(a))[0];
    
  const narrative = latestDiarioDate ? state.narrativas[latestDiarioDate] : '';

  // Calculate KPIs
  const srv = state.servicos;
  const total = srv.length || 1;
  const done = srv.filter(s => s.avanco_atual >= 100).length;
  const pctConcluido = Math.round((done / total) * 100);
  const pctMedia = Math.round(srv.reduce((acc, s) => acc + (s.avanco_atual || 0), 0) / total);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6 gap-3 shrink-0 print:hidden">
        <div>
          <h2 className="text-[20px] font-bold text-t1 uppercase tracking-tight">Exportação de Relatórios</h2>
        </div>
        <div className="flex gap-2">
          <select 
            value={semana} 
            onChange={e => setSemana(e.target.value)}
            className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[12px] px-3 py-1.5 outline-none focus:border-b3"
          >
            {weeks.map(w => (
              <option key={w} value={w}>Semana {w.split('-W')[1]} ({w.split('-W')[0]})</option>
            ))}
            {weeks.length === 0 && <option value="">Nenhuma semana disponível</option>}
          </select>
          <button 
            onClick={handlePrint}
            disabled={!semana}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-sans text-[11px] font-extrabold tracking-[0.05em] bg-brand-green text-[#0a0d0a] hover:opacity-90 transition-all disabled:opacity-50"
          >
            <FileDown size={14} />
            GERAR RELATÓRIO PDF
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="flex-1 overflow-y-auto bg-gray-200 p-4 lg:p-10 print:p-0 print:bg-white print:overflow-visible">
        <div className="max-w-[850px] mx-auto space-y-8 print:space-y-0">
          
          {/* PAGE 1: CAPA */}
          <section className="bg-white text-black p-[50px] aspect-[1/1.41] shadow-2xl flex flex-col justify-between print:shadow-none print:m-0 print:border-none print:w-full print:h-[297mm] break-after-page border border-gray-100">
            <div className="flex justify-between items-start">
               <div className="w-16 h-1 bg-black"></div>
               <div className="text-right font-mono text-[10px] uppercase tracking-widest text-gray-400">Restaurante Badida v1.0</div>
            </div>

            <div className="flex-1 flex flex-col justify-center">
               <div className="text-[12px] font-mono text-gray-500 uppercase tracking-[0.2em] mb-4">Relatório Semanal de Acompanhamento</div>
               <h1 className="text-[54px] font-black leading-[1.1] uppercase tracking-tighter mb-4">
                  Cockpit <br/> 
                  <span className="text-gray-400">Obra Badida</span>
               </h1>
               <div className="w-32 h-0.5 bg-black mb-10"></div>
               
               <div className="grid grid-cols-2 gap-10">
                  <div>
                     <div className="text-[10px] font-mono text-gray-400 uppercase mb-1">Cliente</div>
                     <div className="text-[14px] font-bold uppercase">TMK Comércio de Alimentos LTDA</div>
                  </div>
                  <div>
                     <div className="text-[10px] font-mono text-gray-400 uppercase mb-1">Projeto</div>
                     <div className="text-[14px] font-bold uppercase">ParkShopping Barigui - V1</div>
                  </div>
               </div>
            </div>

            <div className="flex justify-between items-end border-t border-gray-100 pt-8">
               <div className="text-[12px] font-mono">
                  Semana {semana ? semana.split('-W')[1] : '—'} <br/>
                  <span className="text-gray-400 uppercase">{semana ? semana.split('-W')[0] : '—'}</span>
               </div>
               <div className="text-[10px] font-mono text-gray-400 uppercase text-right">
                  Engenharia e Controle <br/>
                  Sistema EVIS
               </div>
            </div>
          </section>

          {/* PAGE 2: RESUMO EXECUTIVO */}
          <section className="bg-white text-black p-[50px] aspect-[1/1.41] shadow-2xl print:shadow-none print:m-0 print:w-full print:h-[297mm] break-after-page border border-gray-100">
             <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-100">
                <span className="text-[14px] font-bold uppercase tracking-widest">02. Resumo Executivo</span>
                <span className="text-[10px] font-mono text-gray-400 italic">Data Export: {new Date().toLocaleDateString('pt-BR')}</span>
             </div>

             <div className="grid grid-cols-3 gap-4 mb-10">
                <div className="bg-gray-50 p-6 rounded border border-gray-100">
                   <div className="text-[10px] text-gray-400 uppercase font-mono mb-2">Físico Absoluto</div>
                   <div className="text-3xl font-black">{pctConcluido}%</div>
                   <div className="text-[9px] text-gray-400 mt-2 uppercase">Conclusão de Escopo</div>
                </div>
                <div className="bg-gray-50 p-6 rounded border border-gray-100">
                   <div className="text-[10px] text-gray-400 uppercase font-mono mb-2">Físico Ponderado</div>
                   <div className="text-3xl font-black">{pctMedia}%</div>
                   <div className="text-[9px] text-gray-400 mt-2 uppercase">Média Ponderada</div>
                </div>
                <div className="bg-black text-white p-6 rounded">
                   <div className="text-[10px] text-gray-500 uppercase font-mono mb-2">Status Obra</div>
                   <div className="text-xl font-bold uppercase">Em Andamento</div>
                   <div className="text-[9px] text-gray-500 mt-2 uppercase">Estágio: Instalações</div>
                </div>
             </div>

             <div className="mb-10">
                <h3 className="text-[12px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                   <Calendar size={14} className="text-black" /> Narrativa da Engenharia
                </h3>
                <div className="text-[14px] leading-relaxed text-gray-800 bg-gray-50 p-6 rounded-lg italic border-l-4 border-black font-serif">
                   {narrative || 'Aguardando processamento da IA para esta semana...'}
                </div>
             </div>

             <div>
                <h3 className="text-[12px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                   <AlertTriangle size={14} className="text-black" /> Principais Pendências
                </h3>
                <div className="space-y-3">
                   {state.pendencias.filter(p => p.status === 'ABERTA').slice(0, 5).map(p => (
                      <div key={p.id} className="flex gap-4 p-3 border-b border-gray-100 last:border-0 items-center">
                         <div className={`w-2 h-2 rounded-full ${p.prioridade === 'alta' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                         <div className="text-[12px] font-medium text-gray-700">{p.descricao}</div>
                         <div className="ml-auto text-[9px] font-mono text-gray-400 uppercase">{p.prioridade}</div>
                      </div>
                   ))}
                </div>
             </div>
          </section>

          {/* PAGE 3: CRONOGRAMA FÍSICO */}
          <section className="bg-white text-black p-[50px] aspect-[1/1.41] shadow-2xl print:shadow-none print:m-0 print:w-full print:h-[297mm] break-after-page border border-gray-100 overflow-hidden">
             <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-100">
                <span className="text-[14px] font-bold uppercase tracking-widest">03. Cronograma Físico</span>
                <span className="text-[10px] font-mono text-gray-400 italic">Status por Categoria</span>
             </div>

             <table className="w-full border-collapse">
                <thead>
                   <tr className="bg-gray-50 text-[10px] font-mono text-gray-400 uppercase">
                      <th className="p-3 text-left border border-gray-100 w-16">Cod</th>
                      <th className="p-3 text-left border border-gray-100">Descrição do Serviço</th>
                      <th className="p-3 text-center border border-gray-100 w-24">Eq</th>
                      <th className="p-3 text-center border border-gray-100 w-20">Avn%</th>
                   </tr>
                </thead>
                <tbody className="text-[11px]">
                   {(() => {
                      const cats = ['Preliminares', 'Demolições', 'Drywall / Forro', 'Elétrica', 'Ar-condicionado', 'Pintura', 'PPCI / Incêndio'];
                      return cats.map(cat => (
                         <React.Fragment key={cat}>
                            <tr className="bg-gray-100/50">
                               <td colSpan={4} className="p-2 pl-4 font-bold uppercase text-[10px] tracking-widest text-gray-600 bg-gray-50">{cat}</td>
                            </tr>
                            {state.servicos.filter(s => s.categoria === cat).slice(0, 10).map(s => (
                               <tr key={s.id_servico} className="border-b border-gray-100">
                                  <td className="p-2 font-mono text-[9px] text-gray-400">{s.id_servico}</td>
                                  <td className="p-2 font-medium">{s.nome}</td>
                                  <td className="p-2 text-center text-gray-400">{s.equipe ? s.equipe.substring(0, 6) : '—'}</td>
                                  <td className="p-2">
                                     <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                           <div className={`h-full ${s.avanco_atual >= 100 ? 'bg-green-500' : 'bg-black'}`} style={{ width: `${s.avanco_atual}%` }}></div>
                                        </div>
                                        <span className="font-bold w-6 text-right">{s.avanco_atual}%</span>
                                     </div>
                                  </td>
                               </tr>
                            ))}
                         </React.Fragment>
                      ));
                   })()}
                </tbody>
             </table>
             <div className="mt-6 text-[9px] text-gray-400 italic text-center">* Exibindo serviços críticos e em andamento para esta semana.</div>
          </section>

          {/* PAGE 4: GESTÃO FOTOGRÁFICA */}
          <section className="bg-white text-black p-[50px] aspect-[1/1.41] shadow-2xl print:shadow-none print:m-0 print:w-full print:h-[297mm] border border-gray-100">
              <div className="flex justify-between items-center mb-10 pb-4 border-b border-gray-100">
                <span className="text-[14px] font-bold uppercase tracking-widest">04. Gestão e Fotos</span>
                <span className="text-[10px] font-mono text-gray-400 italic">Rastreabilidade Visual</span>
             </div>

             <div className="grid grid-cols-2 gap-6 mb-10">
                {weekFotos.length > 0 ? weekFotos.map(f => (
                   <div key={f.id} className="group border border-gray-100 p-2 rounded shadow-sm">
                      <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-3">
                         <img src={f.url} alt={f.legenda} className="w-full h-full object-cover" />
                      </div>
                      <div className="px-1 flex justify-between items-center">
                         <span className="text-[11px] font-bold uppercase truncate pr-4">{f.legenda || 'Registro de Campo'}</span>
                         <span className="text-[10px] font-mono text-gray-400 shrink-0">{new Date(f.data_foto).toLocaleDateString()}</span>
                      </div>
                   </div>
                )) : (
                   <div className="col-span-2 py-20 text-center border-2 border-dashed border-gray-100 rounded-xl">
                      <div className="text-gray-300 font-mono text-[11px] uppercase tracking-widest">Nenhuma foto carregada para a semana {semana}</div>
                   </div>
                )}
             </div>

             <div>
                <h3 className="text-[12px] font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                   <MessageSquare size={14} className="text-black" /> Notas de Campo Adicionais
                </h3>
                <div className="grid gap-3">
                   {weekNotas.slice(0, 6).map(n => (
                      <div key={n.id} className="p-4 bg-gray-50 rounded border border-gray-100 flex gap-4">
                         <div className="w-1 h-1 bg-black rounded-full mt-1.5"></div>
                         <div className="text-[12px] leading-relaxed text-gray-600 line-clamp-3">{n.texto}</div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="mt-auto pt-20 flex justify-between items-end grayscale opacity-50">
                 <div className="text-[10px] font-bold uppercase tracking-tight">Bertisign Digital Obra</div>
                 <div className="w-12 h-12 bg-black flex items-center justify-center text-white text-[12px] font-black">EV</div>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
}

