import { 
  OrcamentistaConsolidatedPreview, 
  OrcamentistaConsolidatedPreviewService,
  OrcamentistaConsolidatedPreviewRisk,
  OrcamentistaConsolidatedPreviewSummary,
  OrcamentistaPreviewConsolidationBlocker
} from '../../types';

export function summarizeConsolidatedPreview(preview: OrcamentistaConsolidatedPreview): OrcamentistaConsolidatedPreviewSummary {
  const total_services = preview.services.length;
  const total_estimated_value = calculatePreviewTotal(preview);
  const total_risks = preview.risks.length;
  const total_hitls = preview.hitls.length;
  const total_blockers = preview.blockers.length;
  
  const avg_conf = preview.services.reduce((acc, curr) => acc + curr.quantity_confidence + curr.cost_confidence, 0);
  const average_confidence = total_services > 0 ? avg_conf / (total_services * 2) : 0;
  
  const traceability_score = calculateTraceabilityScore(preview);

  return {
    total_services,
    total_estimated_value,
    average_confidence,
    traceability_score,
    total_risks,
    total_hitls,
    total_blockers
  };
}

export function groupPreviewServicesByDiscipline(services: OrcamentistaConsolidatedPreviewService[]): Record<string, OrcamentistaConsolidatedPreviewService[]> {
  const grouped: Record<string, OrcamentistaConsolidatedPreviewService[]> = {};
  services.forEach(s => {
    if (!grouped[s.discipline]) grouped[s.discipline] = [];
    grouped[s.discipline].push(s);
  });
  return grouped;
}

export function groupPreviewRisksBySeverity(risks: OrcamentistaConsolidatedPreviewRisk[]): Record<string, OrcamentistaConsolidatedPreviewRisk[]> {
  const grouped: Record<string, OrcamentistaConsolidatedPreviewRisk[]> = {
    baixa: [],
    media: [],
    alta: [],
    critica: []
  };
  risks.forEach(r => {
    if (grouped[r.severity]) grouped[r.severity].push(r);
  });
  return grouped;
}

export function getPreviewBlockingItems(preview: OrcamentistaConsolidatedPreview): OrcamentistaPreviewConsolidationBlocker[] {
  return preview.blockers;
}

export function canConsolidatePreview(preview: OrcamentistaConsolidatedPreview): boolean {
  if (preview.status === 'blocked') return false;
  if (preview.can_consolidate === false) return false;
  if (preview.blockers.length > 0) return false;
  if (preview.risks.some((risk) => risk.blocks_consolidation)) return false;
  if (preview.hitls.length > 0) return false;
  if (preview.services.some((service) => service.blocks_consolidation || service.requires_hitl)) return false;

  return true;
}

export function calculatePreviewTotal(preview: OrcamentistaConsolidatedPreview): number {
  return preview.services.reduce((acc, curr) => acc + curr.estimated_total, 0);
}

export function calculateTraceabilityScore(preview: OrcamentistaConsolidatedPreview): number {
  if (preview.services.length === 0) return 0;
  const traceableServices = preview.services.filter(
    (s) =>
      s.source_agent_ids.length > 0 &&
      s.source_page_refs.length > 0 &&
      s.source_evidence_refs.length > 0
  );
  return traceableServices.length / preview.services.length;
}

export function getConsolidatedPreviewStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'draft': 'Rascunho',
    'blocked': 'Bloqueado',
    'ready_for_validation': 'Aguardando Validação',
    'validated': 'Validado',
    'consolidated': 'Consolidado'
  };
  return labels[status] || status;
}

export function getPreviewServiceConfidenceBand(confidence: number): 'low' | 'medium' | 'high' {
  if (confidence >= 0.85) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}
