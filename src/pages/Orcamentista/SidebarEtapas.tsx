import React from 'react';
import { Zap, CheckCircle2, Clock, Circle, AlertTriangle, PauseCircle, XCircle } from 'lucide-react';

export interface Etapa {
  id: number;
  chave: string;
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'aguardando_hitl' | 'bloqueada' | 'erro';
}

export function SidebarEtapas({ etapas, etapaAtual }: { etapas: Etapa[]; etapaAtual: number }) {
  return (
    <aside className="oc-sidebar">
      <div className="oc-sidebar-header">
        <Zap size={14} className="oc-sidebar-icon" />
        <span>Progresso Técnico</span>
      </div>
      <div className="oc-etapas">
        {etapas.map((etapa, idx) => {
          const isAtual = idx === etapaAtual;
          const concluida = etapa.status === 'concluida';
          const aguardandoHitl = etapa.status === 'aguardando_hitl';
          const bloqueada = etapa.status === 'bloqueada';
          const erro = etapa.status === 'erro';

          const classNames = [
            'oc-etapa',
            concluida ? 'concluida' : '',
            isAtual ? 'atual' : '',
            aguardandoHitl ? 'aguardando-hitl' : '',
            bloqueada ? 'bloqueada' : '',
            erro ? 'erro' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const statusLabel =
            etapa.status === 'concluida'
              ? 'Concluída'
              : etapa.status === 'em_andamento'
                ? 'Em andamento'
                : etapa.status === 'aguardando_hitl'
                  ? 'Aguardando HITL'
                  : etapa.status === 'bloqueada'
                    ? 'Bloqueada'
                    : etapa.status === 'erro'
                      ? 'Com erro'
                      : 'Pendente';

          return (
            <div key={etapa.id} className={classNames}>
              <div className="oc-etapa-icone">
                {concluida ? (
                  <CheckCircle2 size={16} className="icon-green" />
                ) : erro ? (
                  <XCircle size={16} className="icon-red" />
                ) : aguardandoHitl ? (
                  <AlertTriangle size={16} className="icon-gold" />
                ) : bloqueada ? (
                  <PauseCircle size={16} className="icon-violet" />
                ) : isAtual ? (
                  <Clock size={16} className="icon-amber animate-pulse" />
                ) : (
                  <Circle size={16} className="icon-muted" />
                )}
              </div>
              <div className="oc-etapa-info">
                <div className="oc-etapa-titulo">{etapa.titulo}</div>
                <div className="oc-etapa-desc">{etapa.descricao}</div>
                <div className="oc-etapa-status-label">{statusLabel}</div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
