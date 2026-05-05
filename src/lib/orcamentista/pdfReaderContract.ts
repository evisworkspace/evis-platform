import {
  OrcamentistaPageClassification,
  OrcamentistaPrimaryPageReading,
  OrcamentistaReaderVerificationResult,
} from '../../types';

// ── Thresholds ──────────────────────────────────────────────────────────────

export const PDF_READER_THRESHOLDS = {
  MIN_CLASSIFICATION_CONFIDENCE: 0.85,
  MIN_READING_CONFIDENCE: 0.8,
  MIN_AGREEMENT_SCORE: 0.9,
  CRITICAL_DISAGREEMENT_MAX: 0, // Nenhuma divergência crítica é tolerada
};

// ── Constantes ──────────────────────────────────────────────────────────────

export const DISCIPLINAS_CONHECIDAS = [
  'ARQUITETURA',
  'ESTRUTURA',
  'ELETRICA',
  'HIDRAULICA',
  'CLIMATIZACAO',
  'INCENDIO',
  'LUMINOTECNICA',
  'PAISAGISMO',
];

// ── Funções Puras de Contrato (Sem IA real) ─────────────────────────────────

/**
 * Retorna uma banda de confiança qualitativa baseada no score (0.0 a 1.0).
 */
export function getConfidenceBand(score: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (score < 0.7) return 'LOW';
  if (score < 0.9) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Avalia se uma página recém-classificada precisa de verificação humana (HITL)
 * antes mesmo da extração (ex: baixa confiança ou tipo desconhecido).
 */
export function shouldRequireClassificationHitl(classification: OrcamentistaPageClassification): boolean {
  if (classification.page_type === 'DESCONHECIDO') return true;
  if (classification.confidence < PDF_READER_THRESHOLDS.MIN_CLASSIFICATION_CONFIDENCE) return true;
  return false;
}

/**
 * Determina se a leitura primária tem problemas graves o suficiente
 * para exigir bloqueio imediato antes mesmo de passar pro Verifier.
 */
export function shouldBlockConsolidationBeforeVerification(reading: OrcamentistaPrimaryPageReading): boolean {
  // Exemplo: se faltam informações críticas e a IA não conseguiu inferir
  if (reading.missing_information.length > 5) return true;
  if (reading.reading_confidence < PDF_READER_THRESHOLDS.MIN_READING_CONFIDENCE) return true;
  return false;
}

/**
 * Avalia o resultado da verificação cruzada (Verifier) para decidir
 * se a divergência bloqueia a consolidação e exige HITL.
 */
export function calculateAgreementStatus(verification: OrcamentistaReaderVerificationResult): {
  approved: boolean;
  requiresHitl: boolean;
  blocksConsolidation: boolean;
} {
  const hasCriticalDisagreements = verification.disagreements.some(d => d.severity === 'critical');
  const hasHighDisagreements = verification.disagreements.some(d => d.severity === 'high');
  
  const requiresHitl = 
    hasCriticalDisagreements || 
    hasHighDisagreements || 
    verification.agreement_score < PDF_READER_THRESHOLDS.MIN_AGREEMENT_SCORE ||
    verification.requires_hitl;

  const blocksConsolidation = 
    hasCriticalDisagreements || 
    verification.blocks_consolidation;

  const approved = !requiresHitl && !blocksConsolidation;

  return {
    approved,
    requiresHitl,
    blocksConsolidation
  };
}
