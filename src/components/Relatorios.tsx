import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { aiCall, extractJSON } from '../lib/api';
import { FileDown, Calendar, AlertTriangle, MessageSquare, Lock, Settings } from 'lucide-react';
import { RelatorioSemanal, Servico } from '../types';
import { getRelativeWeekString, getDaysOfRelativeWeek } from '../lib/dateUtils';

export default function Relatorios() {
  const { state, setState, config, toast, markPending } = useAppContext();
  const [semana, setSemana] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  const refD = new Date(state.globalFilter.referenceDate);
  refD.setHours(23, 59, 59, 999);
  const startD = new Date(refD);
  startD.setDate(refD.getDate() - state.globalFilter.periodDays + 1);
  startD.setHours(0, 0, 0, 0);

  const customId = `CUSTOM-${startD.toISOString().split('T')[0]}-to-${refD.toISOString().split('T')[0]}`;

  const availableWeeks = new Set<string>();
  Object.keys(state.diario).forEach(d => { const w = getRelativeWeekString(d, state); if(w && !w.includes('CUSTOM')) availableWeeks.add(w); });
  
  // Custom reports saved
  const savedCustoms = Object.keys(state.relatorios).filter(k => k.startsWith('CUSTOM'));

  const weeks = Array.from(availableWeeks).sort().reverse();
  if (!semana && weeks.length > 0) {
    setSemana('custom');
  }

  const isFechado = !!state.relatorios[semana === 'custom' ? customId : semana];
  const relatorioFechado = state.relatorios[semana === 'custom' ? customId : semana];

  const handlePrint = () => {
    window.print();
  };

  const handleFecharSemana = async () => {
    if (!semana || isClosing) return;
    setIsClosing(true);
    
    try {
        let diasSemana: string[] = [];
        let rId = '';
        let rStr = '';

        if (semana === 'custom') {
            rId = customId;
            rStr = `Período Modificado`;
            for (let d = new Date(startD); d <= refD; d.setDate(d.getDate() + 1)) {
                diasSemana.push(d.toISOString().split('T')[0]);
            }
        } else {
            rId = semana;
            rStr = `Semana ${semana.replace('S','')}`;
            diasSemana = getDaysOfRelativeWeek(semana, state);
        }

        let dailyLogs = '';
        diasSemana.forEach(dia => {
            if (state.diario[dia] && state.diario[dia].texto.trim().length > 0) {
                dailyLogs += `[${dia}] ${state.diario[dia].texto}\n`;
            }
            if (state.narrativas[dia]) {
                dailyLogs += `Narrativa: ${state.narrativas[dia]}\n`;
            }
        });

        if (!dailyLogs) {
            dailyLogs = "Nenhum diário preenchido nesta semana.";
        }

        const prompt = `Você é um Engenheiro Sênior de Planejamento gerando o relatório semanal executivo.
Semana: ${semana}
Diários da Semana:
${dailyLogs}

INSTRUÇÕES:
1. "resumo_executivo": Sintetize os principais acontecimentos (sucessos ou falhas) em 1 parágrafo profissional e direto.
2. "narrativa_tecnica": Crie um relato detalhado (2 parágrafos) do que evoluiu na semana, sem excesso de termos complexos.
Responda APENAS com um JSON válido contendo as chaves acima. NÃO use markdown na saída.`;

        let raw = await aiCall(prompt, 0.2, 4000, config, 'claude');
        
        const pureJsonText = extractJSON(raw);
        const ia = JSON.parse(pureJsonText);

        const totalSrv = Math.max(state.servicos.length, 1);
        const concluidos = state.servicos.filter(s => s.avanco_atual >= 100).length;

        // Cronograma Ativo
        const cronogramaFiltrado = state.servicos.filter(s => {
           if (s.avanco_atual < 100) return true;
           // Concluído, checa se tocou no período
           if (s.data_conclusao) {
               const dtFim = new Date(s.data_conclusao);
               // Interseção temporal ou data da semana
               if (semana === 'custom') return dtFim >= startD && dtFim <= refD;
               return getRelativeWeekString(s.data_conclusao, state) === semana;
           }
           return false;
        });

        const pendenciasSemana = state.pendencias.filter(p => {
           if (p.status === 'ABERTA') return true;
           // Resolvida, tem que interceptar (aproximação usando a data de closure do id, mas geralmente isso é falho, mantemos lógica legada pra ISO week apenas)
           return false;
        });
        
        const fotosSemana = state.fotos.filter(f => {
           const fD = new Date(f.data_foto);
           if (semana === 'custom') return fD >= startD && fD <= refD;
           // Fallback to relative calculation
           return f.semana === semana || getRelativeWeekString(f.data_foto, state) === semana;
        });
        
        // Presença
        const presencaSemana: Record<string, string[]> = {};
        diasSemana.forEach(d => {
            if(state.presenca[d]) presencaSemana[d] = [...state.presenca[d]];
        });

        const newRelatorio: RelatorioSemanal = {
            id: rId,
            semana_str: rStr,
            periodo: { inicio: diasSemana[0], fim: diasSemana[diasSemana.length - 1] },
            resumo_executivo: ia.resumo_executivo || 'Síntese gerada automaticamente falhou.',
            narrativa_tecnica: ia.narrativa_tecnica || 'Narrativa indísponivel.',
            kpis: {
                avanco_fisico: Math.round((concluidos / totalSrv) * 100),
                avanco_ponderado: Math.round(state.servicos.reduce((a, s) => a + (s.avanco_atual||0), 0) / totalSrv)
            },
            cronograma: cronogramaFiltrado.map(s => ({...s})),
            presenca: presencaSemana,
            fotos: [...fotosSemana],
            notas_criticas: state.notas.filter(n => {
                const nD = new Date(n.data_nota);
                if (semana === 'custom') return nD >= startD && nD <= refD;
                return getRelativeWeekString(n.data_nota, state) === semana;
            }),
            pendencias_criticas: pendenciasSemana.map(p => ({...p})),
            data_fechamento: new Date().toISOString()
        };

        setState(prev => ({
            ...prev,
            relatorios: { ...prev.relatorios, [rId]: newRelatorio }
        }));

        markPending('relatorios_semanais', newRelatorio);
        
        toast('Semana Fechada e Relatório Gerado!', 'success');
    } catch (err: unknown) {
        toast(`Erro ao fechar Semana: ${err}`, 'error');
    } finally {
        setIsClosing(false);
    }
  };

  // Computações para a renderização dinamicamente dependendo da View (Fechada vs Aberta)
  const isViewFechada = isFechado;
  
  // Dados de renderização
  const pctConcluido = isViewFechada ? relatorioFechado.kpis.avanco_fisico : 0;
  const pctMedia = isViewFechada ? relatorioFechado.kpis.avanco_ponderado : 0;
  const resExecutivo = isViewFechada ? relatorioFechado.resumo_executivo : 'Semana necessita ser fechada.';
  const narrTecnica = isViewFechada ? relatorioFechado.narrativa_tecnica : 'Semana necessita ser fechada.';
  const cronoAtivo = isViewFechada ? relatorioFechado.cronograma : [];
  const fotosSemana = isViewFechada ? relatorioFechado.fotos : state.fotos.filter(f => {
    if (semana === 'custom') return new Date(f.data_foto) >= startD && new Date(f.data_foto) <= refD;
    return getRelativeWeekString(f.data_foto, state) === semana;
  });
  const notasAtivas = isViewFechada ? relatorioFechado.notas_criticas : state.notas.filter(n => {
    if (semana === 'custom') return new Date(n.data_nota) >= startD && new Date(n.data_nota) <= refD;
    return getRelativeWeekString(n.data_nota, state) === semana;
  });
  const pendsAtivas = isViewFechada ? relatorioFechado.pendencias_criticas : state.pendencias.filter(p => p.status === 'ABERTA');
  const presenca = isViewFechada ? relatorioFechado.presenca : state.presenca;
  
  const renderMonday = isViewFechada ? relatorioFechado.periodo.inicio : (semana === 'custom' ? startD.toISOString().split('T')[0] : getDaysOfRelativeWeek(semana, state)[0]);
  const viewIdStr = isViewFechada ? (relatorioFechado.semana_str.startsWith('Período') ? `${startD.toLocaleDateString('pt-BR')} — ${refD.toLocaleDateString('pt-BR')}` : semana) : (semana === 'custom' ? `${startD.toLocaleDateString('pt-BR')} a ${refD.toLocaleDateString('pt-BR')}` : semana);

  const PageHeader = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="flex justify-between items-end mb-10 pb-4 border-b border-black">
      <div className="flex flex-col">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-1">EVIS AI // Cockpit Obra</div>
        <div className="text-[16px] font-black uppercase tracking-tight">{title}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[10px] font-bold uppercase">{subtitle}</div>
        <div className="font-mono text-[9px] text-gray-400 uppercase">{viewIdStr}</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex items-start justify-between mb-6 gap-3 shrink-0 print:hidden p-4 lg:p-0">
        <div>
          <h2 className="text-[20px] font-bold text-t1 uppercase tracking-tight">Registro de Semanas</h2>
        </div>
        <div className="flex gap-2">
          <select 
            value={semana} 
            onChange={e => setSemana(e.target.value)}
            className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[12px] px-3 py-1.5 outline-none focus:border-b3"
          >
            <option value="custom">Filtro Global Ativo ({state.globalFilter.periodDays} dias)</option>
            {weeks.map(w => (
              <option key={w} value={w}>Semana {w.replace('S','')} {state.relatorios[w] ? '🔒' : '🔓'}</option>
            ))}
            {savedCustoms.map(w => (
              <option key={w} value={w}>Especial: {w.replace('CUSTOM-','')} 🔒</option>
            ))}
            {weeks.length === 0 && savedCustoms.length === 0 && <option value="custom">Nenhuma semana disponível</option>}
          </select>
          
          {!isFechado && semana && (
             <button 
                onClick={handleFecharSemana}
                disabled={isClosing}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md font-sans text-[11px] font-black uppercase tracking-widest bg-brand-green text-[#0a0d0a] hover:opacity-90 transition-all disabled:opacity-50"
             >
                {isClosing ? <Settings size={14} className="animate-spin" /> : <Lock size={14} />}
                {isClosing ? 'Processando IA...' : 'FECHAR SEMANA'}
             </button>
          )}

          {isFechado && (
              <button 
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-sans text-[11px] font-extrabold tracking-[0.05em] bg-gray-200 text-black hover:bg-gray-300 transition-all border border-gray-400"
              >
                <FileDown size={14} />
                GERAR PDF (IMUTÁVEL)
              </button>
          )}
        </div>
      </div>

      {/* Conteúdo Dinâmico (Preview vs PDF) */}
      <div className="flex-1 overflow-y-auto bg-gray-200 p-4 lg:p-10 print:p-0 print:bg-white print:overflow-visible">
        
        {!isFechado && (
            <div className="max-w-[850px] mx-auto bg-amber-50 border-l-4 border-amber-500 p-8 rounded-sm mb-8 print:hidden shadow-sm">
                <div className="flex items-start gap-4">
                    <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                    <div>
                        <h3 className="font-bold text-amber-900 uppercase tracking-widest text-[14px] mb-2">Semana em Aberto</h3>
                        <p className="text-[13px] text-amber-800 leading-relaxed max-w-xl">
                            Os dados do diário e evolução de {semana} ainda não foram consolidados. Clique em <strong>[FECHAR SEMANA]</strong> para processar a inteligência artificial, salvar os painéis e habilitar a exportação definitiva. Nenhuma alteração retroativa no diário afetará os relatórios após o fechamento.
                        </p>
                    </div>
                </div>
            </div>
        )}

        <div className={`max-w-[850px] mx-auto space-y-8 print:space-y-0 relative ${!isFechado ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
          
          {/* PAGE 1: CAPA PREMIUM BERTI */}
          <section className="bg-white text-black p-[60px] aspect-[1/1.41] shadow-2xl flex flex-col justify-between print:shadow-none print:m-0 print:w-full print:h-[297mm] break-after-page border border-gray-100 relative overflow-hidden">
            {/* Imagem de Capa se houver */}
            {fotosSemana.length > 0 && (
                <div className="absolute inset-0 opacity-10">
                    <img src={fotosSemana[fotosSemana.length - 1].url} className="w-full h-full object-cover" />
                </div>
            )}
            
            <div className="relative z-10 flex justify-between items-start">
               <div className="font-black text-[24px] tracking-tighter">BERTI</div>
               <div className="text-right font-mono text-[9px] uppercase tracking-widest text-gray-400">Engineering & Management</div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-center">
               <div className="text-[11px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-6">Relatório Semanal Consolidado</div>
               <h1 className="text-[72px] font-black leading-[0.9] uppercase tracking-tighter mb-8">
                  Badida <br/> 
                  <span className="text-gray-300">ParkShopping</span>
               </h1>
               <div className="w-20 h-1 bg-black mb-12"></div>
               
               <div className="space-y-8">
                  <div>
                     <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Cliente Representante</div>
                     <div className="text-[16px] font-bold uppercase tracking-tight text-gray-900">TMK Comércio de Alimentos LTDA</div>
                  </div>
                  <div>
                     <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Localização do Projeto</div>
                     <div className="text-[16px] font-bold uppercase tracking-tight text-gray-900">Curitiba, PR — ParkShopping Barigui</div>
                  </div>
               </div>
            </div>

            <div className="relative z-10 flex justify-between items-end border-t border-gray-200 pt-10">
               <div>
                  <div className="text-[14px] font-bold">{semana === 'custom' ? 'Relatório Personalizado' : `Semana ${semana ? semana.replace('S','') : '—'}`}</div>
                  <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
                     {isFechado ? <Lock size={10} className="text-brand-green" /> : ''} 
                     {renderMonday ? new Date(renderMonday).toLocaleDateString('pt-BR') : '—'}
                  </div>
               </div>
               <div className="text-[10px] font-mono text-gray-500 uppercase text-right leading-relaxed">
                  Gerado via EVIS AI <br/>
                  Documentação Imutável {isFechado && relatorioFechado?.data_fechamento ? new Date(relatorioFechado.data_fechamento).toLocaleDateString('pt-BR') : ''}
               </div>
            </div>
          </section>

          {/* PAGE 2: RESUMO EXECUTIVO */}
          <section className="bg-white text-black p-[60px] aspect-[1/1.41] shadow-2xl print:shadow-none print:m-0 print:w-full print:h-[297mm] break-after-page border border-gray-100 flex flex-col">
             <PageHeader title="02. Síntese Executiva" subtitle="Inteligência de Obra" />

             <div className="grid grid-cols-2 gap-6 mb-12">
                <div className="bg-gray-50 p-6 rounded-sm border border-gray-100 flex flex-col justify-between h-32">
                   <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Avanço Físico (Semana)</div>
                   <div className="text-4xl font-black tabular-nums">{pctConcluido}%</div>
                   <div className="w-full h-1 bg-gray-200 mt-2">
                      <div className="h-full bg-black" style={{ width: `${pctConcluido}%` }}></div>
                   </div>
                </div>
                <div className="bg-gray-50 p-6 rounded-sm border border-gray-100 flex flex-col justify-between h-32">
                   <div className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Peso Ponderado (Semana)</div>
                   <div className="text-4xl font-black tabular-nums">{pctMedia}%</div>
                   <div className="text-[9px] text-gray-400 mt-2 uppercase">Média Progressiva</div>
                </div>
             </div>

             <div className="mb-8">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">Resumo Executivo Obras (IA)</div>
                <div className="text-[14px] leading-relaxed text-gray-900 bg-gray-50/50 p-6 rounded-sm border border-gray-100 font-sans">
                   {resExecutivo}
                </div>
             </div>

             <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 px-1 flex items-center gap-2">
                    <Calendar size={12}/> Dinâmica Evolutiva
                </div>
                <div className="text-[13px] leading-[1.8] text-gray-800 bg-gray-50/20 p-6 rounded-sm italic border-l-[3px] border-black font-serif">
                   {narrTecnica}
                </div>
             </div>
          </section>

          {/* PAGE 3: MATRIZ DE PRESENÇA E PENDENCIAS */}
          <section className="bg-white text-black p-[60px] aspect-[1/1.41] shadow-2xl print:shadow-none print:m-0 print:w-full print:h-[297mm] break-after-page border border-gray-100 flex flex-col">
             <PageHeader title="03. Rastreabilidade e Fatores" subtitle="Recursos em Campo" />

             <div className="mb-10">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">Matriz de Equipes - Semana Ativa</div>
                <table className="w-full border-collapse">
                   <thead>
                      <tr className="bg-gray-50 text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                         <th className="p-4 text-left border border-gray-100">Cód / Fornecedor</th>
                         {['S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                            <th key={d} className="p-4 text-center border border-gray-100 w-16">{d}</th>
                         ))}
                      </tr>
                   </thead>
                   <tbody className="text-[11px] font-mono">
                      {(() => {
                          if (!renderMonday) return null;
                          return state.equipes.map(eq => {
                            let wasPresent = false;
                            
                            const maxDays = semana === 'custom' ? state.globalFilter.periodDays : 6;
                            const cells = Array.from({length: maxDays}).map((_, offset) => {
                                  const d = new Date(renderMonday);
                                  d.setDate(new Date(renderMonday).getDate() + offset);
                                  if (d > refD && semana === 'custom') return null; // cap visual se passar do endDate

                                  const dStr = d.toISOString().split('T')[0];
                                  const isPresent = (presenca[dStr] || []).includes(eq.cod);
                                  if (isPresent) wasPresent = true;
                                  return (
                                    <td key={offset} className="p-4 border border-gray-100 text-center">
                                       {isPresent ? <div className="w-4 h-4 bg-black rounded-full mx-auto shadow-sm ring-2 ring-gray-100"></div> : <span className="text-gray-100 shrink-0">·</span>}
                                    </td>
                                  );
                            });

                            if (!wasPresent && isFechado) return null;

                            return (
                                <tr key={eq.cod} className="hover:bg-gray-50 transition-colors">
                                   <td className="p-4 border border-gray-100">
                                      <div className="font-bold text-gray-900 uppercase tracking-tighter">{eq.nome}</div>
                                      <div className="text-[8px] text-gray-400">{eq.cod}</div>
                                   </td>
                                   {cells}
                                </tr>
                            )
                          });
                      })()}
                   </tbody>
                </table>
             </div>

             <div className="flex-1 mt-6">
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">Pendências e Riscos da Semana</div>
                <div className="space-y-3">
                   {pendsAtivas.length === 0 ? (
                       <div className="p-4 bg-gray-50 border border-gray-100 rounded-sm text-gray-400 text-[11px] font-mono uppercase text-center">Nenhuma pendência ativa congelada nesta semana.</div>
                   ) : pendsAtivas.map(p => (
                      <div key={p.id} className="flex gap-4 p-4 border border-gray-100 rounded-sm items-center bg-white">
                         <div className={`w-1.5 h-1.5 rounded-full ${p.prioridade === 'alta' ? 'bg-red-600' : 'bg-black'}`}></div>
                         <div className="text-[12px] font-bold text-gray-800 uppercase tracking-tight flex-1">{p.descricao}</div>
                         <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest border border-gray-200 px-2 py-1 rounded-full">{p.status}</div>
                      </div>
                   ))}
                </div>
             </div>

             <div className="mt-auto flex justify-between items-end grayscale opacity-50 pt-10 border-t border-gray-100">
                 <div className="text-[9px] font-bold uppercase tracking-widest">Berti Engineering • Quality Assurance</div>
                 <div className="text-[9px] font-mono tabular-nums">P. 03 // 05</div>
             </div>
          </section>

          {/* PAGE 4: CRONOGRAMA FÍSICO */}
          <section className="bg-white text-black p-[60px] aspect-[1/1.41] shadow-2xl print:shadow-none print:m-0 print:w-full print:h-[297mm] break-after-page border border-gray-100 flex flex-col">
             <PageHeader title="04. Cronograma de Atividades" subtitle="Status Físico da Construção" />
             
             <p className="text-[10px] uppercase font-mono tracking-widest text-gray-400 mb-6 px-1">Exibindo apenas serviços em andamento ou iniciados na semana.</p>

             <div className="flex-1">
                <table className="w-full border-collapse">
                   <thead>
                      <tr className="bg-gray-50 text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                         <th className="p-3 text-left border border-gray-100 w-16">ID</th>
                         <th className="p-3 text-left border border-gray-100">Escopo de Trabalho</th>
                         <th className="p-3 text-center border border-gray-100 w-24">Avn%</th>
                      </tr>
                   </thead>
                   <tbody className="text-[11px]">
                      {(() => {
                         const cats = ['Preliminares', 'Demolições', 'Drywall / Forro', 'Elétrica', 'Ar-condicionado', 'Pintura', 'PPCI / Incêndio'];
                         return cats.map(cat => {
                            const items = cronoAtivo.filter(s => s.categoria === cat).slice(0, 15);
                            if (items.length === 0) return null;
                            return (
                               <React.Fragment key={cat}>
                                  <tr className="bg-gray-50">
                                     <td colSpan={3} className="p-2 pl-4 font-black uppercase text-[10px] tracking-widest text-gray-400 bg-gray-50 border border-gray-100">{cat}</td>
                                  </tr>
                                  {items.map(s => (
                                     <tr key={s.id_servico} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 font-mono text-[9px] text-gray-400 border border-gray-100">{s.id_servico}</td>
                                        <td className="p-3 font-bold text-gray-700 border border-gray-100">{s.nome}</td>
                                        <td className="p-3 border border-gray-100">
                                           <div className="flex items-center gap-3">
                                              <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                 <div className={`h-full ${s.avanco_atual >= 100 ? 'bg-black' : 'bg-black/60'}`} style={{ width: `${s.avanco_atual}%` }}></div>
                                              </div>
                                              <span className="font-mono font-black text-[10px] w-8 text-right tabular-nums">{s.avanco_atual}%</span>
                                           </div>
                                        </td>
                                     </tr>
                                  ))}
                               </React.Fragment>
                            );
                         });
                      })()}
                   </tbody>
                </table>
             </div>
             <div className="mt-auto flex justify-between items-end grayscale opacity-50 pt-10 border-t border-gray-100">
                 <div className="text-[9px] font-bold uppercase tracking-widest">Berti Engineering • Performance Monitor</div>
                 <div className="text-[9px] font-mono tabular-nums">P. 04 // 05</div>
             </div>
          </section>

          {/* PAGE 5: GESTÃO FOTOGRÁFICA */}
          <section className="bg-white text-black p-[60px] aspect-[1/1.41] shadow-2xl print:shadow-none print:m-0 print:w-full print:h-[297mm] border border-gray-100 flex flex-col">
             <PageHeader title="05. Documentação Visual" subtitle="Fichas de Campo e Rastreadores" />

             <div className="grid grid-cols-2 gap-8 mb-12 flex-1 content-start">
                {fotosSemana.length > 0 ? fotosSemana.slice(0, 6).map(f => (
                   <div key={f.id} className="flex flex-col border border-gray-100 p-3 rounded-sm bg-gray-50/30">
                      <div className="aspect-[4/3] bg-gray-100 overflow-hidden mb-4">
                         <img src={f.url} alt={f.legenda} className="w-full h-full object-cover filter contrast-[1.05]" />
                      </div>
                      <div className="px-1">
                         <div className="text-[11px] font-black uppercase tracking-tighter text-gray-900 mb-1">{f.legenda || 'Registro Estrutural'}</div>
                         <div className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">{new Date(f.data_foto).toLocaleDateString('pt-BR')}</div>
                      </div>
                   </div>
                )) : (
                   <div className="col-span-2 py-32 text-center border border-dashed border-gray-200 rounded-lg">
                      <div className="text-gray-300 font-mono text-[10px] uppercase tracking-[0.3em]">Ambiente fotorrastreável vazio nesta semana</div>
                   </div>
                )}
             </div>

             {notasAtivas.length > 0 && (
                 <div className="mb-10">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 px-1">Registros Auxiliares</div>
                    <div className="grid grid-cols-1 gap-3">
                       {notasAtivas.slice(0, 3).map(n => (
                          <div key={n.id} className="p-4 bg-gray-50 border border-gray-100 rounded-sm flex gap-4 items-start">
                             <MessageSquare size={12} className="mt-0.5 shrink-0 text-gray-400" />
                             <div className="text-[12px] leading-relaxed text-gray-700 italic font-serif">{n.texto}</div>
                          </div>
                       ))}
                    </div>
                 </div>
             )}

             <div className="mt-auto flex justify-between items-end pt-8 border-t border-gray-100">
                 <div className="flex flex-col gap-1">
                    <div className="font-black text-[20px] tracking-tighter">BERTI</div>
                    <div className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">Engineering Documentation Service</div>
                 </div>
                 <div className="flex flex-col items-end gap-2">
                    <div className="w-12 h-12 bg-black flex items-center justify-center text-white text-[12px] font-black tracking-tighter">B</div>
                    <div className="text-[8px] font-mono text-gray-400 text-right uppercase tracking-[0.2em]">P. 05 // 05</div>
                 </div>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
}
