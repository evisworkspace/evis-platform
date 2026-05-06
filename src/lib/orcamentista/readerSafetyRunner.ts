import {
  OrcamentistaCriticalDimensionType,
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

function normalizeUnit(unit: string) {
  return unit
    .toLowerCase()
    .replace('³', '3')
    .replace('²', '2')
    .trim();
}

function includesAny(text: string, tokens: string[]) {
  const normalized = text.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

function dimensionSearchText(dimension: OrcamentistaReaderCriticalDimension) {
  return `${dimension.dimension_type} ${dimension.label} ${dimension.unit} ${dimension.source_text} ${dimension.source_reference}`.toLowerCase();
}

function dimensionPrimaryText(dimension: OrcamentistaReaderCriticalDimension) {
  return `${dimension.dimension_type} ${dimension.label} ${dimension.unit}`.toLowerCase();
}

function dimensionEvidenceText(dimension: OrcamentistaReaderCriticalDimension) {
  return `${dimension.source_text} ${dimension.source_reference}`.toLowerCase();
}

function isRestrictedQuantityUnit(unit: string) {
  return ['cm', 'mm', 'm', 'mpa', 'kg', 'm3'].includes(unit) || unit.includes('kgf/cm');
}

function isDiameterDimension(dimension: OrcamentistaReaderCriticalDimension) {
  const primaryText = dimensionPrimaryText(dimension);
  const evidenceText = dimensionEvidenceText(dimension);

  if (includesAny(primaryText, ['comprimento', 'profundidade', 'depth', 'length'])) return false;

  return (
    dimension.dimension_type === 'pile_diameter' ||
    includesAny(primaryText, ['diametro', 'diâmetro', 'diameter']) ||
    includesAny(evidenceText, ['d =', 'd=', 'ø'])
  );
}

function isLengthDimension(dimension: OrcamentistaReaderCriticalDimension) {
  const primaryText = dimensionPrimaryText(dimension);
  const evidenceText = dimensionEvidenceText(dimension);

  return (
    dimension.dimension_type === 'pile_depth' ||
    includesAny(primaryText, ['comprimento', 'profundidade', 'depth', 'length']) ||
    includesAny(evidenceText, ['c.total', 'barra', 'barras', 'aço', 'aco', 'unit '])
  );
}

function isQuantityDimension(dimension: OrcamentistaReaderCriticalDimension, unit: string) {
  const primaryText = dimensionPrimaryText(dimension);
  const evidenceText = dimensionEvidenceText(dimension);
  const hasExplicitTotal =
    includesAny(primaryText, ['total de estacas', 'quantidade total', 'quantity']) ||
    includesAny(evidenceText, ['quantidade total', 'quantidade oficial', 'tabela estacas indica quantidade']);
  const hasQuantityUnit = unit === 'unid' || unit === 'un' || unit === 'und' || unit === 'unidade' || unit === 'unidades';

  if (isDiameterDimension(dimension) || isLengthDimension(dimension)) return false;
  if (isRestrictedQuantityUnit(unit) && !hasExplicitTotal) return false;

  return (
    dimension.dimension_type === 'pile_quantity' ||
    hasExplicitTotal ||
    hasQuantityUnit ||
    includesAny(primaryText, ['quantidade', 'unidades'])
  );
}

function isVolumeDimension(dimension: OrcamentistaReaderCriticalDimension, unit: string) {
  const primaryText = dimensionPrimaryText(dimension);

  return (
    dimension.dimension_type === 'concrete_volume' ||
    dimension.dimension_type === 'pile_volume' ||
    unit === 'm3' ||
    includesAny(primaryText, ['volume'])
  );
}

function isConcreteStrengthDimension(dimension: OrcamentistaReaderCriticalDimension, unit: string) {
  const primaryText = dimensionPrimaryText(dimension);

  return (
    unit === 'mpa' ||
    unit.includes('kgf/cm') ||
    includesAny(primaryText, ['fck', 'resistencia', 'resistência'])
  );
}

function hasDecimalSeparatorAmbiguity(dimension: OrcamentistaReaderCriticalDimension, unit: string) {
  const evidenceText = dimensionEvidenceText(dimension);

  if (unit !== 'm') return false;

  return /(^|[^0-9])\d{2}([,.]\d+)?\s*m\b/.test(evidenceText);
}

function makeDimensionalObservation({
  id,
  dimension,
  dimensionType,
  expectedMin,
  expectedMax,
  severity = 'media',
  requiresHitl,
  blocksConsolidation,
  message,
  normalizedValue,
  ambiguityCandidates,
}: {
  id: string;
  dimension: OrcamentistaReaderCriticalDimension;
  dimensionType: OrcamentistaCriticalDimensionType;
  expectedMin: number;
  expectedMax: number;
  severity?: OrcamentistaDimensionalSanityCheck['severity'];
  requiresHitl: boolean;
  blocksConsolidation: boolean;
  message: string;
  normalizedValue?: number;
  ambiguityCandidates?: number[];
}): OrcamentistaDimensionalSanityCheck {
  return {
    id,
    dimension_type: dimensionType,
    value: dimension.value,
    unit: dimension.unit,
    expected_min: expectedMin,
    expected_max: expectedMax,
    severity,
    requires_hitl: requiresHitl,
    blocks_consolidation: blocksConsolidation,
    message,
    source_text: dimension.source_text || dimension.source_reference,
    normalized_value: normalizedValue,
    ambiguity_candidates: ambiguityCandidates,
  };
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
  const unit = normalizeUnit(dimension.unit);
  const isDiameter = isDiameterDimension(dimension);
  const isLength = isLengthDimension(dimension);
  const isQuantity = isQuantityDimension(dimension, unit);
  const isVolume = isVolumeDimension(dimension, unit);
  const isConcreteStrength = isConcreteStrengthDimension(dimension, unit);

  if (isDiameter) {
    checks.push(
      makeDimensionalObservation({
        id: `dim-check-pile-diameter-${dimension.id}`,
        dimension,
        dimensionType: 'pile_diameter',
        expectedMin: 10,
        expectedMax: 80,
        severity: dimension.value < 10 || dimension.value > 80 ? 'alta' : 'media',
        requiresHitl: true,
        blocksConsolidation: dimension.value < 10 || dimension.value > 80,
        message:
          'Diametro de estaca identificado como cota critica; validar unidade e correspondencia C25/diametro antes de consolidar.',
        normalizedValue: unit === 'm' ? dimension.value * 100 : unit === 'mm' ? dimension.value / 10 : dimension.value,
      })
    );
  }

  if (isQuantity) {
    checks.push(
      makeDimensionalObservation({
        id: `dim-check-pile-quantity-${dimension.id}`,
        dimension,
        dimensionType: 'pile_quantity',
        expectedMin: 1,
        expectedMax: 500,
        severity: dimension.value <= 0 ? 'alta' : 'media',
        requiresHitl: true,
        blocksConsolidation: dimension.value <= 0,
        message:
          'Quantidade de estacas e dado critico; manter HITL para confirmar total oficial antes de quantitativo.',
        normalizedValue: dimension.value,
      })
    );
  }

  if (isLength) {
    const normalizedDepthM = isLengthUnit(unit)
      ? unit === 'cm'
        ? dimension.value / 100
        : unit === 'mm'
          ? dimension.value / 1000
          : dimension.value
      : dimension.value;

    checks.push(
      makeDimensionalObservation({
        id: `dim-check-pile-length-unit-${dimension.id}`,
        dimension,
        dimensionType: 'pile_depth',
        expectedMin: 1,
        expectedMax: 15,
        severity: 'media',
        requiresHitl: true,
        blocksConsolidation: false,
        message:
          'Comprimento/profundidade ou comprimento de barra identificado; validar se representa profundidade executiva, comprimento de barra ou outra medida antes de consolidar.',
        normalizedValue: normalizedDepthM,
      })
    );

    if (isLengthUnit(unit)) {
      checks.push(
        ...runDimensionalSanityChecks({
          pile_depth: {
            value: dimension.value,
            unit,
            pile_diameter_cm: dimension.pile_diameter_cm,
            building_type: 'residential',
            source_text: sourceText,
          },
          ...(hasDecimalSeparatorAmbiguity(dimension, unit)
            ? {
                decimal_ambiguity: {
                  source_text: sourceText,
                  parsed_value: dimension.value,
                  unit,
                },
              }
            : {}),
        })
      );
    }
  }

  if (isVolume) {
    checks.push(
      makeDimensionalObservation({
        id: `dim-check-concrete-volume-${dimension.id}`,
        dimension,
        dimensionType: dimension.dimension_type === 'pile_volume' ? 'pile_volume' : 'concrete_volume',
        expectedMin: 0,
        expectedMax: Math.max(dimension.value * 1.3, dimension.value),
        severity: 'media',
        requiresHitl: true,
        blocksConsolidation: false,
        message:
          'Volume de concreto identificado; comparar com diametro, quantidade e profundidade das estacas antes de consolidar.',
        normalizedValue: dimension.value,
      })
    );
  }

  if (isConcreteStrength) {
    checks.push(
      makeDimensionalObservation({
        id: `dim-check-concrete-strength-unit-${dimension.id}`,
        dimension,
        dimensionType: 'foundation_dimension',
        expectedMin: 10,
        expectedMax: 60,
        severity: 'alta',
        requiresHitl: true,
        blocksConsolidation: false,
        message:
          'Resistencia do concreto identificada em unidade potencialmente divergente; confirmar fck por elemento antes de consolidar.',
        normalizedValue: unit.includes('kgf/cm') ? Number((dimension.value * 0.0980665).toFixed(2)) : dimension.value,
      })
    );
  }

  if (unit === 'cm' || unit === 'mm') {
    checks.push(
      makeDimensionalObservation({
        id: `dim-check-unit-normalization-${dimension.id}`,
        dimension,
        dimensionType: dimension.dimension_type === 'pile_diameter' ? 'pile_diameter' : 'foundation_dimension',
        expectedMin: 0,
        expectedMax: dimension.value,
        severity: 'baixa',
        requiresHitl: false,
        blocksConsolidation: false,
        message: isLength
          ? 'Valor em cm convertido para metros; validar se representa comprimento/profundidade executiva, comprimento de barra ou outra medida antes de consolidar.'
          : 'Cota em cm/mm detectada; qualquer uso em quantitativo deve normalizar unidade explicitamente antes de gravar payload.',
        normalizedValue: unit === 'cm' ? dimension.value / 100 : dimension.value / 1000,
      })
    );
  }

  if (dimension.dimension_type === 'pile_depth' && isLengthUnit(unit)) {
    checks.push(
      ...runDimensionalSanityChecks({
        pile_depth: {
          value: dimension.value,
          unit,
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
    isLengthUnit(unit)
  ) {
    checks.push(
      ...runDimensionalSanityChecks({
        decimal_ambiguity: {
          source_text: sourceText,
          parsed_value: dimension.value,
          unit,
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
  const checks = output.critical_dimensions.flatMap(checksForCriticalDimension);
  const concreteStrengthDimensions = output.critical_dimensions.filter((dimension) =>
    includesAny(dimensionSearchText(dimension), ['fck', 'resistencia', 'resistência', 'mpa', 'kgf/cm'])
  );

  if (concreteStrengthDimensions.length > 1) {
    const normalizedStrengths = concreteStrengthDimensions.map((dimension) => {
      const unit = normalizeUnit(dimension.unit);
      return unit.includes('kgf/cm') ? Number((dimension.value * 0.0980665).toFixed(2)) : dimension.value;
    });
    const minStrength = Math.min(...normalizedStrengths);
    const maxStrength = Math.max(...normalizedStrengths);

    if (maxStrength - minStrength > 1) {
      checks.push({
        id: 'dim-check-fck-divergent-units',
        dimension_type: 'foundation_dimension',
        value: maxStrength,
        unit: 'MPa',
        expected_min: minStrength,
        expected_max: maxStrength,
        severity: 'alta',
        requires_hitl: true,
        blocks_consolidation: false,
        message:
          'Fck/resistencia do concreto aparece com valores ou unidades divergentes; confirmar classe por elemento antes de consolidar.',
        source_text: concreteStrengthDimensions
          .map((dimension) => dimension.source_text || dimension.source_reference)
          .join(' | '),
        normalized_value: maxStrength,
        ambiguity_candidates: normalizedStrengths,
      });
    }
  }

  return checks;
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
