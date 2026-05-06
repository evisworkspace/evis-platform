import {
  OrcamentistaManualVerifierIngestionResult,
  OrcamentistaManualVerifierIngestionStatus,
  OrcamentistaManualVerifierNormalizedOutput,
  OrcamentistaNormalizedReaderOutput,
  OrcamentistaVerifierDivergence,
  OrcamentistaVerifierDivergenceSeverity,
  OrcamentistaVerifierHitlRequest,
} from '../../types';
import { compareReaderAndVerifierOutputs } from './manualVerifierComparisonUtils';

type ManualVerifierParseResult = {
  parse_status: Extract<OrcamentistaManualVerifierIngestionStatus, 'empty_input' | 'invalid_json'> | 'valid_json';
  parsed_output?: Record<string, unknown>;
  errors: string[];
};

const KNOWN_VERIFIER_FIELDS = [
  'verified_items',
  'confirmed_items',
  'disputed_items',
  'divergence_points',
  'critical_dimensions',
  'risks',
  'hitl_requests',
  'agreement_score',
  'requires_hitl',
  'blocks_consolidation',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = '') {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return fallback;
}

function asBoolean(value: unknown) {
  return value === true;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1 && value <= 100 ? Number((value / 100).toFixed(2)) : Math.min(1, Math.max(0, value));
  }

  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value.replace(',', '.')))) {
    const parsed = Number(value.replace(',', '.'));
    return parsed > 1 && parsed <= 100 ? Number((parsed / 100).toFixed(2)) : Math.min(1, Math.max(0, parsed));
  }

  return undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringifyRecord(value: Record<string, unknown>) {
  return Object.entries(value)
    .map(([key, entry]) => `${key}: ${asString(entry)}`)
    .join(' | ');
}

function normalizeStringArray(value: unknown, labelKeys: string[]) {
  return asArray(value)
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (isRecord(item)) {
        for (const key of labelKeys) {
          const label = asString(item[key]);
          if (label) return label;
        }

        return stringifyRecord(item);
      }

      return '';
    })
    .filter(Boolean);
}

function normalizeSeverity(value: unknown): OrcamentistaVerifierDivergenceSeverity {
  if (value === 'low' || value === 'medium' || value === 'high' || value === 'critical') return value;
  if (value === 'baixa') return 'low';
  if (value === 'media') return 'medium';
  if (value === 'alta') return 'high';
  if (value === 'critica') return 'critical';
  return 'medium';
}

function normalizeCategory(value: unknown): OrcamentistaVerifierDivergence['category'] {
  if (
    value === 'identified_item' ||
    value === 'inferred_item' ||
    value === 'critical_dimension' ||
    value === 'risk' ||
    value === 'hitl' ||
    value === 'missing_information' ||
    value === 'document_traceability' ||
    value === 'other'
  ) {
    return value;
  }

  const text = asString(value).toLowerCase();
  if (text.includes('dimens') || text.includes('cota') || text.includes('fck') || text.includes('estaca')) {
    return 'critical_dimension';
  }
  if (text.includes('risco')) return 'risk';
  if (text.includes('hitl')) return 'hitl';
  if (text.includes('pend')) return 'missing_information';
  if (text.includes('doc') || text.includes('folha') || text.includes('carimbo')) return 'document_traceability';
  return 'other';
}

function normalizeDivergences(value: unknown): OrcamentistaVerifierDivergence[] {
  return asArray(value)
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `verifier-divergence-${index + 1}`,
          category: normalizeCategory(item),
          title: item,
          reader_value: '',
          verifier_value: item,
          reason: item,
          severity: normalizeSeverity(undefined),
          requires_hitl: true,
          blocks_consolidation: false,
        };
      }

      if (!isRecord(item)) return null;

      const title =
        asString(item.title) ||
        asString(item.item) ||
        asString(item.field) ||
        asString(item.description) ||
        `Divergencia ${index + 1}`;

      return {
        id: asString(item.id, `verifier-divergence-${index + 1}`),
        category: normalizeCategory(item.category ?? item.type ?? item.field),
        title,
        reader_value: asString(item.reader_value ?? item.reader),
        verifier_value: asString(item.verifier_value ?? item.verifier ?? item.value ?? item.corrected_value),
        reason: asString(item.reason ?? item.description ?? item.explanation, 'Verifier apontou divergencia.'),
        severity: normalizeSeverity(item.severity),
        requires_hitl: asBoolean(item.requires_hitl) || asBoolean(item.requires_user_input),
        blocks_consolidation: asBoolean(item.blocks_consolidation),
      };
    })
    .filter((item): item is OrcamentistaVerifierDivergence => item !== null);
}

function normalizeHitls(value: unknown): OrcamentistaVerifierHitlRequest[] {
  return asArray(value)
    .map((item, index) => {
      if (typeof item === 'string') {
        return {
          id: `verifier-hitl-${index + 1}`,
          title: `HITL Verifier ${index + 1}`,
          reason: item,
          required_decision: item,
          severity: 'medium' as const,
          source_divergence_ids: [],
        };
      }

      if (!isRecord(item)) return null;

      return {
        id: asString(item.id, `verifier-hitl-${index + 1}`),
        title: asString(item.title ?? item.question, `HITL Verifier ${index + 1}`),
        reason: asString(item.reason ?? item.description, 'Verifier solicitou decisao humana.'),
        required_decision: asString(
          item.required_decision ?? item.decision_required ?? item.question,
          'Revisar divergencia indicada pelo Verifier.'
        ),
        severity: normalizeSeverity(item.severity),
        source_divergence_ids: normalizeStringArray(item.source_divergence_ids, ['id']),
      };
    })
    .filter((item): item is OrcamentistaVerifierHitlRequest => item !== null);
}

function buildSummary(normalized: OrcamentistaManualVerifierNormalizedOutput) {
  return {
    verified_items_count: normalized.verified_items.length,
    confirmed_items_count: normalized.confirmed_items.length,
    disputed_items_count: normalized.disputed_items.length,
    divergence_points_count: normalized.divergence_points.length,
    critical_dimensions_count: normalized.critical_dimensions.length,
    risks_count: normalized.risks.length,
    hitl_requests_count: normalized.hitl_requests.length,
    missing_information_count: normalized.missing_information.length,
    requires_hitl: normalized.requires_hitl,
    blocks_consolidation: normalized.blocks_consolidation,
  };
}

function normalizeVerifierOutput(parsedOutput: Record<string, unknown>): OrcamentistaManualVerifierNormalizedOutput {
  const divergencePoints = normalizeDivergences(parsedOutput.divergence_points ?? parsedOutput.divergences);
  const hitlRequests = normalizeHitls(parsedOutput.hitl_requests ?? parsedOutput.verifier_hitls);
  const agreementScore = asNumber(parsedOutput.agreement_score);

  return {
    id: `manual-verifier-normalized-${Date.now()}`,
    agreement_score: agreementScore,
    verified_items: normalizeStringArray(parsedOutput.verified_items, ['item', 'label', 'description', 'title']),
    confirmed_items: normalizeStringArray(parsedOutput.confirmed_items, ['item', 'label', 'description', 'title']),
    disputed_items: normalizeStringArray(parsedOutput.disputed_items, ['item', 'label', 'description', 'title']),
    divergence_points: divergencePoints,
    identified_items: normalizeStringArray(parsedOutput.identified_items, ['item', 'label', 'description', 'title']),
    inferred_items: normalizeStringArray(parsedOutput.inferred_items, ['item', 'label', 'description', 'reasoning']),
    critical_dimensions: normalizeStringArray(parsedOutput.critical_dimensions, [
      'item',
      'label',
      'description',
      'dimension_type',
    ]),
    risks: normalizeStringArray(parsedOutput.risks, ['risk', 'description', 'title']),
    hitl_requests: hitlRequests,
    missing_information: normalizeStringArray(parsedOutput.missing_information, ['description', 'impact', 'title']),
    recommendations: normalizeStringArray(parsedOutput.recommendations, ['recommendation', 'description', 'title']),
    requires_hitl:
      asBoolean(parsedOutput.requires_hitl) ||
      hitlRequests.length > 0 ||
      divergencePoints.some((divergence) => divergence.requires_hitl),
    blocks_consolidation:
      asBoolean(parsedOutput.blocks_consolidation) ||
      divergencePoints.some((divergence) => divergence.blocks_consolidation),
    created_at: new Date().toISOString(),
  };
}

function validateVerifierShape(parsedOutput: Record<string, unknown>) {
  const errors: string[] = [];
  const hasKnownField = KNOWN_VERIFIER_FIELDS.some((field) => field in parsedOutput);

  if (!hasKnownField) {
    errors.push('JSON do Verifier nao possui campos reconhecidos para avaliacao.');
  }

  return {
    is_valid: errors.length === 0,
    errors,
  };
}

function buildEmptyOrInvalidResult({
  parseStatus,
  errors,
}: {
  parseStatus: Extract<OrcamentistaManualVerifierIngestionStatus, 'empty_input' | 'invalid_json'>;
  errors: string[];
}): OrcamentistaManualVerifierIngestionResult {
  return {
    id: `manual-verifier-ingestion-${parseStatus}`,
    parse_status: parseStatus,
    errors,
    warnings: [
      'Resultado do Verifier nao foi normalizado porque o JSON colado nao esta disponivel em formato avaliavel.',
      'Sem Verifier valido, dispatch e consolidacao permanecem bloqueados.',
    ],
    created_at: new Date().toISOString(),
  };
}

function determineStatus({
  shapeIsValid,
  requiresHitl,
  blocksConsolidation,
}: {
  shapeIsValid: boolean;
  requiresHitl: boolean;
  blocksConsolidation: boolean;
}): OrcamentistaManualVerifierIngestionStatus {
  if (!shapeIsValid) return 'invalid_shape';
  if (blocksConsolidation) return 'blocked_by_divergence';
  if (requiresHitl) return 'evaluated_requires_hitl';
  return 'evaluated';
}

export function parseManualVerifierJson(jsonString: string): ManualVerifierParseResult {
  const trimmed = jsonString.trim();

  if (!trimmed) {
    return {
      parse_status: 'empty_input',
      errors: ['Nenhum JSON do Verifier foi colado para avaliacao.'],
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (!isRecord(parsed)) {
      return {
        parse_status: 'invalid_json',
        errors: ['JSON do Verifier precisa representar um objeto.'],
      };
    }

    return {
      parse_status: 'valid_json',
      parsed_output: parsed,
      errors: [],
    };
  } catch (error) {
    return {
      parse_status: 'invalid_json',
      errors: [
        error instanceof Error
          ? `JSON do Verifier invalido: ${error.message}`
          : 'JSON do Verifier invalido: erro desconhecido no parse.',
      ],
    };
  }
}

export function buildManualVerifierEvaluationResult({
  parsedOutput,
  readerOutput,
}: {
  parsedOutput: Record<string, unknown>;
  readerOutput?: OrcamentistaNormalizedReaderOutput;
}): OrcamentistaManualVerifierIngestionResult {
  const shapeValidation = validateVerifierShape(parsedOutput);
  const normalizedVerifierOutput = normalizeVerifierOutput(parsedOutput);
  const comparisonResult = readerOutput
    ? compareReaderAndVerifierOutputs({
        readerOutput,
        verifierOutput: normalizedVerifierOutput,
      })
    : undefined;
  const requiresHitl = comparisonResult?.requires_hitl ?? normalizedVerifierOutput.requires_hitl;
  const blocksConsolidation = comparisonResult?.blocks_consolidation ?? normalizedVerifierOutput.blocks_consolidation;
  const status = determineStatus({
    shapeIsValid: shapeValidation.is_valid,
    requiresHitl,
    blocksConsolidation,
  });
  const warnings = [
    ...(readerOutput ? [] : ['Sem Reader normalizado, a comparacao Reader x Verifier nao foi executada.']),
    ...(comparisonResult?.dispatch_decision.reasons ?? []),
  ];

  return {
    id: `manual-verifier-ingestion-${Date.now()}`,
    parse_status: status,
    parsed_output: parsedOutput,
    normalized_verifier_output: normalizedVerifierOutput,
    verifier_summary: buildSummary(normalizedVerifierOutput),
    comparison_result: comparisonResult,
    errors: shapeValidation.errors,
    warnings,
    created_at: new Date().toISOString(),
  };
}

export function ingestManualVerifierOutput({
  jsonString,
  readerOutput,
}: {
  jsonString: string;
  readerOutput?: OrcamentistaNormalizedReaderOutput;
}): OrcamentistaManualVerifierIngestionResult {
  const parsed = parseManualVerifierJson(jsonString);

  if (parsed.parse_status === 'empty_input' || parsed.parse_status === 'invalid_json') {
    return buildEmptyOrInvalidResult({
      parseStatus: parsed.parse_status,
      errors: parsed.errors,
    });
  }

  return buildManualVerifierEvaluationResult({
    parsedOutput: parsed.parsed_output ?? {},
    readerOutput,
  });
}
