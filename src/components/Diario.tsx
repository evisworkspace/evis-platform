import React, { useState, useRef } from 'react';
import { useAppContext } from '../AppContext';
import { aiCall, geminiCall } from '../lib/api';
import { Pendencia, Nota, IAResult } from '../types';
import { Mic, Check, AlertTriangle, AlertCircle, ArrowRight, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Diario() {
  const { state, setState, config, markPending, toast } = useAppContext();
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micLabel, setMicLabel] = useState('Toque para gravar');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
    
    markPending('equipes_presenca', { equipe: eq, dia: currentDay });
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
    markPending('diario_obra', { transcricao: text, day: currentDay, db_id: (entry as any).db_id || null });
  };

  const toggleRec = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mediaRec = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRec;
      chunksRef.current = [];
      
      mediaRec.ondataavailable = e => chunksRef.current.push(e.data);
      mediaRec.onstop = () => {
        setIsRecording(false);
        setMicLabel('Transcrevendo...');
        transcribeBlob(new Blob(chunksRef.current, { type: 'audio/webm' }));
        stream.getTracks().forEach(t => t.stop());
      };
      
      mediaRec.start();
      setIsRecording(true);
      setMicLabel('Gravando — toque para parar');
    }).catch(() => toast('Microfone indisponível.', 'error'));
  };

  const transcribeBlob = async (blob: Blob) => {
    if (!config.gemini) {
      setMicLabel('Configure a API Key');
      toast('Configure a API Key do Gemini nas configurações.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = (reader.result as string).split(',')[1];
      try {
        const res = await geminiCall([
          { text: 'Transcreva o áudio de registro de obra a seguir. Retorne apenas a transcrição limpa:' },
          { inline_data: { mime_type: 'audio/webm', data: b64 } }
        ], 0.1, 2048, config);
        
        const newText = (entry.texto ? entry.texto + '\n\n' : '') + res;
        saveDiaryLocal(newText);
        setMicLabel('Toque para gravar');
      } catch (e) {
        setMicLabel('Erro na transcrição');
        toast('Erro na transcrição de áudio.', 'error');
      }
    };
    reader.readAsDataURL(blob);
  };

  const runIA = async () => {
    const txt = entry.texto?.trim();
    if (!txt) { toast('Escreva ou grave o registro do dia primeiro.', 'error'); return; }
    if (!config.gemini) { toast('Configure a API Key do Gemini.', 'error'); return; }

    setIsProcessing(true);

    const srvJson = JSON.stringify(state.servicos.map(s => ({ id: s.id_servico, nome: s.nome, avanco: s.avanco_atual, status: s.status_atual, data_inicio: s.data_inicio || null, data_fim: s.data_fim || null })));
    const pendJson = JSON.stringify(state.pendencias.filter(p => p.status === 'ABERTA').map(p => ({ id: p.id, desc: p.descricao })));
    const equipeHoje = (state.presenca[currentDay] || []).join(', ') || 'não registrada';
    const equipesDisponiveis = state.equipes.map(e => `${e.cod} (${e.nome})`).join(', ') || 'nenhuma cadastrada';

    const prompt = `Você é o Engenheiro de Dados do sistema EVIS de acompanhamento de obra.
Analise o relato diário e cruze com os dados atuais do sistema para gerar as atualizações corretas.

DATA DO RELATO: ${currentDay}
EQUIPE JÁ MARCADA MANUALMENTE: ${equipeHoje}
EQUIPES CADASTRADAS NO SISTEMA: ${equipesDisponiveis}

TODOS OS SERVIÇOS DO ESCOPO:
${srvJson}

PENDÊNCIAS ABERTAS:
${pendJson}

RELATO DO DIA:
"${txt}"

INSTRUÇÕES IMPORTANTES:
1. CONTEXTO TEMPORAL: Para todos os cálculos de datas e registro de presença, hoje é ${currentDay}.
2. PRESENÇA: Se o relato mencionar uma equipe realizando atividade ou estiver no local (ex: "Valdeci iniciou...", "Pro Ar medindo..."), inclua o código correto dessa equipe em equipes_presentes para a data ${currentDay}.
3. NARRATIVA: Comece obrigatoriamente com "${currentDay} —" e descreva de forma técnica os avanços, equipes presentes e próximos passos.
4. DATAS DOS SERVIÇOS: Retorne data_inicio e data_fim (formato YYYY-MM-DD) OU null. Use estas regras:
   - Se status="concluido": data_fim = hoje (obrigatório), data_inicio pode ser null.
   - Se status="em_andamento" ou "nao_iniciado": pode retornar null (será ajustado conforme obra avança).
   *Pode usar null para datas não definidas ainda.*
5. NOTAS E OBSERVAÇÕES: Extraia do relato e classifique OBRIGATORIAMENTE o campo "tipo" de cada item de "notas_adicionar" usando EXATAMENTE um destes 4 valores:
    - "observacao" (Para registros factuais ou avisos do dia)
    - "decisao" (Para decisões taken that day)
    - "alerta" (Para avisos importantes ou warnings)
    - "lembrete" (Para lembretes ou follow-ups)
6. Retorne APENAS um JSON válido.

{
  "resumo": "...",
  "narrativa": "${currentDay} — ...",
  "equipes_presentes": ["EQ-OBR-01"],
  "servicos_atualizar": [
    {"id_servico": "SRV-XXX", "avanco_novo": 85, "status_novo": "em_andamento", "data_inicio": "${currentDay}", "data_fim": "${currentDay}"}
  ],
  "pendencias_novas": [],
  "pendencias_resolver": [],
  "notas_adicionar": [
     {"texto": "Chegaram 10 sacos de cimento", "tipo": "material"}
  ]
}`;

    try {
      let raw = await aiCall(prompt, 0.15, 3000, config);
      raw = raw.replace(/```json\n?|```/g, '').trim();
      const ia = JSON.parse(raw);
      
      setState(prev => {
        const nd = { ...prev.diario };
        if (!nd[currentDay]) nd[currentDay] = { texto: '' };
        nd[currentDay].iaResult = ia as IAResult;
        return { ...prev, diario: nd };
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast('Erro IA: ' + msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

   // Função helper para garante datas - usa 1900-01-01 como placeholder se não definido
   const ensureDates = (update: any, servico: any): any => {
     const today = new Date().toISOString().split('T')[0];
     const placeholder = '1900-01-01'; // Indica "não definido"
     
     // Se status é "concluido", força data_fim para hoje
     const isConcluido = update.status_novo === 'concluido';
     
     // Mantém valor existente, ou placeholder se não houver
     const hasStart = update.data_inicio || servico.data_inicio;
     const hasEnd = update.data_fim || servico.data_fim;
     
     return {
       ...update,
       data_inicio: isConcluido ? (hasStart || today) : (hasStart || placeholder),
       data_fim: isConcluido ? today : (hasEnd || placeholder)
     };
   };

   const confirmIA = () => {
     const ia = entry.iaResult;
     if (!ia) return;
     
     const newServicos = [...state.servicos];
     (ia.servicos_atualizar || []).forEach(u => {
       const idx = newServicos.findIndex(x => x.id_servico === u.id_servico);
       if (idx >= 0) {
         const validated = ensureDates(u, newServicos[idx]);
         
         newServicos[idx] = { 
           ...newServicos[idx], 
           avanco_atual: u.avanco_novo, 
           status_atual: u.status_novo,
           data_inicio: validated.data_inicio,
           data_fim: validated.data_fim,
         };
         markPending('servicos', newServicos[idx]);
       }
     });

    const newPendencias = [...state.pendencias];
    (ia.pendencias_novas || []).forEach(p => {
      const pend: Pendencia = { 
        id: crypto.randomUUID(), 
        descricao: p.descricao, 
        prioridade: p.prioridade as 'alta' | 'media' | 'baixa', 
        status: 'ABERTA' as const, 
        obra_id: config.obraId 
      };
      newPendencias.unshift(pend);
      markPending('pendencias', pend);
    });

    (ia.pendencias_resolver || []).forEach(p => {
      const idx = newPendencias.findIndex(x => x.id === p.id);
      if (idx >= 0) {
        newPendencias[idx] = { ...newPendencias[idx], status: 'RESOLVIDA' as const };
        markPending('pendencias', newPendencias[idx]);
      }
    });

const validTipos = ['observacao', 'decisao', 'alerta', 'lembrete'];
     const normalizeTipo = (t: string): Nota['tipo'] => {
       const lower = (t || '').toLowerCase().trim();
       return validTipos.includes(lower) ? lower as Nota['tipo'] : 'observacao';
     };

     const newNotas = [...state.notas];
     if (ia.resumo) {
       const resumoNota: Nota = { id: crypto.randomUUID(), tipo: 'observacao' as const, texto: `Resumo do dia: ${ia.resumo}`, data_nota: new Date().toISOString() };
       newNotas.unshift(resumoNota);
       markPending('notas', resumoNota);
     }
     (ia.notas_adicionar || []).forEach(n => {
       const nota: Nota = { id: crypto.randomUUID(), tipo: normalizeTipo(n.tipo), texto: n.texto, data_nota: new Date().toISOString() };
       newNotas.unshift(nota);
       markPending('notas', nota);
     });

    const currentPresenca = [...(state.presenca[currentDay] || [])];
    (ia.equipes_presentes || []).forEach((eqCod: string) => {
      const eqObj = state.equipes.find(e => e.cod === eqCod || e.nome.toLowerCase().includes(eqCod.toLowerCase()));
      const codeToMark = eqObj ? eqObj.cod : eqCod;
      if (!currentPresenca.includes(codeToMark)) {
        currentPresenca.push(codeToMark);
        markPending('equipes_presenca', { equipe: codeToMark, dia: currentDay });
      }
    });

    markPending('brain_narrativas', { entrada: entry.texto, resposta_ia: ia });
    
    setState(prev => {
      const nd = { ...prev.diario };
      nd[currentDay].confirmado = true;
      const nn = { ...prev.narrativas, [currentDay]: ia.narrativa || '' };
      return { 
        ...prev, 
        servicos: newServicos, 
        pendencias: newPendencias, 
        notas: newNotas, 
        diario: nd, 
        narrativas: nn,
        presenca: { ...prev.presenca, [currentDay]: currentPresenca }
      };
    });
    
    // Invalidação de cache agendada para garantir que o Cronograma/Gantt atualize instantaneamente
    queryClient.invalidateQueries({ queryKey: ['servicos', config.obraId] });
    queryClient.invalidateQueries({ queryKey: ['diario_obra', config.obraId] });
    
    toast('Aplicado e presença atualizada automativamente! Sincronização em tempo real ativada.', 'success');
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
  const doneSrv = srv.filter(s => s.status_atual === 'concluido' || s.avanco_atual >= 100);
  const done = doneSrv.length;
  const pctConcluido = Math.round((done / total) * 100);
  const pctMedia = Math.round(srv.reduce((acc, s) => acc + (s.avanco_atual || 0), 0) / total);
  const wip = srv.filter(s => s.status_atual === 'em_andamento').length;
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
        <div className="flex flex-col items-center gap-2.5 mb-5">
          <div 
            onClick={toggleRec}
            aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
            className={`w-[68px] h-[68px] rounded-full flex items-center justify-center cursor-pointer transition-all ${
              isRecording 
                ? 'bg-brand-red/10 border-brand-red animate-pulse shadow-[0_0_0_0_rgba(248,113,113,0.25)]' 
                : 'bg-s3 border border-b2 hover:bg-s4 hover:border-b3'
            }`}
          >
            <Mic className={`w-[26px] h-[26px] ${isRecording ? 'text-brand-red' : 'text-t2'}`} strokeWidth={1.5} />
          </div>
          <span className={`font-mono text-[10px] tracking-[0.1em] ${isRecording ? 'text-brand-red' : 'text-t3'}`}>
            {micLabel}
          </span>
        </div>
        
        <textarea 
          value={entry.texto || ''}
          onChange={e => saveDiaryLocal(e.target.value)}
          rows={6} 
          placeholder="Narrativa de hoje..."
          className="w-full min-h-[130px] resize-y bg-s2 border border-b1 rounded-lg text-t1 font-mono text-[12px] leading-[1.75] p-3.5 outline-none transition-colors focus:border-b2"
        />
        
        <div className="flex items-center gap-2 mt-2.5">
          <button className="px-2.5 py-1.5 rounded-md text-[11px] font-bold tracking-[0.05em] text-t2 border border-b2 hover:border-b3 hover:text-t1 transition-colors" onClick={() => saveDiaryLocal(entry.texto || '')}>✓ Salvar</button>
          <button className="px-2.5 py-1.5 rounded-md text-[11px] font-extrabold tracking-[0.05em] bg-brand-amber text-[#0a0d0a] hover:bg-[#f59e0b] transition-colors" onClick={runIA}>★ Processar com IA</button>
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
        <div className="bg-s1 border border-brand-purple/25 rounded-xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4.5">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-brand-purple bg-brand-purple/10 border border-brand-purple/20 px-2.5 py-1 rounded tracking-[0.08em] uppercase">
              ★ Sugestão IA — <span className="text-t3 ml-1">{currentDay}</span>
            </span>
            <div className="flex gap-2">
              <button onClick={confirmIA} className="px-2.5 py-1.5 rounded-md text-[11px] font-extrabold tracking-[0.05em] bg-brand-green text-[#0a0d0a] hover:bg-brand-green2 transition-colors">✓ Confirmar e aplicar</button>
              <button onClick={() => setState(prev => { const nd = {...prev.diario}; delete nd[currentDay].iaResult; return {...prev, diario: nd} })} className="px-2.5 py-1.5 rounded-md text-[11px] font-bold tracking-[0.05em] text-t2 border border-b2 hover:border-b3 hover:text-t1 transition-colors">×</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <div className="font-mono text-[9px] text-t3 uppercase tracking-[0.12em] mb-2">Resumo do dia</div>
              <div className="text-[13px] text-t2 leading-[1.7]">{entry.iaResult.resumo || '—'}</div>
              
              {entry.iaResult.servicos_atualizar && entry.iaResult.servicos_atualizar.length > 0 && (
                <>
                  <div className="font-mono text-[9px] text-t3 uppercase tracking-[0.12em] mb-2 mt-4">Avanços sugeridos</div>
                  <ul className="flex flex-col gap-1.5">
                    {entry.iaResult.servicos_atualizar.map((i, idx) => (
                      <li key={idx} className="flex gap-2 font-mono text-[11px] text-t2 leading-[1.5]">
                        <Check className="w-3.5 h-3.5 shrink-0 text-brand-green mt-0.5" />
                        <span>{i.id_servico} → {i.avanco_novo}% ({i.status_novo})</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
            <div>
              {entry.iaResult.pendencias_novas && entry.iaResult.pendencias_novas.length > 0 && (
                <>
                  <div className="font-mono text-[9px] text-t3 uppercase tracking-[0.12em] mb-2">Novas Pendências</div>
                  <ul className="flex flex-col gap-1.5 mb-4">
                    {entry.iaResult.pendencias_novas.map((i, idx) => (
                      <li key={idx} className="flex gap-2 font-mono text-[11px] text-t2 leading-[1.5]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-brand-amber mt-0.5" />
                        <span>[{i.prioridade}] {i.descricao}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              
              {entry.iaResult.pendencias_resolver && entry.iaResult.pendencias_resolver.length > 0 && (
                <>
                  <div className="font-mono text-[9px] text-t3 uppercase tracking-[0.12em] mb-2">Pendências Resolvidas</div>
                  <ul className="flex flex-col gap-1.5 mb-4">
                    {entry.iaResult.pendencias_resolver.map((i, idx) => (
                      <li key={idx} className="flex gap-2 font-mono text-[11px] text-t2 leading-[1.5]">
                        <Check className="w-3.5 h-3.5 shrink-0 text-brand-green mt-0.5" />
                        <span>{i.id}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
 
              {entry.iaResult.notas_adicionar && entry.iaResult.notas_adicionar.length > 0 && (
                <>
                  <div className="font-mono text-[9px] text-t3 uppercase tracking-[0.12em] mb-2">Notas para Histórico</div>
                  <ul className="flex flex-col gap-1.5">
                    {entry.iaResult.notas_adicionar.map((i, idx) => (
                      <li key={idx} className="flex gap-2 font-mono text-[11px] text-t2 leading-[1.5]">
                        <MessageSquare className="w-3.5 h-3.5 shrink-0 text-brand-blue mt-0.5" />
                        <span>[{i.tipo}] {i.texto}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
