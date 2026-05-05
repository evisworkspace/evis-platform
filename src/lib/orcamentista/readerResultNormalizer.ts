import {
  OrcamentistaEvidenceType,
  OrcamentistaNormalizedReaderOutput,
  OrcamentistaRawReaderHitlRequest,
  OrcamentistaRawReaderItem,
  OrcamentistaRawReaderModelOutput,
  OrcamentistaRawReaderRisk,
  OrcamentistaReaderCriticalDimension,
  OrcamentistaReaderEvidenceItem,
  OrcamentistaReaderInferredItem,
  OrcamentistaReaderMissingInfo,
  OrcamentistaReadingSourceQuality,
  OrcamentistaRealReaderSandboxInput,
} from '../../types';

type ShapeValidationResult = {
  is_valid: boolean;
  errors: string[];
  parsed_output?: OrcamentistaRawReaderModelOutput;
};

const VALID_SOURCE_QUALITY: OrcamentistaReadingSourceQuality[] = [
  'vector_pdf_clear',
  'vector_pdf_mixed',
  'raster_pdf_clear',
  'raster_pdf_low_resolution',
  'compressed_image',
  'readable_table',
  'illegible_table',
  'unknown',
];

const VALID_EVIDENCE_TYPES: OrcamentistaEvidenceType[] = [
  'TEXT_EXPLICIT',
  'TABLE_ROW',
  'DRAWING_ANNOTATION',
  'DRAWING_MEASUREMENT',
  'INFERRED_FROM_CONTEXT',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRawOutput(raw: unknown): OrcamentistaRawReaderModelOutput | undefined {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return isRecord(parsed) ? (parsed as OrcamentistaRawReaderModelOutput) : undefined;
    } catch {
      return undefined;
    }
  }

  return isRecord(raw) ? (raw as OrcamentistaRawReaderModelOutput) : undefined;
}

function asArray<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    .map((item) => item.trim());
}

function asNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value.replace(',', '.')))) {
    return Number(value.replace(',', '.'));
  }
  return fallback;
}

function normalizeSeverity(value: unknown): 'low' | 'medium' | 'high' | 'critical' {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'critical') return value;
  return 'medium';
}

function normalizeEvidenceType(value: unknown, fallback: OrcamentistaEvidenceType): OrcamentistaEvidenceType {
  if (typeof value === 'string' && VALID_EVIDENCE_TYPES.includes(value as OrcamentistaEvidenceType)) {
    return value as OrcamentistaEvidenceType;
  }

  if (value === 'VISUAL_MEASUREMENT') return 'DRAWING_MEASUREMENT';
  if (value === 'INFERENCE') return 'INFERRED_FROM_CONTEXT';
  return fallback;
}

function normalizeSourceQuality(
  value: OrcamentistaReadingSourceQuality | undefined,
  fallback: OrcamentistaReadingSourceQuality
): OrcamentistaReadingSourceQuality {
  return value && VALID_SOURCE_QUALITY.includes(value) ? value : fallback;
}

function normalizeTags(tags: string[] | undefined) {
  return Array.isArray(tags) ? tags.filter((tag) => typeof tag === 'string' && tag.trim()) : [];
}

function readStringField(source: unknown, keys: string[]) {
  if (!isRecord(source)) return '';

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return '';
}

function readStringArrayField(source: unknown, keys: string[]) {
  if (!isRecord(source)) return [];

  for (const key of keys) {
    const values = asStringArray(source[key]);
    if (values.length > 0) return values;
  }

  return [];
}

export function coerceReaderConfidenceScores(score: unknown, fallback = 0): number {
  const numeric = asNumber(score, fallback);
  const normalized = numeric > 1 && numeric <= 100 ? numeric / 100 : numeric;
  return Math.min(1, Math.max(0, Number(normalized.toFixed(2))));
}

export function validateReaderOutputShape(raw: unknown): ShapeValidationResult {
  const parsed = parseRawOutput(raw);
  const errors: string[] = [];

  if (!parsed) {
    return {
      is_valid: false,
      errors: ['Reader output nao e objeto JSON valido.'],
    };
  }

  if (!Array.isArray(parsed.identified_items)) errors.push('Campo identified_items ausente ou invalido.');
  if (!Array.isArray(parsed.inferred_items)) errors.push('Campo inferred_items ausente ou invalido.');
  if (!Array.isArray(parsed.missing_information)) errors.push('Campo missing_information ausente ou invalido.');
  if (!Array.isArray(parsed.risks)) errors.push('Campo risks ausente ou invalido.');
  if (!Array.isArray(parsed.hitl_requests)) errors.push('Campo hitl_requests ausente ou invalido.');

  return {
    is_valid: errors.length === 0,
    errors,
    parsed_output: parsed,
  };
}

function normalizeIdentifiedItem(
  item: OrcamentistaRawReaderItem,
  index: number,
  confidenceCap: number
): OrcamentistaReaderEvidenceItem {
  const confidence = Math.min(coerceReaderConfidenceScores(item.confidence_score, 0.5), confidenceCap);
  const sourceReference = asString(item.source_reference, '');
  const itemText = readStringField(item, ['item', 'label', 'description']);
  const category = readStringField(item, ['category']);
  const label = itemText || category || `Item identificado ${index + 1}`;

  return {
    id: asString(item.id, `identified-${index + 1}`),
    label,
    description: itemText || label,
    quantity: item.quantity,
    evidence_type: normalizeEvidenceType(item.evidence_type, 'TEXT_EXPLICIT'),
    evidence_status: 'IDENTIFIED',
    source_reference: sourceReference,
    confidence_score: confidence,
  };
}

function normalizeInferredItem(
  item: OrcamentistaRawReaderItem,
  index: number,
  confidenceCap: number
): OrcamentistaReaderInferredItem {
  const supportingEvidence = readStringArrayField(item, ['evidence_that_supports', 'evidence', 'textual_evidence']);
  const explicitSourceReferences = normalizeTags(item.source_references);
  const singularSourceReference = asString(item.source_reference, '');
  const inferredItemText = readStringField(item, ['item', 'label', 'description']);
  const reasoning = readStringField(item, ['reasoning', 'justification']) || supportingEvidence.join('; ');
  const sourceReferences =
    explicitSourceReferences.length > 0
      ? explicitSourceReferences
      : singularSourceReference
        ? [singularSourceReference]
        : supportingEvidence;

  return {
    id: asString(item.id, `inferred-${index + 1}`),
    element: inferredItemText || `Inferencia ${index + 1}`,
    reasoning: reasoning || asString(item.description, inferredItemText || 'Inferencia sem justificativa suficiente.'),
    source_references: sourceReferences,
    confidence_score: Math.min(coerceReaderConfidenceScores(item.confidence_score, 0.4), confidenceCap, 0.6),
    can_be_treated_as_fact: false,
  };
}

function normalizeMissingInfo(item: OrcamentistaReaderMissingInfo, index: number): OrcamentistaReaderMissingInfo {
  return {
    id: asString(item.id, `missing-${index + 1}`),
    description: asString(item.description, 'Informacao faltante nao descrita.'),
    impact: asString(item.impact, 'Impacto nao informado.'),
    severity: normalizeSeverity(item.severity),
    suggested_action: asString(item.suggested_action, 'Solicitar decisao humana antes de avancar.'),
  };
}

function normalizeRisk(item: OrcamentistaRawReaderRisk, index: number): Required<OrcamentistaRawReaderRisk> {
  const sourceReference = asString(item.source_reference, '');
  const sourceReferenceStatus = sourceReference ? 'specific' : 'global_page_risk';
  const riskDescription = readStringField(item, ['risk', 'description', 'title']);

  return {
    id: asString(item.id, `risk-${index + 1}`),
    description: riskDescription || 'Risco nao descrito.',
    severity: normalizeSeverity(item.severity),
    source_reference: sourceReference,
    source_reference_status: sourceReferenceStatus,
  } as Required<OrcamentistaRawReaderRisk> & {
    source_reference_status: 'specific' | 'global_page_risk';
  };
}

function normalizeHitlRequest(
  item: OrcamentistaRawReaderHitlRequest,
  index: number
): Required<OrcamentistaRawReaderHitlRequest> {
  const sourceReference = asString(item.source_reference, '');
  const requiredDecision = readStringField(item, ['required_decision', 'decision_required']);
  const hasReaderReason = Boolean(asString(item.reason, '') && requiredDecision);
  const sourceReferenceStatus = sourceReference
    ? 'specific'
    : hasReaderReason
      ? 'derived_from_reader_reason'
      : 'missing';

  return {
    id: asString(item.id, `hitl-${index + 1}`),
    question: asString(item.question, requiredDecision || 'Confirmar informacao tecnica antes de avancar.'),
    reason: asString(item.reason, 'Reader sinalizou incerteza ou falta de fonte suficiente.'),
    severity: normalizeSeverity(item.severity),
    source_reference: sourceReference,
    source_reference_status: sourceReferenceStatus,
    required_decision: requiredDecision,
  } as Required<OrcamentistaRawReaderHitlRequest> & {
    source_reference_status: 'specific' | 'derived_from_reader_reason' | 'missing';
    required_decision: string;
  };
}

function normalizeCriticalDimension(
  dimension: Partial<OrcamentistaReaderCriticalDimension>,
  index: number,
  confidenceCap: number
): OrcamentistaReaderCriticalDimension | null {
  const value = asNumber(dimension.value, Number.NaN);
  if (!Number.isFinite(value)) return null;
  const sourceReference = readStringField(dimension, ['source_reference', 'evidence', 'evidence_text', 'textual_evidence']);
  const sourceText = readStringField(dimension, ['source_text', 'evidence_text', 'textual_evidence', 'evidence']);

  return {
    id: asString(dimension.id, `critical-dimension-${index + 1}`),
    dimension_type: dimension.dimension_type ?? 'foundation_dimension',
    label: readStringField(dimension, ['item', 'label']) || `Dimensao critica ${index + 1}`,
    value,
    unit: asString(dimension.unit, 'm'),
    source_text: sourceText,
    source_reference: sourceReference,
    confidence_score: Math.min(coerceReaderConfidenceScores(dimension.confidence_score, 0.5), confidenceCap),
    context_tags: normalizeTags(dimension.context_tags),
    pile_diameter_cm: dimension.pile_diameter_cm,
    pile_quantity: dimension.pile_quantity,
    reported_concrete_volume_m3: dimension.reported_concrete_volume_m3,
    expected_room_area_m2: dimension.expected_room_area_m2,
    source_type: dimension.source_type,
  };
}

export function flagMissingSourceReferences(output: Pick<
  OrcamentistaNormalizedReaderOutput,
  'identified_items' | 'inferred_items' | 'risks' | 'hitl_requests' | 'critical_dimensions'
>): string[] {
  const warnings: string[] = [];
  let globalPageRiskCount = 0;
  let hitlDerivedReasonCount = 0;
  let hitlMissingSourceCount = 0;

  output.identified_items.forEach((item) => {
    if (!item.source_reference) warnings.push(`${item.id}: item identificado sem source_reference.`);
  });

  output.inferred_items.forEach((item) => {
    if (item.source_references.length === 0) warnings.push(`${item.id}: inferencia sem source_references.`);
  });

  output.risks.forEach((item) => {
    const status = (item as { source_reference_status?: string }).source_reference_status;
    if (!item.source_reference && status === 'global_page_risk') {
      globalPageRiskCount += 1;
    } else if (!item.source_reference) {
      warnings.push(`${item.id}: risco sem source_reference.`);
    }
  });

  output.hitl_requests.forEach((item) => {
    const status = (item as { source_reference_status?: string }).source_reference_status;
    if (!item.source_reference && status === 'derived_from_reader_reason') {
      hitlDerivedReasonCount += 1;
    } else if (!item.source_reference) {
      hitlMissingSourceCount += 1;
    }
  });

  output.critical_dimensions.forEach((item) => {
    if (!item.source_reference && !item.source_text) {
      warnings.push(`${item.id}: dimensao critica sem fonte/texto auditavel.`);
    }
  });

  if (globalPageRiskCount > 0) {
    warnings.push(
      `${globalPageRiskCount} riscos sem source_reference especifico; tratados como riscos globais da pagina.`
    );
  }

  if (hitlDerivedReasonCount > 0) {
    warnings.push(
      `${hitlDerivedReasonCount} HITLs sem source_reference especifico; revisar rastreabilidade antes de consolidacao.`
    );
  }

  if (hitlMissingSourceCount > 0) {
    warnings.push(
      `${hitlMissingSourceCount} HITLs sem source_reference especifico e sem decisao requerida suficiente.`
    );
  }

  return warnings;
}

export function extractCriticalDimensionsFromReaderOutput(
  output: OrcamentistaNormalizedReaderOutput
): OrcamentistaReaderCriticalDimension[] {
  return output.critical_dimensions;
}

export function normalizeRawReaderOutput({
  rawOutput,
  input,
  confidenceCap = 1,
}: {
  rawOutput: unknown;
  input: OrcamentistaRealReaderSandboxInput;
  confidenceCap?: number;
}): OrcamentistaNormalizedReaderOutput {
  const validation = validateReaderOutputShape(rawOutput);
  const parsed = validation.parsed_output ?? {};
  const sourceQuality = normalizeSourceQuality(parsed.source_quality, input.source_quality);
  const confidenceScore = Math.min(coerceReaderConfidenceScores(parsed.confidence_score, 0.5), confidenceCap);
  const criticalDimensions = asArray(parsed.critical_dimensions)
    .map((dimension, index) => normalizeCriticalDimension(dimension, index, confidenceCap))
    .filter((dimension): dimension is OrcamentistaReaderCriticalDimension => dimension !== null);

  const normalizedBase = {
    identified_items: asArray(parsed.identified_items).map((item, index) =>
      normalizeIdentifiedItem(item, index, confidenceCap)
    ),
    inferred_items: asArray(parsed.inferred_items).map((item, index) =>
      normalizeInferredItem(item, index, confidenceCap)
    ),
    risks: asArray(parsed.risks).map(normalizeRisk),
    hitl_requests: asArray(parsed.hitl_requests).map(normalizeHitlRequest),
    critical_dimensions: criticalDimensions,
  };

  const sourceReferenceWarnings = flagMissingSourceReferences(normalizedBase);

  return {
    id: `normalized-reader-${input.document_id}-p${input.page_number}`,
    document_id: input.document_id,
    file_name: input.file_name,
    page_number: input.page_number,
    page_summary: asString(parsed.page_summary, 'Leitura sem resumo declarado pelo Reader.'),
    source_quality: sourceQuality,
    confidence_score: confidenceScore,
    identified_items: normalizedBase.identified_items,
    inferred_items: normalizedBase.inferred_items,
    missing_information: asArray(parsed.missing_information).map(normalizeMissingInfo),
    risks: normalizedBase.risks,
    hitl_requests: normalizedBase.hitl_requests,
    critical_dimensions: criticalDimensions,
    source_reference_warnings: sourceReferenceWarnings,
    shape_errors: validation.errors,
    contains_foundation_or_pile:
      parsed.contains_foundation_or_pile === true ||
      criticalDimensions.some((dimension) =>
        dimension.context_tags.some((tag) => ['fundacao', 'fundacao_profunda', 'estaca'].includes(tag))
      ),
    created_at: new Date().toISOString(),
  };
}
