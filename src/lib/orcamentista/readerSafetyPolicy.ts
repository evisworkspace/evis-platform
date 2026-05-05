import {
  OrcamentistaReaderSafetyRule,
  OrcamentistaReadingSourceQuality,
  OrcamentistaSafetyGateResult,
} from '../../types';

export type OrcamentistaReadingSourceQualityInput = {
  is_vector_pdf?: boolean;
  is_raster_pdf?: boolean;
  has_selectable_text?: boolean;
  image_resolution_dpi?: number;
  has_compression_artifacts?: boolean;
  table_legible?: boolean;
};

export type OrcamentistaReaderSafetyContext = {
  id?: string;
  applies_to: string[];
  source_quality: OrcamentistaReadingSourceQuality;
  confidence_score?: number;
  agreement_score?: number;
};

const SOURCE_QUALITY_MAX_CONFIDENCE: Record<OrcamentistaReadingSourceQuality, number> = {
  vector_pdf_clear: 0.92,
  vector_pdf_mixed: 0.82,
  raster_pdf_clear: 0.74,
  raster_pdf_low_resolution: 0.55,
  compressed_image: 0.5,
  readable_table: 0.88,
  illegible_table: 0.35,
  unknown: 0.6,
};

export const ORCAMENTISTA_READER_SAFETY_RULES: OrcamentistaReaderSafetyRule[] = [
  {
    id: 'reader-safety-raster-pdf-confidence-cap',
    name: 'PDF rasterizado reduz confianca maxima',
    applies_to: ['pdf_rasterizado'],
    source_quality: ['raster_pdf_clear', 'raster_pdf_low_resolution', 'compressed_image'],
    max_confidence_allowed: 0.74,
    requires_verifier: true,
    requires_hitl: false,
    blocks_consolidation: false,
    reason: 'PDF rasterizado depende de imagem e nao deve receber confianca alta sem verificacao independente.',
  },
  {
    id: 'reader-safety-illegible-table-blocks-quantity',
    name: 'Tabela ilegivel bloqueia quantitativo',
    applies_to: ['tabela', 'quantitativo'],
    source_quality: ['illegible_table', 'compressed_image', 'raster_pdf_low_resolution'],
    max_confidence_allowed: 0.35,
    requires_verifier: true,
    requires_hitl: true,
    blocks_consolidation: true,
    reason: 'Tabela ilegivel nao pode alimentar quantitativo nem payload de orcamento.',
  },
  {
    id: 'reader-safety-critical-dimension-requires-verifier',
    name: 'Cota critica exige Verifier',
    applies_to: ['cota_critica', 'dimensao_critica'],
    source_quality: [
      'vector_pdf_clear',
      'vector_pdf_mixed',
      'raster_pdf_clear',
      'raster_pdf_low_resolution',
      'compressed_image',
      'unknown',
    ],
    max_confidence_allowed: 0.8,
    requires_verifier: true,
    requires_hitl: false,
    blocks_consolidation: false,
    reason: 'Dimensao critica nao pode ser aceita por um motor sozinho.',
  },
  {
    id: 'reader-safety-foundation-hitl',
    name: 'Fundacao exige HITL',
    applies_to: ['fundacao', 'fundacao_profunda', 'fundacao_rasa'],
    source_quality: [
      'vector_pdf_clear',
      'vector_pdf_mixed',
      'raster_pdf_clear',
      'raster_pdf_low_resolution',
      'compressed_image',
      'unknown',
    ],
    max_confidence_allowed: 0.78,
    requires_verifier: true,
    requires_hitl: true,
    blocks_consolidation: true,
    reason: 'Leitura de fundacao impacta estrutura, custo e seguranca; exige decisao humana.',
  },
  {
    id: 'reader-safety-pile-hitl',
    name: 'Estaca exige HITL para profundidade, diametro e quantidade',
    applies_to: ['estaca', 'profundidade_estaca', 'diametro_estaca', 'quantidade_estaca'],
    source_quality: [
      'vector_pdf_clear',
      'vector_pdf_mixed',
      'raster_pdf_clear',
      'raster_pdf_low_resolution',
      'compressed_image',
      'unknown',
    ],
    max_confidence_allowed: 0.76,
    requires_verifier: true,
    requires_hitl: true,
    blocks_consolidation: true,
    reason: 'Profundidade, diametro e quantidade de estaca sao dimensoes criticas.',
  },
  {
    id: 'reader-safety-steel-explicit-source',
    name: 'Aco exige fonte explicita ou quadro de armacao',
    applies_to: ['aco', 'quantitativo_aco', 'aco_sem_quadro_armacao'],
    source_quality: [
      'vector_pdf_clear',
      'vector_pdf_mixed',
      'raster_pdf_clear',
      'raster_pdf_low_resolution',
      'compressed_image',
      'readable_table',
      'unknown',
    ],
    max_confidence_allowed: 0.6,
    requires_verifier: true,
    requires_hitl: true,
    blocks_consolidation: true,
    reason: 'Peso de aco sem quadro de armacao e inferencia, nao item identificado.',
  },
  {
    id: 'reader-safety-concrete-volume-visual-check',
    name: 'Volume de concreto derivado de cota visual exige sanity check',
    applies_to: ['volume_concreto_visual', 'volume_concreto', 'dimensao_visual'],
    source_quality: [
      'vector_pdf_mixed',
      'raster_pdf_clear',
      'raster_pdf_low_resolution',
      'compressed_image',
      'unknown',
    ],
    max_confidence_allowed: 0.65,
    requires_verifier: true,
    requires_hitl: true,
    blocks_consolidation: false,
    reason: 'Volume derivado de leitura visual precisa bater com resumo ou memoria de calculo.',
  },
  {
    id: 'reader-safety-survey-address-mismatch',
    name: 'Sondagem com endereco divergente bloqueia evidencia',
    applies_to: ['sondagem_endereco_divergente', 'sondagem'],
    source_quality: [
      'vector_pdf_clear',
      'vector_pdf_mixed',
      'raster_pdf_clear',
      'raster_pdf_low_resolution',
      'compressed_image',
      'unknown',
    ],
    max_confidence_allowed: 0.2,
    requires_verifier: true,
    requires_hitl: true,
    blocks_consolidation: true,
    reason: 'Sondagem de endereco divergente nao pode sustentar fundacao deste orcamento.',
  },
  {
    id: 'reader-safety-inference-never-fact',
    name: 'Inferencia nunca vira fato',
    applies_to: ['inferencia', 'inferred_item'],
    source_quality: [
      'vector_pdf_clear',
      'vector_pdf_mixed',
      'raster_pdf_clear',
      'raster_pdf_low_resolution',
      'compressed_image',
      'readable_table',
      'illegible_table',
      'unknown',
    ],
    max_confidence_allowed: 0.6,
    requires_verifier: true,
    requires_hitl: true,
    blocks_consolidation: true,
    reason: 'Inferencia deve permanecer marcada como inferencia ate validacao humana.',
  },
];

function intersects(left: string[], right: string[]) {
  return left.some((item) => right.includes(item));
}

export function classifyReadingSourceQuality(
  input: OrcamentistaReadingSourceQualityInput
): OrcamentistaReadingSourceQuality {
  if (input.table_legible === false) return 'illegible_table';
  if (input.table_legible === true) return 'readable_table';
  if (input.has_compression_artifacts) return 'compressed_image';
  if (input.is_raster_pdf && (input.image_resolution_dpi ?? 0) < 180) return 'raster_pdf_low_resolution';
  if (input.is_raster_pdf) return 'raster_pdf_clear';
  if (input.is_vector_pdf && input.has_selectable_text) return 'vector_pdf_clear';
  if (input.is_vector_pdf) return 'vector_pdf_mixed';

  return 'unknown';
}

export function getMaxAllowedConfidenceForSource(sourceQuality: OrcamentistaReadingSourceQuality) {
  return SOURCE_QUALITY_MAX_CONFIDENCE[sourceQuality];
}

export function getSafetyRulesForReadingContext(
  context: OrcamentistaReaderSafetyContext
): OrcamentistaReaderSafetyRule[] {
  return ORCAMENTISTA_READER_SAFETY_RULES.filter(
    (rule) =>
      rule.source_quality.includes(context.source_quality) &&
      intersects(rule.applies_to, context.applies_to)
  );
}

export function applyReaderSafetyRules(
  reading: OrcamentistaReaderSafetyContext
): OrcamentistaSafetyGateResult {
  const rules = getSafetyRulesForReadingContext(reading);
  const sourceMaxConfidence = getMaxAllowedConfidenceForSource(reading.source_quality);
  const maxConfidenceAllowed = rules.reduce(
    (current, rule) => Math.min(current, rule.max_confidence_allowed),
    sourceMaxConfidence
  );
  const messages = rules.map((rule) => rule.reason);

  if (reading.confidence_score !== undefined && reading.confidence_score > maxConfidenceAllowed) {
    messages.push(
      `Confianca declarada ${reading.confidence_score.toFixed(2)} excede maximo permitido ${maxConfidenceAllowed.toFixed(2)} para a fonte.`
    );
  }

  if (reading.agreement_score !== undefined && reading.agreement_score < 0.9) {
    messages.push('Agreement score abaixo de 0.90 exige revisao antes de consolidar.');
  }

  return {
    id: `reader-safety-result-${reading.id ?? 'mock'}`,
    source_quality: reading.source_quality,
    applied_rule_ids: rules.map((rule) => rule.id),
    max_confidence_allowed: maxConfidenceAllowed,
    requires_verifier:
      rules.some((rule) => rule.requires_verifier) ||
      (reading.agreement_score !== undefined && reading.agreement_score < 0.9),
    requires_hitl: rules.some((rule) => rule.requires_hitl),
    blocks_consolidation: rules.some((rule) => rule.blocks_consolidation),
    messages,
  };
}

export function shouldForceHitlForReading(reading: OrcamentistaReaderSafetyContext) {
  return applyReaderSafetyRules(reading).requires_hitl;
}

export function shouldBlockReadingConsolidation(reading: OrcamentistaReaderSafetyContext) {
  return applyReaderSafetyRules(reading).blocks_consolidation;
}
