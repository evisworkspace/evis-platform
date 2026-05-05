import { useState } from 'react';
import { ChevronDown, ChevronRight, Bot, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { OrcamentistaPipelineStep, OrcamentistaPipelineStepStatus } from '../../types';
import { agentRegistry } from '../../lib/orcamentista/agentRegistry';

interface Props {
  steps: OrcamentistaPipelineStep[];
}

function stepStatusMeta(status: OrcamentistaPipelineStepStatus): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case 'concluido':
      return {
        label: 'Concluído',
        color: 'text-green-400 border-green-500/30 bg-green-500/10',
        icon: <CheckCircle2 size={12} className="text-green-400" />,
      };
    case 'em_execucao':
      return {
        label: 'Em execução',
        color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
        icon: <Loader2 size={12} className="text-blue-400 animate-spin" />,
      };
    case 'aguardando_hitl':
      return {
        label: 'Aguardando HITL',
        color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
        icon: <AlertCircle size={12} className="text-amber-400" />,
      };
    case 'bloqueado':
      return {
        label: 'Bloqueado',
        color: 'text-red-400 border-red-500/30 bg-red-500/10',
        icon: <AlertCircle size={12} className="text-red-400" />,
      };
    case 'pendente':
    default:
      return {
        label: 'Pendente',
        color: 'text-white/30 border-white/10 bg-white/5',
        icon: <Clock size={12} className="text-white/30" />,
      };
  }
}

function StepRow({ step, index }: { step: OrcamentistaPipelineStep; index: number }) {
  const [open, setOpen] = useState(false);
  const meta = stepStatusMeta(step.status);

  const agents = step.agentes
    .map((aid) => agentRegistry.find((a) => a.id === aid))
    .filter(Boolean);

  return (
    <div className="rounded-lg border border-white/10 bg-white/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 font-mono text-[10px] text-white/40">
          {index + 1}
        </span>

        <div className="flex flex-1 items-center gap-3 min-w-0">
          <span className="truncate text-sm font-semibold text-white/80">{step.nome}</span>
          <span className={`flex shrink-0 items-center gap-1 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${meta.color}`}>
            {meta.icon}
            {meta.label}
          </span>
        </div>

        {step.status === 'em_execucao' && (
          <div className="flex shrink-0 items-center gap-2">
            <div className="h-1.5 w-20 rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-blue-400 transition-all"
                style={{ width: `${step.progresso}%` }}
              />
            </div>
            <span className="font-mono text-[9px] text-blue-400">{step.progresso}%</span>
          </div>
        )}

        {open ? (
          <ChevronDown size={14} className="shrink-0 text-white/30" />
        ) : (
          <ChevronRight size={14} className="shrink-0 text-white/30" />
        )}
      </button>

      {open && (
        <div className="border-t border-white/10 px-4 py-3 space-y-3">
          <p className="text-xs text-white/50">{step.descricao}</p>

          {agents.length > 0 && (
            <div className="space-y-1.5">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                Agentes desta etapa
              </p>
              <div className="flex flex-wrap gap-1.5">
                {agents.map((agent) => agent && (
                  <div
                    key={agent.id}
                    title={agent.descricao}
                    className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-1"
                  >
                    <Bot size={10} className="text-purple-400" />
                    <span className="text-[10px] text-white/60">{agent.nome}</span>
                    {agent.podeBloquearConsolidacao && (
                      <span className="ml-0.5 rounded bg-amber-500/10 px-1 font-mono text-[8px] text-amber-400">
                        HITL
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrcamentistaAiPipelinePanel({ steps }: Props) {
  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bot size={14} className="text-purple-400" />
            <span className="text-sm font-bold text-purple-300">Pipeline IA — Etapas</span>
          </div>
          <p className="mt-0.5 text-xs text-white/40">
            Estrutura de execução do Orçamentista IA. Dados simulados para demonstração.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="rounded border border-purple-500/40 bg-purple-500/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-purple-300">
            MOCK / SIMULAÇÃO
          </span>
          <span className="font-mono text-[8px] text-white/25 uppercase tracking-widest">
            sem IA real · sem banco
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => (
          <StepRow key={step.id} step={step} index={i} />
        ))}
      </div>

      <div className="rounded-lg border border-white/5 bg-white/[0.03] px-4 py-3">
        <p className="text-[10px] text-white/30">
          Este pipeline é uma demonstração visual da estrutura de agentes do Orçamentista IA.
          Nenhuma IA real foi acionada. Nenhum dado foi gravado no orçamento oficial.
          A consolidação ocorrerá apenas após validação humana completa (HITL) em fase futura.
        </p>
      </div>
    </div>
  );
}
