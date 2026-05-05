import {
  OrcamentistaManualReaderEvaluationSummary,
  OrcamentistaManualReaderIngestionResult,
  OrcamentistaManualReaderIngestionStatus,
  OrcamentistaRawReaderHitlRequest,
  OrcamentistaReaderCriticalDimension,
} from '../../types';

export function isValidJsonString(value: string) {
  if (!value.trim()) return false;

  try {
    const parsed = JSON.parse(value) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
}

export function getManualIngestionStatusLabel(status: OrcamentistaManualReaderIngestionStatus) {
  const labels: Record<OrcamentistaManualReaderIngestionStatus, string> = {
    empty_input: 'Aguardando JSON',
    invalid_json: 'JSON inválido',
    invalid_shape: 'Shape inválido',
    evaluated_dispatch_ready: 'Avaliado: dispatch liberado',
    evaluated_requires_verifier: 'Avaliado: requer Verifier',
    evaluated_requires_hitl: 'Avaliado: requer HITL',
    blocked_by_safety_gate: 'Bloqueado por safety gate',
  };

  return labels[status];
}

export function getManualIngestionBlockingReasons(result: OrcamentistaManualReaderIngestionResult) {
  return [
    ...result.errors,
    ...(result.safety_runner_result?.dispatch_block_reasons ?? []),
    ...result.dimensional_checks
      .filter((check) => check.blocks_consolidation)
      .map((check) => check.message),
    ...(result.blocks_consolidation ? ['Safety gate bloqueia consolidacao.'] : []),
  ];
}

export function summarizeManualReaderEvaluation(
  result: OrcamentistaManualReaderIngestionResult
): OrcamentistaManualReaderEvaluationSummary {
  const normalized = result.normalized_output;
  const blockingReasons = getManualIngestionBlockingReasons(result);

  return {
    status: result.parse_status,
    identified_items_count: normalized?.identified_items.length ?? 0,
    inferred_items_count: normalized?.inferred_items.length ?? 0,
    missing_information_count: normalized?.missing_information.length ?? 0,
    critical_dimensions_count: normalized?.critical_dimensions.length ?? 0,
    dimensional_checks_count: result.dimensional_checks.length,
    hitl_requests_count: normalized?.hitl_requests.length ?? 0,
    risks_count: normalized?.risks.length ?? 0,
    blocking_reasons_count: blockingReasons.length,
    allowed_to_dispatch: result.allowed_to_dispatch,
    requires_verifier: result.requires_verifier,
    requires_hitl: result.requires_hitl,
    blocks_consolidation: result.blocks_consolidation,
  };
}

export function extractManualReaderHitlRequests(
  result: OrcamentistaManualReaderIngestionResult
): Required<OrcamentistaRawReaderHitlRequest>[] {
  return result.normalized_output?.hitl_requests ?? [];
}

export function extractManualReaderCriticalDimensions(
  result: OrcamentistaManualReaderIngestionResult
): OrcamentistaReaderCriticalDimension[] {
  return result.normalized_output?.critical_dimensions ?? [];
}

export function getManualReaderDispatchDecision(result: OrcamentistaManualReaderIngestionResult) {
  const blockingReasons = getManualIngestionBlockingReasons(result);

  return {
    allowed_to_dispatch: result.allowed_to_dispatch,
    requires_verifier: result.requires_verifier,
    requires_hitl: result.requires_hitl,
    blocks_consolidation: result.blocks_consolidation,
    decision: result.allowed_to_dispatch ? 'dispatch_allowed' : 'dispatch_blocked',
    reasons: result.allowed_to_dispatch
      ? ['Leitura manual avaliada sem bloqueios locais para dispatch.']
      : blockingReasons,
  };
}
