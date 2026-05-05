import {
  OrcamentistaEstimatedScopeItem,
  OrcamentistaFallbackDecisionType,
  OrcamentistaFallbackSummary,
  OrcamentistaMissingProjectDiscipline,
  OrcamentistaMissingProjectFallback,
  OrcamentistaScopeOriginType,
} from '../../types';

export function groupFallbacksByDiscipline(fallbacks: OrcamentistaMissingProjectFallback[]) {
  return fallbacks.reduce<Record<OrcamentistaMissingProjectDiscipline, OrcamentistaMissingProjectFallback[]>>(
    (acc, fallback) => {
      acc[fallback.discipline] = [...(acc[fallback.discipline] ?? []), fallback];
      return acc;
    },
    {} as Record<OrcamentistaMissingProjectDiscipline, OrcamentistaMissingProjectFallback[]>
  );
}

export function getFallbackBlockingItems(fallbacks: OrcamentistaMissingProjectFallback[]) {
  return fallbacks.filter(
    (fallback) =>
      fallback.blocks_execution ||
      fallback.blocks_final_consolidation ||
      fallback.estimated_items.some((item) => item.blocks_final_consolidation || !item.can_feed_execution)
  );
}

export function getFallbackWarnings(fallbacks: OrcamentistaMissingProjectFallback[]) {
  return fallbacks.flatMap((fallback) => [
    ...fallback.warnings,
    ...fallback.estimated_items.map((item) => ({
      id: `estimated-item-warning-${item.id}`,
      severity: item.requires_hitl ? 'high' as const : 'medium' as const,
      message: item.warning_message,
      blocks_execution: !item.can_feed_execution,
      blocks_final_consolidation: item.blocks_final_consolidation,
    })),
  ]);
}

export function canFeedPreliminaryBudget(itemOrFallback: OrcamentistaEstimatedScopeItem | OrcamentistaMissingProjectFallback) {
  if ('estimated_items' in itemOrFallback) {
    return itemOrFallback.fallback_allowed && itemOrFallback.estimated_items.some(canFeedPreliminaryBudget);
  }

  return itemOrFallback.can_feed_preliminary_budget && !itemOrFallback.can_feed_execution;
}

export function canFeedProposalWithWarnings(
  itemOrFallback: OrcamentistaEstimatedScopeItem | OrcamentistaMissingProjectFallback
) {
  if ('estimated_items' in itemOrFallback) {
    return itemOrFallback.fallback_allowed && itemOrFallback.estimated_items.some(canFeedProposalWithWarnings);
  }

  return itemOrFallback.can_feed_proposal_with_warning && itemOrFallback.warning_message.length > 0;
}

export function canFeedExecution(itemOrFallback: OrcamentistaEstimatedScopeItem | OrcamentistaMissingProjectFallback) {
  if ('estimated_items' in itemOrFallback) {
    return (
      itemOrFallback.project_available &&
      !itemOrFallback.blocks_execution &&
      itemOrFallback.estimated_items.every(canFeedExecution)
    );
  }

  return itemOrFallback.can_feed_execution && !itemOrFallback.blocks_final_consolidation;
}

export function calculateEstimatedFallbackTotal(fallbacks: OrcamentistaMissingProjectFallback[]) {
  return Number(
    fallbacks
      .flatMap((fallback) => fallback.estimated_items)
      .reduce((acc, item) => acc + item.estimated_total, 0)
      .toFixed(2)
  );
}

export function summarizeEstimatedFallbacks(
  fallbacks: OrcamentistaMissingProjectFallback[]
): OrcamentistaFallbackSummary {
  const missing = fallbacks.filter((fallback) => !fallback.project_available);
  const allItems = fallbacks.flatMap((fallback) => fallback.estimated_items);

  return {
    total_disciplines: fallbacks.length,
    projects_available: fallbacks.filter((fallback) => fallback.project_available).length,
    projects_missing: missing.length,
    fallback_allowed_count: missing.filter((fallback) => fallback.fallback_allowed).length,
    blocked_scopes_count: getFallbackBlockingItems(fallbacks).length,
    hitl_required_count: fallbacks.filter(
      (fallback) => fallback.requires_hitl || fallback.estimated_items.some((item) => item.requires_hitl)
    ).length,
    preliminary_estimated_total: calculateEstimatedFallbackTotal(fallbacks),
    can_feed_preliminary_budget_count: allItems.filter(canFeedPreliminaryBudget).length,
    can_feed_proposal_with_warning_count: allItems.filter(canFeedProposalWithWarnings).length,
    can_feed_execution_count: allItems.filter(canFeedExecution).length,
  };
}

export function getScopeOriginLabel(origin: OrcamentistaScopeOriginType) {
  const labels: Record<OrcamentistaScopeOriginType, string> = {
    IDENTIFIED_FROM_PROJECT: 'Identificado em projeto',
    IDENTIFIED_FROM_DISCIPLINE_PROJECT: 'Identificado no projeto da disciplina',
    IDENTIFIED_FROM_ELECTRICAL_PROJECT: 'Identificado no projeto elétrico',
    INDIRECT_EVIDENCE_FROM_OTHER_PROJECTS: 'Evidência indireta de outros projetos',
    INDIRECT_EVIDENCE_FROM_PROJECT_DOCUMENTS: 'Evidência indireta de documentos do projeto',
    ESTIMATED_WITHOUT_PROJECT: 'Estimado sem projeto',
    MANUAL_ASSUMPTION: 'Premissa manual',
    EXCLUDED_FROM_SCOPE: 'Excluído do escopo',
  };

  return labels[origin];
}

export function getFallbackDecisionLabel(decision: OrcamentistaFallbackDecisionType) {
  const labels: Record<OrcamentistaFallbackDecisionType, string> = {
    estimate_by_reference: 'Estimar por referência técnica',
    request_project: 'Solicitar projeto',
    exclude_scope: 'Excluir escopo',
    manual_allowance: 'Inserir verba manual',
    keep_pending: 'Manter pendente',
  };

  return labels[decision];
}
