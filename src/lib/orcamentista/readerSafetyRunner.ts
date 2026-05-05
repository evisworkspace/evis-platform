import {
  OrcamentistaDimensionalSanityCheck,
  OrcamentistaNormalizedReaderOutput,
  OrcamentistaReaderCriticalDimension,
  OrcamentistaReaderSafetyRunnerResult,
  OrcamentistaReadingSourceQuality,
  OrcamentistaSafetyGateResult,
} from '../../types';
import {
  applyReaderSafetyRules,
  getMaxAllowedConfidenceForSource,
} from './readerSafetyPolicy';
import { runDimensionalSanityChecks } from './dimensionalSanityChecks';
import {
  shouldUseSecondaryVerifier,
  getRecommendedMotorForRole,
} from './motorSelectionPolicy';

type LengthUnit = 'm' | 'cm' | 'mm';

function isLengthUnit(unit: string): unit is LengthUnit {
  return unit === 'm' || unit === 'cm' || unit === 'mm';
}

function includesAny(text: string, tokens: string[]) {
  const normalized = text.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

function collectAppliesTo(output: OrcamentistaNormalizedReaderOutput) {
  const appliesTo = new Set<string>();

  output.inferred_items.forEach(() => {
    appliesTo.add('inferencia');
    appliesTo.add('inferred_item');
  });

  output.identified_items.forEach((item) => {
    const text = `${item.label} ${item.description}`.toLowerCase();
    if (includesAny(text, ['estaca', 'fundacao', 'fundação'])) appliesTo.add('fundacao');
    if (text.includes('estaca')) appliesTo.add('estaca');
    if (includesAny(text, ['aco', 'aço', 'armacao', 'armação'])) appliesTo.add('aco');
    if (includesAny(text, ['concreto', 'volume'])) appliesTo.add('volume_concreto');
    if (item.evidence_type === 'TABLE_ROW') appliesTo.add('tabela');
  });

  output.critical_dimensions.forEach((dimension) => {
    appliesTo.add('cota_critica');
    appliesTo.add('dimensao_critica');
    dimension.context_tags.forEach((tag) => appliesTo.add(tag));

    if (dimension.dimension_type === 'pile_depth') appliesTo.add('profundidade_estaca');
    if (dimension.dimension_type === 'pile_diameter') appliesTo.add('diametro_estaca');
    if (dimension.dimension_type === 'pile_quantity') appliesTo.add('quantidade_estaca');
    if (dimension.dimension_type === 'pile_volume') appliesTo.add('volume_concreto');
    if (dimension.dimension_type === 'steel_quantity') appliesTo.add('quantitativo_aco');
    if (dimension.dimension_type === 'decimal_ambiguity') appliesTo.add('dimensao_critica');
  });

  if (output.contains_foundation_or_pile) {
    appliesTo.add('fundacao');
    appliesTo.add('estaca');
  }

  if (output.source_reference_warnings.length > 0) appliesTo.add('fonte_incompleta');

  return Array.from(appliesTo);
}

export function applySourceQualityConfidenceCap({
  sourceQuality,
  confidenceScore,
}: {
  sourceQuality: OrcamentistaReadingSourceQuality;
  confidenceScore: number;
}) {
  const maxConfidence = getMaxAllowedConfidenceForSource(sourceQuality);
  return {
    capped_confidence_score: Math.min(confidenceScore, maxConfidence),
    confidence_cap_applied: confidenceScore > maxConfidence,
    max_confidence_allowed: maxConfidence,
  };
}

function checksForCriticalDimension(
  dimension: OrcamentistaReaderCriticalDimension
): OrcamentistaDimensionalSanityCheck[] {
  const checks: OrcamentistaDimensionalSanityCheck[] = [];
  const sourceText = dimension.source_text || dimension.source_reference;
  const sourceType = dimension.source_type ?? 'unknown';

  if (dimension.dimension_type === 'pile_depth' && isLengthUnit(dimension.unit)) {
    checks.push(
      ...runDimensionalSanityChecks({
        pile_depth: {
          value: dimension.value,
          unit: dimension.unit,
          pile_diameter_cm: dimension.pile_diameter_cm,
          building_type: 'residential',
          source_text: sourceText,
        },
      })
    );
  }

  if (
    dimension.dimension_type === 'pile_volume' &&
    dimension.pile_diameter_cm !== undefined &&
    dimension.pile_quantity !== undefined
  ) {
    checks.push(
      ...runDimensionalSanityChecks({
        pile_volume: {
          depth_m: dimension.value,
          diameter_cm: dimension.pile_diameter_cm,
          quantity: dimension.pile_quantity,
          reported_concrete_volume_m3: dimension.reported_concrete_volume_m3,
          source_text: sourceText,
        },
      })
    );
  }

  if (
    (dimension.dimension_type === 'pile_depth' ||
      dimension.dimension_type === 'foundation_dimension' ||
      dimension.dimension_type === 'critical_level' ||
      dimension.dimension_type === 'decimal_ambiguity') &&
    isLengthUnit(dimension.unit)
  ) {
    checks.push(
      ...runDimensionalSanityChecks({
        decimal_ambiguity: {
          source_text: sourceText,
          parsed_value: dimension.value,
          unit: dimension.unit,
        },
      })
    );
  }

  if (dimension.dimension_type === 'slab_area') {
    checks.push(
      ...runDimensionalSanityChecks({
        slab_area: {
          area_m2: dimension.value,
          source_type:
            sourceType === 'visual_calculation' ||
            sourceType === 'explicit_table' ||
            sourceType === 'manual_assumption'
              ? sourceType
              : 'visual_calculation',
          expected_room_area_m2: dimension.expected_room_area_m2,
          source_text: sourceText,
        },
      })
    );
  }

  if (dimension.dimension_type === 'steel_quantity') {
    checks.push(
      ...runDimensionalSanityChecks({
        steel_quantity: {
          value_kg: dimension.value,
          source_type:
            sourceType === 'rebar_schedule' ||
            sourceType === 'explicit_table' ||
            sourceType === 'coefficient' ||
            sourceType === 'visual_estimate' ||
            sourceType === 'unknown'
              ? sourceType
              : 'unknown',
          has_rebar_schedule: sourceType === 'rebar_schedule',
          source_text: sourceText,
        },
      })
    );
  }

  return checks;
}

export function applyCriticalDimensionChecks(
  output: OrcamentistaNormalizedReaderOutput
): OrcamentistaDimensionalSanityCheck[] {
  return output.critical_dimensions.flatMap(checksForCriticalDimension);
}

export function determineReaderVerifierRequirement({
  output,
  safetyGateResult,
  dimensionalChecks,
}: {
  output: OrcamentistaNormalizedReaderOutput;
  safetyGateResult: OrcamentistaSafetyGateResult;
  dimensionalChecks: OrcamentistaDimensionalSanityCheck[];
}) {
  return (
    safetyGateResult.requires_verifier ||
    shouldUseSecondaryVerifier({
      role: 'primary_reader',
      source_quality: output.source_quality,
      contains_critical_dimension: output.critical_dimensions.length > 0,
      contains_quantitative_table: output.identified_items.some((item) => item.evidence_type === 'TABLE_ROW'),
      contains_foundation_reading: output.contains_foundation_or_pile,
      contains_inference: output.inferred_items.length > 0,
      confidence_score: output.confidence_score,
      review_goal: 'structured_reading',
    }) ||
    dimensionalChecks.length > 0
  );
}

export function determineReaderHitlRequirement({
  output,
  safetyGateResult,
  dimensionalChecks,
}: {
  output: OrcamentistaNormalizedReaderOutput;
  safetyGateResult: OrcamentistaSafetyGateResult;
  dimensionalChecks: OrcamentistaDimensionalSanityCheck[];
}) {
  return (
    safetyGateResult.requires_hitl ||
    output.hitl_requests.length > 0 ||
    output.source_reference_warnings.length > 0 ||
    output.shape_errors.length > 0 ||
    output.risks.some((risk) => risk.severity === 'high' || risk.severity === 'critical') ||
    dimensionalChecks.some((check) => check.requires_hitl)
  );
}

export function determineReaderDispatchEligibility({
  requiresVerifier,
  requiresHitl,
  blocksConsolidation,
  output,
}: {
  requiresVerifier: boolean;
  requiresHitl: boolean;
  blocksConsolidation: boolean;
  output: OrcamentistaNormalizedReaderOutput;
}) {
  const reasons: string[] = [];

  if (requiresVerifier) reasons.push('Verifier independente requerido antes de dispatch.');
  if (requiresHitl) reasons.push('HITL requerido antes de dispatch.');
  if (blocksConsolidation) reasons.push('Leitura bloqueia consolidacao e nao pode seguir automaticamente.');
  if (output.identified_items.length === 0 && output.inferred_items.length === 0) {
    reasons.push('Nenhum item identificado ou inferido para orientar agentes.');
  }

  return {
    allowed_to_dispatch: reasons.length === 0,
    dispatch_block_reasons: reasons,
  };
}

export function runReaderSafetyGate(output: OrcamentistaNormalizedReaderOutput): OrcamentistaReaderSafetyRunnerResult {
  const sourceCap = applySourceQualityConfidenceCap({
    sourceQuality: output.source_quality,
    confidenceScore: output.confidence_score,
  });
  const appliesTo = collectAppliesTo(output);
  const safetyGateResult = applyReaderSafetyRules({
    id: output.id,
    applies_to: appliesTo.length ? appliesTo : ['pagina_isolada'],
    source_quality: output.source_quality,
    confidence_score: output.confidence_score,
  });
  const dimensionalChecks = applyCriticalDimensionChecks(output);
  const requiresVerifier = determineReaderVerifierRequirement({
    output,
    safetyGateResult,
    dimensionalChecks,
  });
  const requiresHitl = determineReaderHitlRequirement({
    output,
    safetyGateResult,
    dimensionalChecks,
  });
  const blocksConsolidation =
    safetyGateResult.blocks_consolidation ||
    dimensionalChecks.some((check) => check.blocks_consolidation) ||
    output.shape_errors.length > 0;
  const dispatch = determineReaderDispatchEligibility({
    requiresVerifier,
    requiresHitl,
    blocksConsolidation,
    output,
  });
  const primaryReader = getRecommendedMotorForRole('primary_reader');

  return {
    id: `reader-safety-runner-${output.document_id}-p${output.page_number}`,
    source_quality: output.source_quality,
    safety_gate_result: {
      ...safetyGateResult,
      messages: [
        ...safetyGateResult.messages,
        `Motor primario recomendado pela policy: ${primaryReader?.name ?? 'nao definido'}.`,
      ],
    },
    dimensional_checks: dimensionalChecks,
    confidence_cap_applied: sourceCap.confidence_cap_applied,
    capped_confidence_score: sourceCap.capped_confidence_score,
    requires_verifier: requiresVerifier,
    requires_hitl: requiresHitl,
    blocks_consolidation: blocksConsolidation,
    allowed_to_dispatch: dispatch.allowed_to_dispatch,
    dispatch_block_reasons: dispatch.dispatch_block_reasons,
    created_at: new Date().toISOString(),
  };
}
