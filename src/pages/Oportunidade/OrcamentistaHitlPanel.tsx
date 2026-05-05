import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  HelpCircle,
  Lock,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import { OrcamentistaHitlDecisionType, OrcamentistaHitlIssue, OrcamentistaHitlIssueSeverity } from '../../types';
import { mockOrcamentistaHitlIssues } from '../../lib/orcamentista/hitlMock';
import {
  applyMockHitlDecision,
  canConsolidateAfterHitl,
  canDispatchAfterHitl,
  getBlockingIssues,
  getHitlSeverityLabel,
  getHitlStatusLabel,
  groupHitlIssuesBySeverity,
  summarizeHitlQueue,
} from '../../lib/orcamentista/hitlUtils';

const decisionActions: Array<{
  type: OrcamentistaHitlDecisionType;
  label: string;
  note: string;
}> = [
  {
    type: 'aprovar_com_ressalva',
    label: 'Aprovar com ressalva',
    note: 'Decisão mockada: liberado com ressalva e evidência mantida como pré-orçamento.',
  },
  {
    type: 'manter_bloqueado',
    label: 'Manter bloqueado',
    note: 'Decisão mockada: bloqueio mantido até nova evidência técnica.',
  },
  {
    type: 'solicitar_documento',
    label: 'Solicitar documento',
    note: 'Decisão mockada: depende de documento adicional antes de avançar.',
  },
  {
    type: 'marcar_como_verba',
    label: 'Marcar como verba',
    note: 'Decisão mockada: assunto tratado como verba futura, sem item oficial.',
  },
  {
    type: 'ignorar_nesta_fase',
    label: 'Ignorar nesta fase',
    note: 'Decisão mockada: removido do escopo desta fase, sem confirmar como fato.',
  },
  {
    type: 'reanalisar_futuramente',
    label: 'Reanalisar futuramente',
    note: 'Decisão mockada: pendência volta para nova leitura em fase futura.',
  },
];

function severityClass(severity: OrcamentistaHitlIssueSeverity) {
  switch (severity) {
    case 'critica':
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    case 'alta':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-300';
    case 'media':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    default:
      return 'border-blue-500/30 bg-blue-500/10 text-blue-300';
  }
}

function statusClass(issue: OrcamentistaHitlIssue) {
  if (issue.blocks_consolidation || issue.blocks_dispatch) {
    return 'border-red-500/30 bg-red-500/10 text-red-300';
  }

  if (issue.status === 'aprovada_com_ressalva' || issue.status === 'convertida_em_verba') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  }

  if (issue.status === 'documento_solicitado' || issue.status === 'reanalisar_futuramente') {
    return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }

  return 'border-white/10 bg-white/5 text-t3';
}

function sourceLabel(source: OrcamentistaHitlIssue['source_type']) {
  switch (source) {
    case 'reader_verifier':
      return 'Reader/Verifier';
    case 'document_inventory':
      return 'Inventário';
    case 'page_processing':
      return 'Processamento';
    case 'agent_preview':
      return 'Agente/Preview';
    case 'costing':
      return 'Custos';
    case 'discipline_gap':
      return 'Disciplina ausente';
    default:
      return source;
  }
}

function issueTypeLabel(issueType: OrcamentistaHitlIssue['issue_type']) {
  switch (issueType) {
    case 'divergencia_reader_verifier':
      return 'Divergência Reader/Verifier';
    case 'risco_tecnico':
      return 'Risco técnico';
    case 'quantidade_inferida':
      return 'Quantidade inferida';
    case 'disciplina_ausente':
      return 'Disciplina ausente';
    case 'custo_sem_fonte':
      return 'Custo sem fonte';
    case 'documento_pendente':
      return 'Documento pendente';
    case 'ppci_pendente':
      return 'PPCI pendente';
    default:
      return issueType;
  }
}

export default function OrcamentistaHitlPanel() {
  const [issues, setIssues] = useState<OrcamentistaHitlIssue[]>(mockOrcamentistaHitlIssues);
  const [selectedId, setSelectedId] = useState(mockOrcamentistaHitlIssues[0]?.id ?? '');
  const queueSummary = useMemo(() => summarizeHitlQueue(issues), [issues]);
  const groupedBySeverity = useMemo(() => groupHitlIssuesBySeverity(issues), [issues]);
  const blockingIssues = useMemo(() => getBlockingIssues(issues), [issues]);
  const selected = issues.find((issue) => issue.id === selectedId) ?? issues[0];
  const canDispatch = canDispatchAfterHitl(issues);
  const canConsolidate = canConsolidateAfterHitl(issues);

  function applyDecision(issue: OrcamentistaHitlIssue, decisionType: OrcamentistaHitlDecisionType) {
    const action = decisionActions.find((item) => item.type === decisionType);
    const resolution = applyMockHitlDecision(issue, decisionType, action?.note ?? '');

    setIssues((current) =>
      current.map((item) => (item.id === issue.id ? resolution.issue : item))
    );
    setSelectedId(issue.id);
  }

  if (!selected) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-amber-300" />
            <h2 className="text-sm font-bold text-t1">HITL Orçamentista</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-t3">
            Validação humana pré-orçamento para divergências, pendências e bloqueios antes de
            qualquer dispatch futuro para agentes especialistas. Este HITL é separado do Diário de
            Obra e altera apenas estado local mockado.
          </p>
        </div>
        <span className="w-fit rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-200">
          Fase 2F · Mock local
        </span>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">Pendências</p>
          <p className="mt-1 text-lg font-bold text-t1">{queueSummary.total_issues}</p>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-300">Abertas</p>
          <p className="mt-1 text-lg font-bold text-amber-200">{queueSummary.pending_issues}</p>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-red-300">Críticas</p>
          <p className="mt-1 text-lg font-bold text-red-200">{queueSummary.critical_issues}</p>
        </div>
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-orange-300">Altas</p>
          <p className="mt-1 text-lg font-bold text-orange-200">{queueSummary.high_issues}</p>
        </div>
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-purple-300">Bloq. dispatch</p>
          <p className="mt-1 text-lg font-bold text-purple-200">{queueSummary.blocking_dispatch}</p>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-red-300">Bloq. consol.</p>
          <p className="mt-1 text-lg font-bold text-red-200">{queueSummary.blocking_consolidation}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">
              Resumo por severidade
            </p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {(['critica', 'alta', 'media', 'baixa'] as const).map((severity) => (
                <div key={severity} className={`rounded border px-2 py-1 text-center ${severityClass(severity)}`}>
                  <p className="font-mono text-[8px] uppercase tracking-widest">{getHitlSeverityLabel(severity)}</p>
                  <p className="text-sm font-bold">{groupedBySeverity[severity].length}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {issues.map((issue) => (
              <button
                key={issue.id}
                type="button"
                onClick={() => setSelectedId(issue.id)}
                className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                  selected.id === issue.id
                    ? 'border-amber-500/40 bg-amber-500/10'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-t1">{issue.title}</p>
                    <p className="mt-0.5 text-[11px] text-t3">
                      {sourceLabel(issue.source_type)} · {issue.agent_id ?? 'sem agente'}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${severityClass(issue.severity)}`}>
                    {getHitlSeverityLabel(issue.severity)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className={`rounded border px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${statusClass(issue)}`}>
                    {getHitlStatusLabel(issue.status)}
                  </span>
                  {issue.blocks_dispatch && (
                    <span className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-purple-200">
                      bloqueia dispatch
                    </span>
                  )}
                  {issue.blocks_consolidation && (
                    <span className="rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-widest text-red-200">
                      bloqueia consolidação
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        <article className="space-y-4 rounded-lg border border-white/10 bg-s1 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">
                {issueTypeLabel(selected.issue_type)} · {sourceLabel(selected.source_type)}
              </p>
              <h3 className="mt-1 text-base font-bold text-t1">{selected.title}</h3>
              <p className="mt-1 text-xs leading-5 text-t3">{selected.description}</p>
            </div>
            <span className={`w-fit rounded border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest ${statusClass(selected)}`}>
              {getHitlStatusLabel(selected.status)}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">
                Origem
              </p>
              <p className="mt-1 text-xs text-t2">{sourceLabel(selected.source_type)}</p>
              <p className="mt-1 font-mono text-[9px] text-t4">{selected.source_id}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">
                Documento / página
              </p>
              <p className="mt-1 text-xs text-t2">{selected.document_name ?? 'Sem documento direto'}</p>
              <p className="mt-1 font-mono text-[9px] text-t4">
                {selected.page_number ? `Página ${selected.page_number}` : 'Página não vinculada'}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-t4">
                Agente relacionado
              </p>
              <p className="mt-1 text-xs text-t2">{selected.agent_id ?? 'Não definido'}</p>
              <p className="mt-1 font-mono text-[9px] text-t4">Pré-orçamento</p>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-t3">
              <FileWarning className="h-4 w-4 text-amber-300" />
              Evidência e ação recomendada
            </div>
            <p className="mt-2 text-xs leading-5 text-t2">{selected.evidence_summary}</p>
            <p className="mt-2 text-xs leading-5 text-amber-200">{selected.recommended_action}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-200">
                <Lock className="h-4 w-4" />
                Gate de dispatch
              </div>
              <p className="mt-1 text-sm font-bold text-t1">
                {selected.blocks_dispatch ? 'Bloqueado' : 'Liberado localmente'}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-t3">
                Dispatch futuro só pode avançar quando todos os bloqueios locais forem resolvidos.
              </p>
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-red-200">
                <Ban className="h-4 w-4" />
                Gate de consolidação
              </div>
              <p className="mt-1 text-sm font-bold text-t1">
                {selected.blocks_consolidation ? 'Bloqueado' : 'Liberado localmente'}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-t3">
                Mesmo liberado localmente, consolidação no orçamento oficial permanece fase futura.
              </p>
            </div>
          </div>

          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-t3">
              Decisões humanas mockadas
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {decisionActions.map((action) => (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => applyDecision(selected, action.type)}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-xs font-semibold text-t2 transition hover:bg-white/5"
                >
                  {action.label}
                </button>
              ))}
            </div>
            {selected.decision_type && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] leading-5 text-emerald-200">
                Decisão local aplicada: {selected.decision_type} por {selected.decided_by} em{' '}
                {selected.decided_at ? new Date(selected.decided_at).toLocaleString('pt-BR') : '-'}.
              </div>
            )}
          </section>
        </article>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] leading-5 text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Validação pré-orçamento. Nenhuma decisão mockada grava no banco.</span>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] leading-5 text-red-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Divergências críticas permanecem bloqueadas até decisão humana explícita.</span>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-[11px] leading-5 text-blue-200">
          <HelpCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Inferência não vira fato; verba não vira item oficial automaticamente.</span>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-t1">Gate global mockado</p>
            <p className="mt-1 text-xs text-t3">
              Pendências bloqueantes ativas: {blockingIssues.length}. Dispatch futuro:{' '}
              {canDispatch ? 'liberado localmente' : 'bloqueado'}. Consolidação futura:{' '}
              {canConsolidate ? 'sem bloqueio local' : 'bloqueada'}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIssues(mockOrcamentistaHitlIssues);
              setSelectedId(mockOrcamentistaHitlIssues[0]?.id ?? '');
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-t3 transition hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
            Reset mock
          </button>
        </div>
      </div>
    </section>
  );
}
