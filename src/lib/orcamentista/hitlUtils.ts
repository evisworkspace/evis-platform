import {
  OrcamentistaHitlDecision,
  OrcamentistaHitlDecisionType,
  OrcamentistaHitlIssue,
  OrcamentistaHitlIssueSeverity,
  OrcamentistaHitlIssueStatus,
  OrcamentistaHitlQueueSummary,
  OrcamentistaHitlResolution,
} from '../../types';

const RESOLVED_STATUSES: OrcamentistaHitlIssueStatus[] = [
  'aprovada_com_ressalva',
  'convertida_em_verba',
  'ignorada_nesta_fase',
];

export function getHitlSeverityLabel(severity: OrcamentistaHitlIssueSeverity) {
  switch (severity) {
    case 'critica':
      return 'Crítica';
    case 'alta':
      return 'Alta';
    case 'media':
      return 'Média';
    default:
      return 'Baixa';
  }
}

export function getHitlStatusLabel(status: OrcamentistaHitlIssueStatus) {
  switch (status) {
    case 'pendente':
      return 'Pendente';
    case 'em_revisao':
      return 'Em revisão';
    case 'aprovada_com_ressalva':
      return 'Aprovada com ressalva';
    case 'bloqueada':
      return 'Bloqueada';
    case 'documento_solicitado':
      return 'Documento solicitado';
    case 'convertida_em_verba':
      return 'Marcada como verba';
    case 'ignorada_nesta_fase':
      return 'Ignorada nesta fase';
    case 'reanalisar_futuramente':
      return 'Reanalisar futuramente';
    default:
      return status;
  }
}

export function groupHitlIssuesBySeverity(issues: OrcamentistaHitlIssue[]) {
  return issues.reduce<Record<OrcamentistaHitlIssueSeverity, OrcamentistaHitlIssue[]>>(
    (acc, issue) => {
      acc[issue.severity].push(issue);
      return acc;
    },
    {
      baixa: [],
      media: [],
      alta: [],
      critica: [],
    }
  );
}

export function getBlockingIssues(issues: OrcamentistaHitlIssue[]) {
  return issues.filter((issue) => issue.blocks_consolidation || issue.blocks_dispatch);
}

export function canDispatchAfterHitl(issues: OrcamentistaHitlIssue[]) {
  return issues.every((issue) => !issue.blocks_dispatch || RESOLVED_STATUSES.includes(issue.status));
}

export function canConsolidateAfterHitl(issues: OrcamentistaHitlIssue[]) {
  return issues.every((issue) => !issue.blocks_consolidation || RESOLVED_STATUSES.includes(issue.status));
}

export function summarizeHitlQueue(issues: OrcamentistaHitlIssue[]): OrcamentistaHitlQueueSummary {
  return {
    total_issues: issues.length,
    pending_issues: issues.filter((issue) => issue.status === 'pendente' || issue.status === 'em_revisao').length,
    critical_issues: issues.filter((issue) => issue.severity === 'critica').length,
    high_issues: issues.filter((issue) => issue.severity === 'alta').length,
    blocking_dispatch: issues.filter((issue) => issue.blocks_dispatch && !RESOLVED_STATUSES.includes(issue.status)).length,
    blocking_consolidation: issues.filter(
      (issue) => issue.blocks_consolidation && !RESOLVED_STATUSES.includes(issue.status)
    ).length,
    resolved_issues: issues.filter((issue) => RESOLVED_STATUSES.includes(issue.status)).length,
  };
}

function statusForDecision(decisionType: OrcamentistaHitlDecisionType): OrcamentistaHitlIssueStatus {
  switch (decisionType) {
    case 'aprovar_com_ressalva':
      return 'aprovada_com_ressalva';
    case 'manter_bloqueado':
      return 'bloqueada';
    case 'solicitar_documento':
      return 'documento_solicitado';
    case 'marcar_como_verba':
      return 'convertida_em_verba';
    case 'ignorar_nesta_fase':
      return 'ignorada_nesta_fase';
    case 'reanalisar_futuramente':
      return 'reanalisar_futuramente';
    default:
      return 'em_revisao';
  }
}

function releaseDispatch(decisionType: OrcamentistaHitlDecisionType) {
  return ['aprovar_com_ressalva', 'marcar_como_verba', 'ignorar_nesta_fase'].includes(decisionType);
}

function releaseConsolidation(decisionType: OrcamentistaHitlDecisionType) {
  return ['aprovar_com_ressalva', 'ignorar_nesta_fase'].includes(decisionType);
}

export function applyMockHitlDecision(
  issue: OrcamentistaHitlIssue,
  decisionType: OrcamentistaHitlDecisionType,
  notes = ''
): OrcamentistaHitlResolution {
  const decision: OrcamentistaHitlDecision = {
    issue_id: issue.id,
    decision_type: decisionType,
    decided_by: 'mock_user',
    decided_at: new Date().toISOString(),
    notes,
  };

  const dispatchReleased = releaseDispatch(decisionType);
  const consolidationReleased = releaseConsolidation(decisionType);

  return {
    issue: {
      ...issue,
      status: statusForDecision(decisionType),
      decision_type: decisionType,
      decided_by: decision.decided_by,
      decided_at: decision.decided_at,
      blocks_dispatch: dispatchReleased ? false : issue.blocks_dispatch,
      blocks_consolidation: consolidationReleased ? false : issue.blocks_consolidation,
    },
    decision,
    dispatch_released: dispatchReleased,
    consolidation_released: consolidationReleased,
  };
}
