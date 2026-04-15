import React, { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { aiCall, geminiCall } from '../lib/api';
import { Pendencia, Nota, IAResult } from '../types';
import { Mic, Check, AlertTriangle, AlertCircle, ArrowRight, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import AudioRecorder from './AudioRecorder';
import AIAnalysis from './AIAnalysis';
import HITLReview from './HITLReview';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Diario() {
  const { state, setState, config, markPending, toast } = useAppContext();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);

  const currentDay = state.currentDay;
  const entry = state.diario[currentDay] || {};

  const selectDay = (k: string) => {
    setState({ ...state, currentDay: k });
  };

  const togglePresenca = (eq: string) => {
    const present = state.presenca[currentDay] || [];
    const isPresent = present.includes(eq);
    const newPresent = isPresent ? present.filter(e => e !== eq) : [...present, eq];
    
    setState(prev => ({
      ...prev,
      presenca: { ...prev.presenca, [currentDay]: newPresent }
    }));
    
    markPending('equipes_presenca', { id: `${currentDay}-${eq}`, equipe: eq, dia: currentDay });
  };

  const saveDiaryLocal = (text: string) => {
    const ts = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setState(prev => {
      const nd = { ...prev.diario };
      if (!nd[currentDay]) nd[currentDay] = { texto: '' };
      nd[currentDay].texto = text;
      nd[currentDay].ts = ts as any; // Cast until ts is in type
      return { ...prev, diario: nd };
    });
    markPending('diario_obra', { id: (entry as any).db_id || `D-${currentDay}`, transcricao: text, day: currentDay, db_id: (entry as any).db_id || null });
  };





   const confirmIA = (revisado?: any) => {
     const ia = revisado || entry.iaResult;
     if (!ia) return;
     
     const newServicos = [...state.servicos];
     // Adaptação: aceita tanto o formato original da IA quanto o revisado pelo HITL
     const servicosParaAtualizar = ia.servicos_atualizar || ia.servicos || [];
     
     servicosParaAtualizar.forEach((u: any) => {
       const targetId = u.id_servico || u.id;
       const idx = newServicos.findIndex(x => x.id === targetId || x.id_servico === targetId);
       if (idx >= 0) {
         newServicos[idx] = { 
           ...newServicos[idx], 
           avanco_atual: u.avanco_novo ?? u.avanco, 
           status: u.status_novo ?? u.status,
           data_prevista: u.data_prevista ?? u.data_inicio,
           data_conclusao: u.data_conclusao ?? u.data_fim
         };
         markPending('servicos', newServicos[idx]);
       }
     });

    const newPendencias = [...state.pendencias];
    const pendenciasNovas = ia.pendencias_novas || ia.notas?.filter((n: any) => n.tipo === 'Pendência') || [];
    
    pendenciasNovas.forEach((p: any) => {
      const pend: Pendencia = { 
        id: crypto.randomUUID(), 
        descricao: p.descricao || p.texto, 
        prioridade: (p.prioridade || p.gravidade || 'media') as 'alta' | 'media' | 'baixa', 
        status: 'ABERTA' as const, 
        obra_id: config.obraId 
      };
      newPendencias.unshift(pend);
      markPending('pendencias', pend);
    });

    // ... (restante da lógica de notas e presença mantida)
    const newNotas = [...state.notas];
    const notasParaAdicionar = ia.notas_adicionar || ia.notas || [];
    notasParaAdicionar.forEach((n: any) => {
        const nota: Nota = { id: crypto.randomUUID(), tipo: 'observacao', texto: n.descricao || n.texto || '', data_nota: new Date().toISOString() };
        newNotas.unshift(nota);
        markPending('notas', nota);
    });

    const currentPresenca = [...(state.presenca[currentDay] || [])];
    const equipesPresentes = ia.equipes_presentes || ia.equipes || [];
    equipesPresentes.forEach((eq: any) => {
      const eqCod = typeof eq === 'string' ? eq : (eq.cod || eq.id);
      const eqObj = state.equipes.find(e => e.cod === eqCod || e.nome.toLowerCase().includes(eqCod.toLowerCase()));
      const codeToMark = eqObj ? eqObj.cod : eqCod;
      if (!currentPresenca.includes(codeToMark)) {
        currentPresenca.push(codeToMark);
        markPending('equipes_presenca', { id: `${currentDay}-${codeToMark}`, equipe: codeToMark, dia: currentDay });
      }
    });

    setState(prev => {
      const nd = { ...prev.diario };
      nd[currentDay].confirmado = true;
      return { 
        ...prev, 
        servicos: newServicos, 
        pendencias: newPendencias, 
        notas: newNotas, 
        diario: nd, 
        presenca: { ...prev.presenca, [currentDay]: currentPresenca }
      };
    });
    
    queryClient.invalidateQueries({ queryKey: ['servicos', config.obraId] });
    toast('Diário processado e atualizado!', 'success');
  };

  const changeWeek = (offset: number) => {
    const d = new Date(currentDay);
    d.setDate(d.getDate() + offset * 7);
    const localDate = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    setState({ ...state, currentDay: localDate.toISOString().split('T')[0] });
  };

  const dd = new Date(currentDay);
  const localDd = new Date(dd.getTime() + dd.getTimezoneOffset() * 60000);
  const monday = new Date(localDd);
  monday.setDate(localDd.getDate() - (localDd.getDay() === 0 ? 6 : localDd.getDay() - 1));
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const dateLabel = `${DAYS[localDd.getDay()]}, ${localDd.getDate()} de ${MONTHS[localDd.getMonth()]} de ${localDd.getFullYear()}`;

  const srv = state.servicos;
  const total = srv.length || 1;
  const doneSrv = srv.filter(s => s.status === 'concluido' || s.avanco_atual >= 100);
  const done = doneSrv.length;
  const pctConcluido = Math.round((done / total) * 100);
  const pctMedia = Math.round(srv.reduce((acc, s) => acc + (s.avanco_atual || 0), 0) / total);
  const wip = srv.filter(s => s.status === 'em_andamento').length;
  const pend = state.pendencias.filter(p => p.status === 'ABERTA').length;

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-t1">Diário de Obra</h2>
          <p className="font-mono text-[11px] text-t3 mt-1">{dateLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 mb-6">
        <div className="bg-s1 border border-b1 rounded-[10px] p-4 relative overflow-hidden">
          <div className="font-mono text-[9px] text-t3 uppercase tracking-[0.12em] mb-2">Avanço Físico Absoluto</div>
          <div className="text-[28px] font-extrabold leading-none text-brand-green">{pctConcluido}%</div>
          <div className="font-mono text-[10px] text-t3 mt-1.5">{done} de {srv.length} Serv. Concluídos</div>
          <div className="absolute right-[-10px] bottom-[-20px] text-[80px] text-brand-green/5 font-extrabold">%</div>
        </div>
        <div className="bg-s1 border border-b1 rounded-[10px] p-4 relative overflow-hidden">
          <div className="font-mono text-[9px] text-t3 uppercase tracking-[0.12em] mb-2">Progresso Ponderado</div>
          <div className="text-[28px] font-extrabold leading-none text-t1">{pctMedia}%</div>
          <div className="font-mono text-[10px] text-t3 mt-1.5">Média linear</div>
          <div className="absolute right-[-5px] bottom-[-20px] text-[80px] text-t3/10 font-extrabold">~</div>
        </div>
        <div className="bg-s1 border border-b1 rounded-[10px] p-4">
          <div className="font-mono text-[9px] text-t3 uppercase tracking-[0.12em] mb-2">Em andamento</div>
          <div className="text-[28px] font-extrabold leading-none text-t1">{wip}</div>
          <div className="font-mono text-[10px] text-t3 mt-1.5">serviços ativos</div>
        </div>
        <div className="bg-s1 border border-b1 rounded-[10px] p-4">
          <div className="font-mono text-[9px] text-t3 uppercase tracking-[0.12em] mb-2">Pendências</div>
          <div className="text-[28px] font-extrabold leading-none text-brand-amber">{pend}</div>
          <div className="font-mono text-[10px] text-t3 mt-1.5">abertas</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2.5">
        <div className="font-mono text-[10px] text-t3 uppercase tracking-[0.12em]">Semana</div>
        <div className="flex gap-1">
          <button onClick={() => changeWeek(-1)} aria-label="Semana anterior" className="p-1 rounded bg-s2 border border-b1 text-t3 hover:text-t1 hover:border-b2 transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => changeWeek(1)} aria-label="Próxima semana" className="p-1 rounded bg-s2 border border-b1 text-t3 hover:text-t1 hover:border-b2 transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5 mb-5">
        {weekDays.map(d => {
          const k = d.toISOString().split('T')[0];
          const isActive = k === currentDay;
          const hasEntry = !!state.diario[k];
          return (
            <div 
              key={k} 
              onClick={() => selectDay(k)}
              className={`py-2.5 px-1.5 rounded-lg border text-center cursor-pointer transition-all ${
                isActive ? 'border-brand-green bg-brand-green/5' : 'border-b1 bg-s1 hover:border-b2 hover:bg-s2'
              }`}
            >
              <div className="font-mono text-[9px] text-t3 uppercase tracking-[0.1em]">{DAYS[d.getDay()]}</div>
              <div className={`text-[16px] font-bold mt-1 ${isActive ? 'text-brand-green' : 'text-t1'}`}>
                {String(d.getDate()).padStart(2, '0')}/{String(d.getMonth() + 1).padStart(2, '0')}
              </div>
              <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1.5 ${hasEntry ? 'bg-brand-green' : 'bg-b2'}`}></div>
            </div>
          );
        })}
      </div>

      <div className="font-mono text-[10px] text-t3 uppercase tracking-[0.12em] mb-2.5">Presença no dia</div>
      <div className="flex flex-wrap gap-1.5 mb-5">
        {state.equipes.map(eq => {
          const on = (state.presenca[currentDay] || []).includes(eq.cod);
          return (
            <div 
              key={eq.cod} 
              onClick={() => togglePresenca(eq.cod)}
              className={`flex items-center gap-[7px] px-3 py-1.5 rounded-md border cursor-pointer text-[12px] transition-all select-none ${
                on ? 'border-brand-green bg-brand-green/5 text-t1' : 'border-b1 bg-s1 text-t2 hover:border-b2'
              }`}
            >
              <div className={`w-[13px] h-[13px] rounded-[3px] border flex items-center justify-center shrink-0 transition-all ${
                on ? 'bg-brand-green border-brand-green' : 'border-b3'
              }`}>
                {on && <Check className="w-2 h-2 text-[#0a0d0a]" strokeWidth={3} />}
              </div>
              {eq.nome}
            </div>
          );
        })}
      </div>

      <div className="bg-s1 border border-b1 rounded-xl p-6 mb-4">
        <AudioRecorder 
          onTranscricaoCompleta={(text) => saveDiaryLocal((entry.texto ? entry.texto + '\n\n' : '') + text)} 
          disabled={isProcessing} 
        />
        
        <textarea 
          value={entry.texto || ''}
          onChange={e => saveDiaryLocal(e.target.value)}
          rows={6} 
          placeholder="Narrativa de hoje..."
          className="w-full min-h-[130px] resize-y bg-s2 border border-b1 rounded-lg text-t1 font-mono text-[12px] leading-[1.75] p-3.5 outline-none transition-colors focus:border-b2"
        />
        
        <div className="flex items-center gap-2 mt-2.5">
          <button className="px-2.5 py-1.5 rounded-md text-[11px] font-bold tracking-[0.05em] text-t2 border border-b2 hover:border-b3 hover:text-t1 transition-colors" onClick={() => saveDiaryLocal(entry.texto || '')}>✓ Salvar</button>
          
          <AIAnalysis 
            transcricao={entry.texto || ''}
            servicos={state.servicos}
            equipes={state.equipes}
            dataReferencia={currentDay}
            config={config}
            onResultado={(ia) => setState(prev => {
              const nd = { ...prev.diario };
              if (!nd[currentDay]) nd[currentDay] = { texto: '' };
              nd[currentDay].iaResult = ia;
              return { ...prev, diario: nd };
            })}
            onLoading={setIsProcessing}
            onError={(msg) => toast('Erro IA: ' + msg, 'error')}
          />

          <button className="px-2.5 py-1.5 rounded-md text-[11px] font-bold tracking-[0.05em] text-t2 border border-b2 hover:border-b3 hover:text-t1 transition-colors" onClick={() => saveDiaryLocal('')}>Limpar</button>
          <span className="font-mono text-[10px] text-t3 ml-auto">{(entry as any).ts ? `salvo ${(entry as any).ts}` : ''}</span>
        </div>
      </div>

      {isProcessing && (
        <div className="flex items-center gap-2.5 font-mono text-[11px] text-brand-purple py-3">
          <div className="w-3.5 h-3.5 border-2 border-s4 border-t-brand-purple rounded-full animate-spin"></div>
          Analisando com IA...
        </div>
      )}

      {entry.iaResult && !entry.confirmado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <HITLReview 
            resultado={{
              servicos: entry.iaResult.servicos_atualizar?.map(s => ({ 
                id: s.id_servico, 
                avanco: s.avanco_novo, 
                status: s.status_novo,
                data_prevista: s.data_prevista,
                data_conclusao: s.data_conclusao
              })) || [],
              equipes: entry.iaResult.equipes_presentes?.map(e => ({ cod: e, nome: e })) || [],
              notas: entry.iaResult.notas_adicionar?.map(n => ({ tipo: n.tipo, descricao: n.texto })) || []
            }}
            original={{
              servicos: entry.iaResult.servicos_atualizar?.map(s => ({ 
                id: s.id_servico, 
                avanco: s.avanco_novo, 
                status: s.status_novo,
                data_prevista: s.data_prevista,
                data_conclusao: s.data_conclusao
              })) || [],
              equipes: entry.iaResult.equipes_presentes?.map(e => ({ cod: e, nome: e })) || [],
              notas: entry.iaResult.notas_adicionar?.map(n => ({ tipo: n.tipo, descricao: n.texto })) || []
            }}
            onConfirm={(revisado) => confirmIA(revisado)}
            onCancel={() => setState(prev => { 
              const nd = {...prev.diario}; 
              delete nd[currentDay].iaResult; 
              return {...prev, diario: nd} 
            })}
          />
        </div>
      )}
    </div>
  );
}
