import {
  OrcamentistaCriticalDimensionType,
  OrcamentistaDimensionalSanityCheck,
  OrcamentistaHitlIssueSeverity,
} from '../../types';

type LengthUnit = 'm' | 'cm' | 'mm';

export type PileDepthSanityInput = {
  value: number;
  unit: LengthUnit;
  pile_diameter_cm?: number;
  building_type?: 'residential' | 'commercial' | 'unknown';
  source_text?: string;
};

export type PileVolumeConsistencyInput = {
  depth_m: number;
  diameter_cm: number;
  quantity: number;
  reported_concrete_volume_m3?: number;
  tolerance_ratio?: number;
  source_text?: string;
};

export type DecimalAmbiguityInput = {
  source_text: string;
  parsed_value: number;
  unit: LengthUnit;
};

export type SlabAreaSanityInput = {
  area_m2: number;
  source_type: 'visual_calculation' | 'explicit_table' | 'manual_assumption';
  expected_room_area_m2?: number;
  source_text?: string;
};

export type SteelQuantitySourceInput = {
  value_kg: number;
  source_type: 'rebar_schedule' | 'explicit_table' | 'coefficient' | 'visual_estimate' | 'unknown';
  has_rebar_schedule: boolean;
  source_text?: string;
};

export type DimensionalSanityCheckInput = {
  pile_depth?: PileDepthSanityInput;
  pile_volume?: PileVolumeConsistencyInput;
  decimal_ambiguity?: DecimalAmbiguityInput;
  slab_area?: SlabAreaSanityInput;
  steel_quantity?: SteelQuantitySourceInput;
};

function toMeters(value: number, unit: LengthUnit) {
  if (unit === 'cm') return value / 100;
  if (unit === 'mm') return value / 1000;
  return value;
}

function makeCheck({
  id,
  dimensionType,
  value,
  unit,
  expectedMin,
  expectedMax,
  severity,
  requiresHitl,
  blocksConsolidation,
  message,
  sourceText,
  normalizedValue,
  ambiguityCandidates,
}: {
  id: string;
  dimensionType: OrcamentistaCriticalDimensionType;
  value: number;
  unit: string;
  expectedMin: number;
  expectedMax: number;
  severity: OrcamentistaHitlIssueSeverity;
  requiresHitl: boolean;
  blocksConsolidation: boolean;
  message: string;
  sourceText?: string;
  normalizedValue?: number;
  ambiguityCandidates?: number[];
}): OrcamentistaDimensionalSanityCheck {
  return {
    id,
    dimension_type: dimensionType,
    value,
    unit,
    expected_min: expectedMin,
    expected_max: expectedMax,
    severity,
    requires_hitl: requiresHitl,
    blocks_consolidation: blocksConsolidation,
    message,
    source_text: sourceText,
    normalized_value: normalizedValue,
    ambiguity_candidates: ambiguityCandidates,
  };
}

export function checkPileDepthSanity(input: PileDepthSanityInput): OrcamentistaDimensionalSanityCheck[] {
  const depthM = toMeters(input.value, input.unit);
  const checks: OrcamentistaDimensionalSanityCheck[] = [];
  const isResidentialPile25 =
    input.building_type === 'residential' &&
    input.pile_diameter_cm !== undefined &&
    Math.abs(input.pile_diameter_cm - 25) <= 2;

  if (isResidentialPile25 && depthM > 15) {
    checks.push(
      makeCheck({
        id: 'dim-check-pile-depth-over-15m-critical',
        dimensionType: 'pile_depth',
        value: depthM,
        unit: 'm',
        expectedMin: 1,
        expectedMax: 15,
        severity: 'critica',
        requiresHitl: true,
        blocksConsolidation: true,
        message:
          'Estaca residencial de diametro aproximado 25 cm com profundidade acima de 15 m e critica; bloquear e validar com projeto/sondagem.',
        sourceText: input.source_text,
        normalizedValue: depthM,
      })
    );
  } else if (isResidentialPile25 && depthM > 8) {
    checks.push(
      makeCheck({
        id: 'dim-check-pile-depth-over-8m-hitl',
        dimensionType: 'pile_depth',
        value: depthM,
        unit: 'm',
        expectedMin: 1,
        expectedMax: 8,
        severity: 'alta',
        requiresHitl: true,
        blocksConsolidation: false,
        message:
          'Estaca residencial de diametro aproximado 25 cm com profundidade acima de 8 m exige HITL antes de qualquer quantitativo.',
        sourceText: input.source_text,
        normalizedValue: depthM,
      })
    );
  }

  if (depthM < 1) {
    checks.push(
      makeCheck({
        id: 'dim-check-pile-depth-under-1m-hitl',
        dimensionType: 'pile_depth',
        value: depthM,
        unit: 'm',
        expectedMin: 1,
        expectedMax: 15,
        severity: 'alta',
        requiresHitl: true,
        blocksConsolidation: false,
        message: 'Profundidade de estaca menor que 1 m e atipica e exige validacao humana.',
        sourceText: input.source_text,
        normalizedValue: depthM,
      })
    );
  }

  return checks;
}

export function checkPileVolumeConsistency(
  input: PileVolumeConsistencyInput
): OrcamentistaDimensionalSanityCheck[] {
  if (input.reported_concrete_volume_m3 === undefined) return [];

  const tolerance = input.tolerance_ratio ?? 0.15;
  const radiusM = input.diameter_cm / 100 / 2;
  const calculatedVolume = Math.PI * radiusM * radiusM * input.depth_m * input.quantity;
  const differenceRatio =
    input.reported_concrete_volume_m3 === 0
      ? 1
      : Math.abs(calculatedVolume - input.reported_concrete_volume_m3) / input.reported_concrete_volume_m3;

  if (differenceRatio <= tolerance) return [];

  return [
    makeCheck({
      id: 'dim-check-pile-volume-summary-mismatch',
      dimensionType: 'pile_volume',
      value: calculatedVolume,
      unit: 'm3',
      expectedMin: input.reported_concrete_volume_m3 * (1 - tolerance),
      expectedMax: input.reported_concrete_volume_m3 * (1 + tolerance),
      severity: 'critica',
      requiresHitl: true,
      blocksConsolidation: true,
      message:
        'Volume calculado de estacas nao bate com o resumo de concreto; bloquear consolidacao ate revisar profundidade, diametro e quantidade.',
      sourceText: input.source_text,
      normalizedValue: calculatedVolume,
    }),
  ];
}

export function checkDecimalAmbiguity(
  input: DecimalAmbiguityInput
): OrcamentistaDimensionalSanityCheck[] {
  const normalizedValue = toMeters(input.parsed_value, input.unit);
  const source = input.source_text.toLowerCase().replace(/\s+/g, ' ');
  const couldBeDecimalShift =
    input.unit === 'm' &&
    normalizedValue >= 10 &&
    /(^|[^0-9])\d{2}([,.]\d+)?\s*m\b/.test(source);
  const couldBeCentimeters =
    input.unit === 'cm' && input.parsed_value >= 100 && input.parsed_value <= 999;
  const candidates = couldBeDecimalShift
    ? [normalizedValue, normalizedValue / 10]
    : couldBeCentimeters
      ? [normalizedValue, input.parsed_value]
      : [];

  if (candidates.length === 0) return [];

  const isCritical35Vs35 =
    candidates.some((candidate) => Math.abs(candidate - 35) < 0.001) &&
    candidates.some((candidate) => Math.abs(candidate - 3.5) < 0.001);

  return [
    makeCheck({
      id: isCritical35Vs35
        ? 'dim-check-decimal-ambiguity-35m-vs-3-5m'
        : 'dim-check-decimal-ambiguity-normalization',
      dimensionType: 'decimal_ambiguity',
      value: normalizedValue,
      unit: 'm',
      expectedMin: Math.min(...candidates),
      expectedMax: Math.max(...candidates),
      severity: isCritical35Vs35 ? 'critica' : 'alta',
      requiresHitl: true,
      blocksConsolidation: true,
      message: isCritical35Vs35
        ? 'Ambiguidade critica: leitura pode ser 35 m ou 3,5 m. Bloquear ate confirmacao humana e Verifier independente.'
        : 'Valor dimensional possui ambiguidade de separador decimal ou unidade; normalizar e validar antes de consolidar.',
      sourceText: input.source_text,
      normalizedValue,
      ambiguityCandidates: candidates,
    }),
  ];
}

export function checkSlabAreaSanity(input: SlabAreaSanityInput): OrcamentistaDimensionalSanityCheck[] {
  const checks: OrcamentistaDimensionalSanityCheck[] = [];

  if (input.source_type === 'visual_calculation') {
    checks.push(
      makeCheck({
        id: 'dim-check-slab-area-visual-hitl',
        dimensionType: 'slab_area',
        value: input.area_m2,
        unit: 'm2',
        expectedMin: 0,
        expectedMax: input.expected_room_area_m2 ?? input.area_m2,
        severity: 'media',
        requiresHitl: true,
        blocksConsolidation: false,
        message: 'Area de laje calculada visualmente exige HITL e nao pode ser tratada como area identificada.',
        sourceText: input.source_text,
        normalizedValue: input.area_m2,
      })
    );
  }

  if (input.expected_room_area_m2 !== undefined) {
    const minAllowed = input.expected_room_area_m2 * 0.7;
    const maxAllowed = input.expected_room_area_m2 * 1.3;

    if (input.area_m2 < minAllowed || input.area_m2 > maxAllowed) {
      checks.push(
        makeCheck({
          id: 'dim-check-slab-area-room-mismatch',
          dimensionType: 'slab_area',
          value: input.area_m2,
          unit: 'm2',
          expectedMin: minAllowed,
          expectedMax: maxAllowed,
          severity: 'alta',
          requiresHitl: true,
          blocksConsolidation: true,
          message: 'Area de laje incompatível com ambiente/planta; bloquear ate revisar contorno e escala.',
          sourceText: input.source_text,
          normalizedValue: input.area_m2,
        })
      );
    }
  }

  return checks;
}

export function checkSteelQuantitySource(
  input: SteelQuantitySourceInput
): OrcamentistaDimensionalSanityCheck[] {
  const isExplicitSource = input.source_type === 'rebar_schedule' || input.source_type === 'explicit_table';

  if (isExplicitSource && input.has_rebar_schedule) return [];

  const severity: OrcamentistaHitlIssueSeverity =
    input.source_type === 'coefficient' || input.source_type === 'visual_estimate' ? 'alta' : 'critica';

  return [
    makeCheck({
      id: 'dim-check-steel-quantity-source-required',
      dimensionType: 'steel_quantity',
      value: input.value_kg,
      unit: 'kg',
      expectedMin: 0,
      expectedMax: input.value_kg,
      severity,
      requiresHitl: true,
      blocksConsolidation: true,
      message:
        'Quantidade de aco sem quadro de armacao deve ser tratada como inferida; nao consolidar sem fonte explicita.',
      sourceText: input.source_text,
      normalizedValue: input.value_kg,
    }),
  ];
}

export function runDimensionalSanityChecks(
  input: DimensionalSanityCheckInput
): OrcamentistaDimensionalSanityCheck[] {
  return [
    ...(input.pile_depth ? checkPileDepthSanity(input.pile_depth) : []),
    ...(input.pile_volume ? checkPileVolumeConsistency(input.pile_volume) : []),
    ...(input.decimal_ambiguity ? checkDecimalAmbiguity(input.decimal_ambiguity) : []),
    ...(input.slab_area ? checkSlabAreaSanity(input.slab_area) : []),
    ...(input.steel_quantity ? checkSteelQuantitySource(input.steel_quantity) : []),
  ];
}
