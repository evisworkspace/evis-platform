import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Send, Bot, User, FileText,
  Paperclip, Loader2, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';

import { SidebarEtapas, type Etapa } from './Orcamentista/SidebarEtapas';
import { DashboardDireita } from './Orcamentista/AuditDashboard';
import { MarkdownRenderer } from './Orcamentista/MarkdownRenderer';
import '../styles/orcamentista.css';

// ─── Tipos ─────────────────────────────────────────────────────────────────────
interface Anexo {
  id: string;
  nome: string;
  mimeType: string;
  base64?: string;
  origem: 'workspace' | 'inline';
  relativePath?: string;
}
interface Mensagem {
  id: string;
  role: 'user' | 'assistant' | 'hitl';
  conteudo: string;
  timestamp: Date;
  anexos?: { nome: string; mimeType: string }[];
  hitlData?: HitlPendente;
}
interface AuditLog { id: string; timestamp: Date; status: 'info' | 'success' | 'warning' | 'error'; mensagem: string; }
interface HitlPendente {
  roteiro: Array<{ id: number; etapa: string; agente_responsavel: string; hitl_obrigatorio: boolean }>;
  scoreConsistencia: number;
}

interface ProgressoRuntime {
  faseAtual: string;
  agenteAtual: string;
  origemExecucao: string;
  leituraMultimodal: boolean;
  consolidadoDisponivel: boolean;
}

const ETAPAS_BASE: Etapa[] = [
  { id: 0, chave: 'briefing', titulo: 'Briefing e Inventário', descricao: 'Workspace e anexos detectados', status: 'pendente' },
  { id: 1, chave: 'macro', titulo: 'Leitura Macro do Projeto', descricao: 'Reader multimodal e inventário técnico', status: 'pendente' },
  { id: 2, chave: 'planner', titulo: 'Planejamento Técnico', descricao: 'Roteiro, dependências e especialistas', status: 'pendente' },
  { id: 3, chave: 'geotecnia', titulo: 'Geotecnia / SPT', descricao: 'Análise geotécnica quando aplicável', status: 'pendente' },
  { id: 4, chave: 'fundacao', titulo: 'Fundação', descricao: 'Base e dependências estruturais', status: 'pendente' },
  { id: 5, chave: 'estrutura', titulo: 'Estrutura', descricao: 'Concreto, aço e lajes', status: 'pendente' },
  { id: 6, chave: 'instalacoes', titulo: 'Instalações', descricao: 'Elétrica, hidráulica, HVAC, dados', status: 'pendente' },
  { id: 7, chave: 'civil', titulo: 'Civil / Arquitetônico', descricao: 'Vedação, revestimentos e acabamentos', status: 'pendente' },
  { id: 8, chave: 'quantitativos', titulo: 'Quantitativos', descricao: 'Levantamento consolidado', status: 'pendente' },
  { id: 9, chave: 'custos', titulo: 'Composição de Custos', descricao: 'Referências, composições e classificação', status: 'pendente' },
  { id: 10, chave: 'bdi', titulo: 'BDI e Encargos', descricao: 'Fechamento financeiro', status: 'pendente' },
  { id: 11, chave: 'cronograma', titulo: 'Cronograma', descricao: 'Sequenciamento físico-financeiro', status: 'pendente' },
  { id: 12, chave: 'auditoria', titulo: 'Auditoria Cruzada + HITL', descricao: 'Validação humana obrigatória', status: 'pendente' },
  { id: 13, chave: 'preliminar', titulo: 'Orçamento Preliminar', descricao: 'Memória e artefatos consolidados', status: 'pendente' },
  { id: 14, chave: 'json', titulo: 'Entrega JSON', descricao: 'Exportação final para EVIS Obra', status: 'pendente' },
];

const RUNTIME_INICIAL: ProgressoRuntime = {
  faseAtual: 'Aguardando briefing inicial',
  agenteAtual: 'Nenhum agente ativo',
  origemExecucao: 'Selecione um workspace para começar',
  leituraMultimodal: false,
  consolidadoDisponivel: false,
};

function criarEtapasIniciais(workspaceSelecionado: boolean): Etapa[] {
  return ETAPAS_BASE.map((etapa, index) => ({
    ...etapa,
    status: index === 0 ? (workspaceSelecionado ? 'em_andamento' : 'pendente') : 'pendente',
  }));
}

function getOrcamentistaQueryContext() {
  const params = new URLSearchParams(window.location.search);
  return {
    opportunityId: params.get('opportunity_id')?.trim() || '',
    workspaceId: params.get('workspace_id')?.trim() || '',
  };
}

function atualizarEtapas(
  etapas: Etapa[],
  chaves: string[],
  status: Etapa['status'],
  concluirAnteriores = false
): Etapa[] {
  const alvo = new Set(chaves);
  const ultimoIndiceAlvo = etapas.reduce((acc, etapa, index) => (alvo.has(etapa.chave) ? index : acc), -1);

  return etapas.map((etapa, index) => {
    if (alvo.has(etapa.chave)) {
      return { ...etapa, status };
    }
    if (concluirAnteriores && ultimoIndiceAlvo >= 0 && index < ultimoIndiceAlvo && etapa.status !== 'erro') {
      return { ...etapa, status: 'concluida' };
    }
    return etapa;
  });
}

function marcarNaoAplicaveis(etapas: Etapa[], chaves: string[]): Etapa[] {
  const alvo = new Set(chaves);
  return etapas.map((etapa) => (alvo.has(etapa.chave) ? { ...etapa, status: 'bloqueada' } : etapa));
}

function faseParaMensagem(message: string): {
  faseAtual: string;
  agenteAtual: string;
  etapasEmAndamento: string[];
  etapasConcluidas?: string[];
} {
  const normalized = message.toLowerCase();

  if (normalized.includes('registrando documentos')) {
    return {
      faseAtual: 'Inventariando documentos do workspace',
      agenteAtual: 'Registry / Workspace',
      etapasEmAndamento: ['briefing'],
    };
  }

  if (normalized.includes('reader')) {
    return {
      faseAtual: 'Executando leitura macro do projeto',
      agenteAtual: 'Agente Reader',
      etapasEmAndamento: ['macro'],
      etapasConcluidas: ['briefing'],
    };
  }

  if (normalized.includes('planner')) {
    return {
      faseAtual: 'Montando roteiro técnico multidisciplinar',
      agenteAtual: 'Agente Planner',
      etapasEmAndamento: ['planner'],
      etapasConcluidas: ['briefing', 'macro'],
    };
  }

  if (normalized.includes('quantitativos')) {
    return {
      faseAtual: 'Consolidando quantitativos candidatos',
      agenteAtual: 'Especialista Quantitativos',
      etapasEmAndamento: ['quantitativos', 'custos'],
      etapasConcluidas: ['briefing', 'macro', 'planner'],
    };
  }

  return {
    faseAtual: 'Processando análise técnica',
    agenteAtual: 'Motor multiagente',
    etapasEmAndamento: ['macro'],
  };
}

function extrairEtapasDoRoteiro(roteiro?: HitlPendente['roteiro']): string[] {
  if (!roteiro?.length) return [];

  const etapas = new Set<string>();

  for (const item of roteiro) {
    const normalized = item.etapa.toLowerCase();
    if (normalized.includes('geot')) etapas.add('geotecnia');
    if (normalized.includes('funda')) etapas.add('fundacao');
    if (normalized.includes('estrut')) etapas.add('estrutura');
    if (normalized.includes('hidrául') || normalized.includes('hidraul') || normalized.includes('elétr') || normalized.includes('eletr') || normalized.includes('instala')) etapas.add('instalacoes');
    if (normalized.includes('arquitet') || normalized.includes('alven') || normalized.includes('revest')) etapas.add('civil');
    if (normalized.includes('quantit')) etapas.add('quantitativos');
    if (normalized.includes('composição') || normalized.includes('composicao') || normalized.includes('custo')) etapas.add('custos');
  }

  return Array.from(etapas);
}

// ─── Componente HITL Card ──────────────────────────────────────────────────────
function HitlCard({
  hitlData,
  onAprovar,
  onRejeitar,
}: {
  hitlData: HitlPendente;
  onAprovar: () => void;
  onRejeitar: (motivo: string) => void;
}) {
  const [rejeitando, setRejeitando] = useState(false);
  const [motivo, setMotivo] = useState('');

  return (
    <div className="oc-hitl-card">
      <div className="oc-hitl-header">
        <AlertTriangle size={16} className="oc-hitl-icon" />
        <span>Validação Humana Obrigatória (HITL)</span>
        <span className="oc-hitl-score">Score: {hitlData.scoreConsistencia}%</span>
      </div>

      <p className="oc-hitl-desc">
        O Planner elaborou o roteiro abaixo com base nos documentos lidos.
        Revise e <strong>Aprove</strong> para continuar ou <strong>Rejeite</strong> com comentário.
      </p>

      <div className="oc-hitl-roteiro">
        {hitlData.roteiro.map(etapa => (
          <div key={etapa.id} className="oc-hitl-etapa">
            <span className="oc-hitl-etapa-id">{etapa.id}</span>
            <div>
              <div className="oc-hitl-etapa-nome">{etapa.etapa}</div>
              <div className="oc-hitl-etapa-agente">Agente: {etapa.agente_responsavel}</div>
            </div>
            {etapa.hitl_obrigatorio && <span className="oc-hitl-tag">HITL</span>}
          </div>
        ))}
      </div>

      {rejeitando ? (
        <div className="oc-hitl-rejeitar">
          <textarea
            className="oc-hitl-textarea"
            placeholder="Descreva o problema ou ajuste necessário..."
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            rows={3}
          />
          <div className="oc-hitl-actions">
            <button className="oc-hitl-btn cancel" onClick={() => setRejeitando(false)}>Cancelar</button>
            <button
              className="oc-hitl-btn reject"
              onClick={() => { if (motivo.trim()) onRejeitar(motivo); }}
              disabled={!motivo.trim()}
            >
              <XCircle size={14} /> Confirmar Rejeição
            </button>
          </div>
        </div>
      ) : (
        <div className="oc-hitl-actions">
          <button className="oc-hitl-btn reject" onClick={() => setRejeitando(true)}>
            <XCircle size={14} /> Rejeitar
          </button>
          <button className="oc-hitl-btn approve" onClick={onAprovar}>
            <CheckCircle2 size={14} /> Aprovar e Continuar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function OrcamentistaChat() {
  const queryContext = getOrcamentistaQueryContext();
  const opportunityId = queryContext.opportunityId;
  const linkedWorkspaceId = queryContext.workspaceId;
  const isOpportunityLinked = Boolean(opportunityId && linkedWorkspaceId);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [workspaceId, setWorkspaceId] = useState(
    () => linkedWorkspaceId || sessionStorage.getItem('orcamentista_workspace') || ''
  );
  const [sessionId] = useState(() => {
    const existing = sessionStorage.getItem('orcamentista_session_id');
    if (existing) return existing;
    const created = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem('orcamentista_session_id', created);
    return created;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [multiagenteStatus, setMultiagenteStatus] = useState({
    ativo: false,
    scoreConsistencia: 0,
    ...RUNTIME_INICIAL,
    hitlPendente: false,
  });
  const [etapas, setEtapas] = useState<Etapa[]>(() => criarEtapasIniciais(Boolean(sessionStorage.getItem('orcamentista_workspace'))));
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isUploadingAttachments, setIsUploadingAttachments] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [anexosPendentes, setAnexosPendentes] = useState<Anexo[]>([]);
  const [hitlPendente, setHitlPendente] = useState<HitlPendente | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: workspaces = [] } = useQuery({
    queryKey: ['orcamentista', 'workspaces'],
    queryFn: async () => {
      const resp = await fetch('/api/orcamentista/workspaces');
      const d = await resp.json();
      return d.data ?? [];
    }
  });
  const hasLinkedWorkspaceOption = Boolean(
    linkedWorkspaceId && workspaces.some((w: any) => w.id === linkedWorkspaceId)
  );

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [mensagens, streamingContent]);
  useEffect(() => {
    if (!linkedWorkspaceId) return;
    setWorkspaceId(linkedWorkspaceId);
    sessionStorage.setItem('orcamentista_workspace', linkedWorkspaceId);
  }, [linkedWorkspaceId]);

  useEffect(() => {
    setEtapas(criarEtapasIniciais(Boolean(workspaceId)));
    setEtapaAtual(0);
    setMultiagenteStatus((prev) => ({
      ...prev,
      faseAtual: workspaceId ? 'Workspace selecionado; pronto para briefing' : 'Aguardando briefing inicial',
      origemExecucao: isOpportunityLinked
        ? `Oportunidade vinculada (${opportunityId})`
        : workspaceId
          ? 'Workspace local selecionado'
          : 'Selecione um workspace para começar',
    }));
  }, [isOpportunityLinked, opportunityId, workspaceId]);

  const addLog = (mensagem: string, status: AuditLog['status'] = 'info') => {
    setAuditLogs(p => [...p, {
      id: Math.random().toString(36),
      timestamp: new Date(),
      status,
      mensagem
    }]);
  };

  const uploadFilesToWorkspace = async (files: File[]) => {
    if (!workspaceId || files.length === 0) return;

    setIsUploadingAttachments(true);
    addLog(`📂 Sincronizando ${files.length} arquivo(s) com o workspace...`, 'info');

    try {
      const uploaded: Anexo[] = [];

      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const resp = await fetch(`/api/orcamentista/workspaces/${workspaceId}/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-file-name': encodeURIComponent(file.name),
            'x-file-type': file.type || 'application/octet-stream',
            'x-file-category': 'projeto',
          },
          body: arrayBuffer,
        });

        const payload = await resp.json();
        if (!resp.ok || !payload?.success) {
          throw new Error(payload?.erro || `Falha ao enviar ${file.name}`);
        }

        uploaded.push({
          id: Math.random().toString(36),
          nome: payload.data?.nome || file.name,
          mimeType: payload.data?.mimeType || file.type || 'application/octet-stream',
          origem: 'workspace',
          relativePath: payload.data?.relativePath,
        });
      }

      setAnexosPendentes((prev) => [...prev, ...uploaded]);
      addLog(`✅ ${uploaded.length} arquivo(s) salvos no workspace. A análise agora roda direto da pasta local.`, 'success');
    } catch (error) {
      console.error('[Chat] Erro ao sincronizar anexos:', error);
      addLog(`❌ Falha ao sincronizar anexos: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setIsUploadingAttachments(false);
    }
  };

  const enviar = async (mensagemExplicita?: string, ignorarBloqueioHitl = false) => {
    // HITL bloqueia envio enquanto pendente
    if (hitlPendente && !ignorarBloqueioHitl) return;
    const conteudoMensagem = mensagemExplicita ?? input;
    if (!conteudoMensagem.trim() && anexosPendentes.length === 0) return;
    if (isStreaming) return;

    const msg: Mensagem = {
      id: Math.random().toString(36),
      role: 'user',
      conteudo: conteudoMensagem || 'Análise dos arquivos enviados.',
      timestamp: new Date(),
      anexos: anexosPendentes.map(a => ({ nome: a.nome, mimeType: a.mimeType }))
    };
    setMensagens(p => [...p, msg]);
    const anexos = [...anexosPendentes];
    setAnexosPendentes([]);
    setInput('');
    setIsStreaming(true);
    const usarWorkspaceAttachments = Boolean(workspaceId) && (
      anexos.length === 0 || anexos.every((anexo) => anexo.origem === 'workspace')
    );
    const temContextoDocumental = anexos.length > 0 || usarWorkspaceAttachments;
    setMultiagenteStatus((prev) => ({
      ...prev,
      ativo: false,
      faseAtual: anexos.length > 0 ? 'Preparando leitura dos anexos enviados' : 'Preparando interação textual',
      agenteAtual: anexos.length > 0 ? 'Leitura Técnica de Anexos' : 'Motor Orquestrador',
      origemExecucao: usarWorkspaceAttachments ? 'Workspace local sincronizado' : anexos.length > 0 ? 'Anexos enviados na mensagem' : 'Mensagem textual / workspace',
      leituraMultimodal: anexos.some((a) => !/^(text\/|application\/json$)/.test(a.mimeType)),
      consolidadoDisponivel: false,
      hitlPendente: false,
    }));
    setEtapas((prev) => {
      let next = criarEtapasIniciais(Boolean(workspaceId));
      next = atualizarEtapas(next, ['briefing'], 'concluida');
      next = atualizarEtapas(next, ['macro'], (anexos.length > 0 || usarWorkspaceAttachments) ? 'em_andamento' : 'pendente');
      if (anexos.length === 0 && !usarWorkspaceAttachments) {
        next = atualizarEtapas(next, ['macro', 'planner', 'geotecnia', 'fundacao', 'estrutura', 'instalacoes', 'civil', 'quantitativos', 'custos'], 'bloqueada');
      }
      return next;
    });
    setEtapaAtual(anexos.length > 0 || usarWorkspaceAttachments ? 1 : 0);

    try {
      const resp = await fetch('/api/orcamentista/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: msg.conteudo,
          workspaceId,
          sessionId,
          usarWorkspaceAttachments,
          anexos: anexos
            .filter((a) => a.origem === 'inline' && a.base64)
            .map(a => ({ nome: a.nome, mimeType: a.mimeType, base64: a.base64 }))
        })
      });

      if (!resp.ok || !resp.body) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });

        for (const line of chunk.split('\n\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));

            if (ev.type === 'token') {
              fullText += ev.text;
              setStreamingContent(fullText);
            }

            if (ev.type === 'multiagente_progress') {
              const fase = faseParaMensagem(ev.message);
              setMultiagenteStatus((p) => ({
                ...p,
                ativo: true,
                faseAtual: fase.faseAtual,
                agenteAtual: fase.agenteAtual,
                origemExecucao: anexos.length > 0 ? 'Anexos enviados na mensagem' : p.origemExecucao,
                leituraMultimodal: true,
              }));
              setEtapas((prev) => {
                let next = prev;
                if (fase.etapasConcluidas?.length) {
                  next = atualizarEtapas(next, fase.etapasConcluidas, 'concluida');
                }
                return atualizarEtapas(next, fase.etapasEmAndamento, 'em_andamento');
              });
              const indiceAtual = ETAPAS_BASE.findIndex((item) => fase.etapasEmAndamento.includes(item.chave));
              if (indiceAtual >= 0) setEtapaAtual(indiceAtual);
              addLog(ev.message, 'info');
            }

            if (ev.type === 'multiagente_done') {
              setMultiagenteStatus((p) => ({
                ...p,
                ativo: false,
                faseAtual: 'Aguardando devolutiva auditada e HITL',
                agenteAtual: 'Auditoria multiagente',
                consolidadoDisponivel: true,
              }));
              setEtapas((prev) => {
                let next = atualizarEtapas(prev, ['briefing', 'macro', 'planner', 'quantitativos', 'custos', 'preliminar'], 'concluida');
                next = atualizarEtapas(next, ['auditoria'], 'aguardando_hitl');
                return next;
              });
              setEtapaAtual(12);
              addLog(`✅ Análise concluída. Score: ${ev.score ?? 0}%`, 'success');
            }

            if (ev.type === 'multiagente_warning') {
              const persistenceWarning = typeof ev.message === 'string' && ev.message.toLowerCase().includes('workspace');
              setMultiagenteStatus((p) => ({
                ...p,
                ativo: false,
                faseAtual: persistenceWarning ? 'Análise concluída com alerta de persistência' : 'Fallback para chat único',
                agenteAtual: persistenceWarning ? 'Persistência de dados' : 'Motor Orquestrador',
              }));
              if (!persistenceWarning) {
                setEtapas((prev) => atualizarEtapas(prev, ['macro'], 'erro'));
              }
              addLog(ev.message, 'warning');
            }

            if (ev.type === 'error') {
              setMultiagenteStatus((p) => ({
                ...p,
                ativo: false,
                faseAtual: 'Erro na execução',
                agenteAtual: 'Runtime',
              }));
              setEtapas((prev) => atualizarEtapas(prev, ['macro'], 'erro'));
              addLog(ev.message, 'error');
            }

            if (ev.type === 'done') {
              const assistantMsg: Mensagem = {
                id: Math.random().toString(36),
                role: 'assistant',
                conteudo: fullText,
                timestamp: new Date()
              };
              setMensagens(p => [...p, assistantMsg]);
              setStreamingContent('');

              const score = ev.multiagente?.scoreConsistencia ?? 0;
              const planner = ev.multiagente?.planner;
              const etapasDoRoteiro = extrairEtapasDoRoteiro(planner?.roteiro);
              setMultiagenteStatus((p) => ({
                ...p,
                ativo: false,
                scoreConsistencia: score,
                faseAtual: planner?.roteiro?.length ? 'Roteiro pronto para validação humana' : 'Resposta consolidada entregue',
                agenteAtual: planner?.roteiro?.length ? 'Auditor / HITL' : 'Motor Orquestrador',
                hitlPendente: Boolean(temContextoDocumental && planner?.roteiro),
                consolidadoDisponivel: Boolean(ev.multiagente?.ativo),
              }));

              // HITL: Se há roteiro e há anexos, exibir card de aprovação
              if (temContextoDocumental && planner?.roteiro) {
                const hitlData: HitlPendente = {
                  roteiro: planner.roteiro,
                  scoreConsistencia: score
                };
                setEtapas((prev) => {
                  let next = prev;
                  if (etapasDoRoteiro.length) {
                    next = atualizarEtapas(next, etapasDoRoteiro, 'concluida', true);
                    const restantes = ['geotecnia', 'fundacao', 'estrutura', 'instalacoes', 'civil']
                      .filter((item) => !etapasDoRoteiro.includes(item));
                    next = marcarNaoAplicaveis(next, restantes);
                  }
                  return atualizarEtapas(next, ['auditoria'], 'aguardando_hitl');
                });
                setHitlPendente(hitlData);
                setMensagens(p => [...p, {
                  id: Math.random().toString(36),
                  role: 'hitl',
                  conteudo: '',
                  timestamp: new Date(),
                  hitlData
                }]);
                addLog('⏸️ HITL: Aguardando aprovação do roteiro pelo engenheiro.', 'warning');
              } else if (ev.multiagente?.ativo) {
                setEtapas((prev) => atualizarEtapas(prev, ['preliminar'], 'concluida', true));
                setEtapaAtual(13);
              }
            }
          } catch { /* linha malformada, ignorar */ }
        }
      }
    } catch (e) {
      console.error('[Chat] Erro no stream:', e);
      setMultiagenteStatus((prev) => ({
        ...prev,
        ativo: false,
        faseAtual: 'Erro na comunicação com o servidor',
        agenteAtual: 'Frontend / API',
      }));
      setEtapas((prev) => atualizarEtapas(prev, ['macro'], 'erro'));
      addLog('❌ Erro na comunicação com o servidor.', 'error');
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  const handleAprovar = () => {
    addLog('✅ HITL: Roteiro aprovado pelo engenheiro. Sistema avançando.', 'success');
    setHitlPendente(null);
    setEtapas((prev) => {
      let next = atualizarEtapas(prev, ['auditoria'], 'concluida', true);
      next = atualizarEtapas(next, ['preliminar'], 'em_andamento');
      return next;
    });
    setEtapaAtual(13);
    setMultiagenteStatus((prev) => ({
      ...prev,
      hitlPendente: false,
      faseAtual: 'HITL aprovado; pronto para avançar na consolidação',
      agenteAtual: 'Motor Orquestrador',
    }));
    void enviar('HITL_APROVADO', true);
  };

  const handleRejeitar = (motivo: string) => {
    addLog(`⚠️ HITL: Roteiro rejeitado. Motivo: ${motivo}`, 'warning');
    setHitlPendente(null);
    setEtapas((prev) => atualizarEtapas(prev, ['auditoria'], 'erro'));
    setMultiagenteStatus((prev) => ({
      ...prev,
      hitlPendente: false,
      faseAtual: 'Roteiro rejeitado; aguardando revisão',
      agenteAtual: 'Engenheiro / HITL',
    }));
    setInput(`Por favor, revise o roteiro. Motivo: ${motivo}`);
  };

  const chatInputBloqueado = !workspaceId || isStreaming || isUploadingAttachments || !!hitlPendente;

  return (
    <div className="oc-root">
      <header className="oc-header">
        <button className="oc-btn-voltar" onClick={() => window.location.href = '/dashboard'}>
          <ArrowLeft size={16} /><span>HUB</span>
        </button>
        <div className="oc-header-center">
          <FileText size={16} className="oc-header-icon" />
          <div>
            <h1 className="oc-header-title">Orçamentista IA</h1>
            <p className="oc-header-sub">
              {isOpportunityLinked
                ? "Motor técnico-comercial vinculado à oportunidade"
                : "Motor técnico-comercial para leitura de projetos, quantitativos e custos"}
            </p>
          </div>
        </div>
        <div className="oc-header-actions">
          <select
            className="oc-workspace-select"
            value={workspaceId}
            onChange={e => {
              setWorkspaceId(e.target.value);
              sessionStorage.setItem('orcamentista_workspace', e.target.value);
            }}
          >
            <option value="">
              {isOpportunityLinked ? 'Workspace da oportunidade...' : 'Selecione a Obra...'}
            </option>
            {linkedWorkspaceId && !hasLinkedWorkspaceOption && (
              <option value={linkedWorkspaceId}>
                Oportunidade {opportunityId} · {linkedWorkspaceId}
              </option>
            )}
            {workspaces.map((w: any) => (
              <option key={w.id} value={w.id}>{w.nome}</option>
            ))}
          </select>
          <div className="oc-header-actions-group">
            <button className="oc-btn-gerar-orcamento" disabled title="Disponível após pré-visualização estruturada e validação humana.">
              Gerar orçamento oficial
              <span className="oc-btn-helper">Em breve</span>
            </button>
            <div className="oc-status-dot">
              <div className={`oc-dot ${hitlPendente ? 'amber' : workspaceId ? 'green' : 'gray'}`} />
              <span>
                {hitlPendente
                  ? 'Aguardando HITL'
                  : isOpportunityLinked && workspaceId
                    ? 'Vinculado'
                    : workspaceId
                      ? 'Conectado'
                      : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="oc-body">
        <SidebarEtapas etapas={etapas} etapaAtual={etapaAtual} />

        <main className="oc-main">
          <div className="oc-messages">
            {mensagens.length === 0 ? (
              <div className="oc-empty-state">
                <Bot size={32} />
                <h2>{isOpportunityLinked ? 'Oportunidade vinculada' : 'Motor Técnico pronto'}</h2>
                <p>
                  {isOpportunityLinked
                    ? 'Alimente o motor com arquivos de projeto para iniciar o orçamento desta oportunidade.'
                    : 'Selecione uma obra e alimente o motor com os arquivos de projeto.'}
                </p>

                <div className="oc-fluxo-info">
                  <h3>Fluxo do Orçamentista</h3>
                  <ul>
                    <li><CheckCircle2 size={12} /> Leitura de projetos</li>
                    <li><CheckCircle2 size={12} /> Roteiro técnico</li>
                    <li><CheckCircle2 size={12} /> Quantitativos</li>
                    <li><CheckCircle2 size={12} /> Custos/SINAPI</li>
                    <li><CheckCircle2 size={12} /> HITL</li>
                    <li><CheckCircle2 size={12} /> Orçamento estruturado</li>
                    <li><CheckCircle2 size={12} /> Base para proposta</li>
                  </ul>
                </div>
              </div>
            ) : mensagens.map(m => {
              if (m.role === 'hitl' && m.hitlData) {
                return (
                  <HitlCard
                    key={m.id}
                    hitlData={m.hitlData}
                    onAprovar={handleAprovar}
                    onRejeitar={handleRejeitar}
                  />
                );
              }
              return (
                <div key={m.id} className={`oc-bolha-wrapper ${m.role}`}>
                  <div className="oc-bolha-avatar">
                    {m.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={`oc-bolha ${m.role}`}>
                    {m.anexos?.map((a, i) => (
                      <div key={i} className="oc-anexo-badge">
                        <FileText size={12} /><span>{a.nome}</span>
                      </div>
                    ))}
                    {m.role === 'assistant'
                      ? <MarkdownRenderer texto={m.conteudo} />
                      : <p>{m.conteudo}</p>}
                  </div>
                </div>
              );
            })}

            {isStreaming && streamingContent && (
              <div className="oc-bolha-wrapper assistant">
                <div className="oc-bolha-avatar"><Bot size={16} /></div>
                <div className="oc-bolha assistant">
                  <MarkdownRenderer texto={streamingContent} />
                </div>
              </div>
            )}

            {hitlPendente === null && isStreaming && (
              <div className="oc-streaming-indicator">
                <Loader2 size={14} className="animate-spin" />
                <span>Motor técnico em execução...</span>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <footer className="oc-footer">
            {hitlPendente && (
              <div className="oc-hitl-bloqueio">
                <AlertTriangle size={14} />
                <span>Input bloqueado — aguardando aprovação do roteiro HITL acima.</span>
              </div>
            )}
            <div className="oc-input-container">
              {anexosPendentes.length > 0 && (
                <div className="oc-input-toolbar">
                  {anexosPendentes.map(a => (
                    <div key={a.id} className="oc-anexo-tag">
                      <FileText size={10} />
                      <span>{a.nome}</span>
                      <button onClick={() => setAnexosPendentes(p => p.filter(x => x.id !== a.id))}>×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="oc-input-wrapper">
                <button
                  className="oc-btn-anexo"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={chatInputBloqueado}
                >
                  <Paperclip size={20} />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.md,.json,.csv,.xlsx,.xls"
                  onChange={async e => {
                    const files = Array.from(e.target.files || []);
                    e.currentTarget.value = '';
                    await uploadFilesToWorkspace(files);
                  }}
                />
                <textarea
                  className="oc-textarea"
                  placeholder={
                    hitlPendente ? 'Aguardando aprovação HITL...' :
                    !workspaceId ? (isOpportunityLinked ? 'Workspace da oportunidade indisponível...' : 'Selecione uma obra primeiro...') :
                    'Alimente o motor com arquivos de projeto ou instruções...'
                  }
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      enviar();
                    }
                  }}
                  rows={1}
                  disabled={chatInputBloqueado}
                />
                <button
                  className={`oc-btn-send ${(input || anexosPendentes.length) && !chatInputBloqueado ? 'active' : ''}`}
                  onClick={() => enviar()}
                  disabled={chatInputBloqueado}
                >
                  {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </footer>
        </main>

        <DashboardDireita logs={auditLogs} status={multiagenteStatus} etapas={etapas} />
      </div>
    </div>
  );
}
