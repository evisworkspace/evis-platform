import React from 'react';
import { Bot, Zap, CheckCircle2, FolderKanban, Image, AlertTriangle, FileSearch } from 'lucide-react';
import type { Etapa } from './SidebarEtapas';

interface AuditLog {
  id: string;
  timestamp: Date;
  status: 'info' | 'success' | 'warning' | 'error';
  mensagem: string;
}

interface MultiagenteStatus {
  ativo: boolean;
  scoreConsistencia?: number;
  faseAtual?: string;
  agenteAtual?: string;
  origemExecucao?: string;
  hitlPendente?: boolean;
  leituraMultimodal?: boolean;
  consolidadoDisponivel?: boolean;
}

export function DashboardDireita({
  logs,
  status,
  etapas,
}: {
  logs: AuditLog[];
  status: MultiagenteStatus;
  etapas: Etapa[];
}) {
  const totais = etapas.reduce(
    (acc, etapa) => {
      acc.total += 1;
      if (etapa.status === 'concluida') acc.concluidas += 1;
      if (etapa.status === 'em_andamento') acc.ativas += 1;
      if (etapa.status === 'erro') acc.erros += 1;
      return acc;
    },
    { total: 0, concluidas: 0, ativas: 0, erros: 0 }
  );
  const progressoVisual = totais.total ? Math.max(8, Math.round((totais.concluidas / totais.total) * 100)) : 0;
  const ultimosEventos = logs.slice(-4).reverse();

  const readerStatus = status.leituraMultimodal
    ? status.ativo && status.agenteAtual?.includes('Reader')
      ? 'Lendo anexos multimodais'
      : 'Leitura multimodal pronta'
    : status.origemExecucao === 'workspace'
      ? 'Aguardando ingestão automática'
      : 'Aguardando anexos multimodais';

  const plannerStatus = status.agenteAtual?.includes('Planner')
    ? 'Montando roteiro técnico'
    : status.hitlPendente
      ? 'Roteiro aguardando aprovação'
      : status.ativo
        ? 'Em espera'
        : 'Aguardando';

  const auditorStatus = status.hitlPendente
    ? 'Checklist HITL pendente'
    : status.consolidadoDisponivel
      ? 'Orçamento preliminar salvo'
      : status.ativo
        ? 'Aguardando consolidação'
        : 'Em espera';

  return (
    <div className="oc-dashboard-right">
      <div className="oc-dash-section">
        <h3 className="oc-dash-section-title">Contexto da execução</h3>
        <div className="oc-runtime-card">
          <div className="oc-runtime-row">
            <span className="oc-runtime-label">Fase atual</span>
            <span className="oc-runtime-value">{status.faseAtual || 'Aguardando nova leitura'}</span>
          </div>
          <div className="oc-runtime-row">
            <span className="oc-runtime-label">Origem</span>
            <span className="oc-runtime-value">{status.origemExecucao || 'Sem contexto ativo'}</span>
          </div>
          <div className="oc-runtime-tags">
            <span className="oc-runtime-tag">
              <FolderKanban size={12} />
              Workspace local
            </span>
            <span className={`oc-runtime-tag ${status.leituraMultimodal ? 'active' : ''}`}>
              <Image size={12} />
              {status.leituraMultimodal ? 'Leitura multimodal' : 'Sem multimodal'}
            </span>
            <span className={`oc-runtime-tag ${status.hitlPendente ? 'warning' : ''}`}>
              <AlertTriangle size={12} />
              {status.hitlPendente ? 'HITL pendente' : 'HITL livre'}
            </span>
            <span className={`oc-runtime-tag ${status.consolidadoDisponivel ? 'success' : ''}`}>
              <FileSearch size={12} />
              {status.consolidadoDisponivel ? 'Pré-orçamento salvo' : 'Consolidação pendente'}
            </span>
          </div>
        </div>
      </div>

      <div className="oc-dash-section">
        <h3 className="oc-dash-section-title">Execução ao vivo</h3>
        <div className="oc-exec-card">
          <div className="oc-exec-hero">
            <div className={`oc-exec-core ${status.ativo ? 'active' : ''}`}>
              <div className="oc-exec-core-ring ring-1" />
              <div className="oc-exec-core-ring ring-2" />
              <div className="oc-exec-core-center">EVIS</div>
            </div>
            <div className="oc-exec-summary">
              <span className="oc-exec-phase">{status.faseAtual || 'Aguardando execução'}</span>
              <span className="oc-exec-agent">{status.agenteAtual || 'Nenhum agente ativo'}</span>
            </div>
          </div>

          <div className="oc-exec-progress">
            <div className="oc-exec-progress-header">
              <span>Pipeline técnico</span>
              <span>{progressoVisual}%</span>
            </div>
            <div className="oc-exec-progress-bar">
              <div className="oc-exec-progress-fill" style={{ width: `${progressoVisual}%` }} />
            </div>
          </div>

          <div className="oc-exec-grid">
            {etapas.slice(0, 6).map((etapa) => (
              <div key={etapa.id} className={`oc-exec-chip ${etapa.status}`}>
                <span className="oc-exec-chip-title">{etapa.titulo}</span>
                <span className="oc-exec-chip-status">{etapa.status.replaceAll('_', ' ')}</span>
              </div>
            ))}
          </div>

          <div className="oc-exec-events">
            <span className="oc-exec-events-title">Últimos eventos</span>
            {ultimosEventos.length === 0 ? (
              <div className="oc-exec-events-empty">Sem eventos recentes.</div>
            ) : (
              ultimosEventos.map((log) => (
                <div key={log.id} className={`oc-exec-event ${log.status}`}>
                  <span className="oc-exec-event-time">{log.timestamp.toLocaleTimeString()}</span>
                  <span className="oc-exec-event-text">{log.mensagem}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="oc-dash-section">
        <h3 className="oc-dash-section-title">Monitor de Agentes</h3>
        <div className="oc-agent-monitor">
          <div className={`oc-agent-pill active`}>
            <div className="oc-agent-avatar"><Bot size={14} /></div>
            <div className="oc-agent-info">
              <span className="oc-agent-name">Cockpit de Extração</span>
              <span className="oc-agent-status">Aguardando ETAPA 0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="oc-dash-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 className="oc-dash-section-title">Raciocínio da IA (Logs)</h3>
        <div className="oc-terminal-wrap">
          <div className="oc-terminal-content">
            {logs.length === 0 ? (
              <div className="oc-logs-empty-mini">Aguardando execução...</div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className={`oc-terminal-line ${log.status}`}>
                  [{log.timestamp.toLocaleTimeString()}] {log.mensagem}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Removido o Score de Auditoria Fake (Honestidade Operacional) */}
    </div>
  );
}
