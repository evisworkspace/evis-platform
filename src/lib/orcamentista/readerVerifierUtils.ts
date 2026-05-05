import {
  OrcamentistaReaderVerifierSummary,
  OrcamentistaVerifierDisagreement,
  OrcamentistaVerifierRun,
} from '../../types';

export type ReaderVerifierBand = 'LOW' | 'MEDIUM' | 'HIGH';

export type ReaderVerifierRunSummary = {
  totalPages: number;
  verifiedPages: number;
  dispatchReadyPages: number;
  hitlPages: number;
  blockedPages: number;
  averageConfidenceScore: number;
  averageAgreementScore: number;
};

export function getAgreementBand(score: number): ReaderVerifierBand {
  if (score < 0.7) return 'LOW';
  if (score < 0.9) return 'MEDIUM';
  return 'HIGH';
}

export function getReaderConfidenceBand(score: number): ReaderVerifierBand {
  if (score < 0.7) return 'LOW';
  if (score < 0.85) return 'MEDIUM';
  return 'HIGH';
}

export function shouldDispatchToAgents(summary: OrcamentistaReaderVerifierSummary) {
  return (
    summary.dispatch_decision.allowed_to_dispatch &&
    !summary.reader_run.requires_hitl &&
    !summary.reader_run.blocks_consolidation &&
    !summary.verifier_run.requires_hitl &&
    !summary.verifier_run.blocks_consolidation &&
    summary.dispatch_decision.target_agents.length > 0
  );
}

export function shouldRequireReaderHitl(summary: OrcamentistaReaderVerifierSummary) {
  const hasRelevantDisagreement = summary.verifier_run.disagreement_points.some(
    (point) => point.severity === 'high' || point.severity === 'critical' || point.requires_hitl
  );

  return (
    summary.reader_run.requires_hitl ||
    summary.verifier_run.requires_hitl ||
    hasRelevantDisagreement ||
    getReaderConfidenceBand(summary.reader_run.confidence_score) === 'LOW' ||
    getAgreementBand(summary.verifier_run.agreement_score) === 'LOW'
  );
}

export function shouldBlockReaderConsolidation(summary: OrcamentistaReaderVerifierSummary) {
  const hasCriticalDisagreement = summary.verifier_run.disagreement_points.some(
    (point) => point.severity === 'critical' || point.blocks_consolidation
  );

  return (
    summary.reader_run.blocks_consolidation ||
    summary.verifier_run.blocks_consolidation ||
    summary.dispatch_decision.dispatch_status === 'blocked' ||
    hasCriticalDisagreement
  );
}

export function getVerifierStatusLabel(status: OrcamentistaVerifierRun['verification_status']) {
  switch (status) {
    case 'APPROVED':
      return 'Aprovado';
    case 'APPROVED_WITH_WARNINGS':
      return 'Aprovado com avisos';
    case 'HITL_REQUIRED':
      return 'HITL obrigatório';
    case 'REANALYSIS_REQUIRED':
      return 'Reanálise obrigatória';
    case 'BLOCKED':
      return 'Bloqueado';
    default:
      return status;
  }
}

export function groupDisagreementsBySeverity(disagreements: OrcamentistaVerifierDisagreement[]) {
  return disagreements.reduce<Record<OrcamentistaVerifierDisagreement['severity'], OrcamentistaVerifierDisagreement[]>>(
    (acc, disagreement) => {
      acc[disagreement.severity].push(disagreement);
      return acc;
    },
    {
      low: [],
      medium: [],
      high: [],
      critical: [],
    }
  );
}

export function summarizeReaderVerifierRuns(
  runs: OrcamentistaReaderVerifierSummary[]
): ReaderVerifierRunSummary {
  const totalConfidence = runs.reduce((acc, run) => acc + run.reader_run.confidence_score, 0);
  const totalAgreement = runs.reduce((acc, run) => acc + run.verifier_run.agreement_score, 0);

  return {
    totalPages: runs.length,
    verifiedPages: runs.filter((run) => run.verifier_run.verification_status !== 'REANALYSIS_REQUIRED').length,
    dispatchReadyPages: runs.filter(shouldDispatchToAgents).length,
    hitlPages: runs.filter(shouldRequireReaderHitl).length,
    blockedPages: runs.filter(shouldBlockReaderConsolidation).length,
    averageConfidenceScore: runs.length ? Number((totalConfidence / runs.length).toFixed(2)) : 0,
    averageAgreementScore: runs.length ? Number((totalAgreement / runs.length).toFixed(2)) : 0,
  };
}
