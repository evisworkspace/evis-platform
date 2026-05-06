import {
  OrcamentistaManualVerifierNormalizedOutput,
  OrcamentistaNormalizedReaderOutput,
  OrcamentistaVerifierAgreementScore,
  OrcamentistaVerifierComparisonResult,
  OrcamentistaVerifierConfirmedItem,
  OrcamentistaVerifierDispatchDecision,
  OrcamentistaVerifierDisputedItem,
  OrcamentistaVerifierDivergence,
  OrcamentistaVerifierDivergenceSeverity,
  OrcamentistaVerifierHitlRequest,
} from '../../types';

type ComparableReaderPoint = {
  id: string;
  category: OrcamentistaVerifierConfirmedItem['category'];
  label: string;
  value: string;
  reference?: string;
  confidence_score?: number;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function includesAny(text: string, tokens: string[]) {
  const normalized = normalizeText(text);
  return tokens.some((token) => normalized.includes(normalizeText(token)));
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim())));
}

function dedupeByNormalized<T>(values: T[], getKey: (value: T) => string) {
  const seen = new Set<string>();

  return values.filter((value) => {
    const key = normalizeText(getKey(value));
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function semanticFamilyKey(value: string) {
  const text = normalizeText(value);

  if (includesAny(text, ['comprimento profundidade', 'profundidade comprimento'])) return 'pile_length_depth';
  if (includesAny(text, ['profundidade', 'pile depth'])) return 'pile_length_depth';
  if (includesAny(text, ['comprimento', 'length', 'barra', 'c total', '600 cm'])) return 'pile_length_depth';
  if (includesAny(text, ['fck', 'resistencia', 'resistência', 'mpa', 'kgf cm'])) return 'concrete_strength';
  if (includesAny(text, ['diametro', 'diâmetro', 'diameter'])) return 'pile_diameter';
  if (includesAny(text, ['quantidade total de estacas', 'quantidade de estacas', 'total de estacas'])) {
    return 'pile_quantity';
  }
  if (includesAny(text, ['volume de concreto', 'concrete volume'])) return 'concrete_volume';
  if (includesAny(text, ['p6', 'p23'])) return 'p6_p23';
  if (includesAny(text, ['folha', 'prancha', 'carimbo', 'documento', 'revisao', 'revisão'])) {
    return 'document_traceability';
  }

  return text
    .split(' ')
    .filter((token) => !['de', 'da', 'do', 'das', 'dos', 'a', 'o', 'e', 'as', 'os'].includes(token))
    .slice(0, 5)
    .join(' ');
}

function divergenceFamilyKey(divergence: OrcamentistaVerifierDivergence) {
  return semanticFamilyKey(
    `${divergence.title} ${divergence.reader_value} ${divergence.verifier_value} ${divergence.reason}`
  );
}

function hitlFamilyKey(hitl: OrcamentistaVerifierHitlRequest) {
  return semanticFamilyKey(`${hitl.title} ${hitl.reason} ${hitl.required_decision}`);
}

function severityRank(severity: OrcamentistaVerifierDivergenceSeverity) {
  const ranks: Record<OrcamentistaVerifierDivergenceSeverity, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  return ranks[severity];
}

function maxSeverity(
  left: OrcamentistaVerifierDivergenceSeverity,
  right: OrcamentistaVerifierDivergenceSeverity
) {
  return severityRank(left) >= severityRank(right) ? left : right;
}

function asReaderPoints(readerOutput: OrcamentistaNormalizedReaderOutput): ComparableReaderPoint[] {
  return [
    ...readerOutput.identified_items.map((item) => ({
      id: item.id,
      category: 'identified_item' as const,
      label: item.label,
      value: `${item.label} ${item.description}`,
      reference: item.source_reference,
      confidence_score: item.confidence_score,
    })),
    ...readerOutput.inferred_items.map((item) => ({
      id: item.id,
      category: 'inferred_item' as const,
      label: item.element,
      value: `${item.element} ${item.reasoning}`,
      reference: item.source_references.join(' | '),
      confidence_score: item.confidence_score,
    })),
    ...readerOutput.critical_dimensions.map((item) => ({
      id: item.id,
      category: 'critical_dimension' as const,
      label: item.label,
      value: `${item.label} ${item.dimension_type} ${item.value}${item.unit} ${item.source_reference}`,
      reference: item.source_reference,
      confidence_score: item.confidence_score,
    })),
    ...readerOutput.risks.map((item) => ({
      id: item.id,
      category: 'risk' as const,
      label: item.description,
      value: `${item.description} ${item.severity}`,
      reference: item.source_reference,
    })),
    ...readerOutput.hitl_requests.map((item) => ({
      id: item.id,
      category: 'hitl' as const,
      label: item.question,
      value: `${item.question} ${item.reason}`,
      reference: item.source_reference,
    })),
    ...readerOutput.missing_information.map((item) => ({
      id: item.id,
      category: 'missing_information' as const,
      label: item.description,
      value: `${item.description} ${item.impact} ${item.suggested_action}`,
    })),
  ];
}

function verifierTextPool(verifierOutput: OrcamentistaManualVerifierNormalizedOutput) {
  return [
    ...verifierOutput.verified_items,
    ...verifierOutput.confirmed_items,
    ...verifierOutput.disputed_items,
    ...verifierOutput.identified_items,
    ...verifierOutput.inferred_items,
    ...verifierOutput.critical_dimensions,
    ...verifierOutput.risks,
    ...verifierOutput.hitl_requests.map((hitl) => `${hitl.title} ${hitl.reason} ${hitl.required_decision}`),
    ...verifierOutput.missing_information,
    ...verifierOutput.recommendations,
    ...verifierOutput.divergence_points.map((divergence) =>
      `${divergence.title} ${divergence.reason} ${divergence.verifier_value}`
    ),
  ].join(' ');
}

function hasVerifierMatch(point: ComparableReaderPoint, verifierOutput: OrcamentistaManualVerifierNormalizedOutput) {
  const pool = normalizeText(verifierTextPool(verifierOutput));
  const label = normalizeText(point.label);
  const labelTokens = label.split(' ').filter((token) => token.length > 2);
  const strongTokens = labelTokens.filter((token) => pool.includes(token));

  if (label && pool.includes(label)) return true;
  if (labelTokens.length <= 2) return strongTokens.length === labelTokens.length;
  return strongTokens.length >= Math.min(3, labelTokens.length);
}

function inferConfirmedCategory(label: string): OrcamentistaVerifierConfirmedItem['category'] {
  if (includesAny(label, ['inferido', 'inferencia', 'inferência', 'provavelmente', 'parece'])) return 'inferred_item';
  if (includesAny(label, ['risco', 'risk'])) return 'risk';
  if (includesAny(label, ['hitl', 'decisao', 'decisão', 'validar', 'confirmar oficialmente'])) return 'hitl';
  if (includesAny(label, ['pendente', 'ausente', 'missing', 'informacao faltante', 'informação faltante'])) {
    return 'missing_information';
  }
  if (
    includesAny(label, [
      'estaca',
      'diametro',
      'diâmetro',
      'quantidade',
      'comprimento',
      'profundidade',
      'fck',
      'resistencia',
      'resistência',
      'volume',
      'mpa',
      'kgf/cm',
      'cm',
      'm³',
    ])
  ) {
    return 'critical_dimension';
  }

  return 'identified_item';
}

function inferDivergenceCategory(label: string): OrcamentistaVerifierDivergence['category'] {
  if (includesAny(label, ['folha', 'prancha', 'carimbo', 'documento', 'revisao', 'revisão'])) {
    return 'document_traceability';
  }
  if (includesAny(label, ['risco', 'risk'])) return 'risk';
  if (includesAny(label, ['hitl', 'decisao', 'decisão', 'validar', 'confirmar'])) return 'hitl';
  if (includesAny(label, ['pendente', 'ausente', 'missing', 'informacao', 'informação'])) return 'missing_information';
  if (
    includesAny(label, [
      'estaca',
      'diametro',
      'diâmetro',
      'quantidade',
      'comprimento',
      'profundidade',
      'fck',
      'resistencia',
      'resistência',
      'volume',
      'mpa',
      'kgf/cm',
    ])
  ) {
    return 'critical_dimension';
  }

  return 'other';
}

export function classifyVerifierDivergenceSeverity(input: string): OrcamentistaVerifierDivergenceSeverity {
  const text = normalizeText(input);
  let severity: OrcamentistaVerifierDivergenceSeverity = 'low';

  if (includesAny(text, ['diametro de estaca', 'diametro nominal', 'diâmetro nominal', 'pile diameter'])) {
    severity = maxSeverity(severity, 'critical');
  }

  if (includesAny(text, ['profundidade', 'comprimento de estaca', 'comprimento indicado', 'pile depth', 'length'])) {
    severity = maxSeverity(severity, 'critical');
  }

  if (includesAny(text, ['quantidade total de estacas', 'quantidade de estacas', 'total de estacas'])) {
    severity = maxSeverity(severity, includesAny(text, ['conflito', 'diverge', 'ambigua']) ? 'critical' : 'high');
  }

  if (includesAny(text, ['fck', 'resistencia do concreto', 'resistência do concreto', 'mpa', 'kgf/cm'])) {
    severity = maxSeverity(severity, 'high');
  }

  if (includesAny(text, ['volume de concreto', 'concrete volume'])) {
    severity = maxSeverity(severity, 'high');
  }

  if (includesAny(text, ['p6', 'p23'])) {
    severity = maxSeverity(severity, includesAny(text, ['fundacao', 'fundação', 'bloco', 'estaca']) ? 'high' : 'medium');
  }

  if (includesAny(text, ['folha', 'prancha', 'carimbo', 'documento', 'revisao', 'revisão'])) {
    severity = maxSeverity(severity, 'medium');
  }

  return severity;
}

export function extractVerifierDivergences(
  verifierOutput: OrcamentistaManualVerifierNormalizedOutput
): OrcamentistaVerifierDivergence[] {
  const explicitDivergences = verifierOutput.divergence_points.map((divergence, index) => {
    const severity = classifyVerifierDivergenceSeverity(
      `${divergence.title} ${divergence.reason} ${divergence.verifier_value}`
    );
    const finalSeverity = maxSeverity(divergence.severity, severity);

    return {
      ...divergence,
      id: divergence.id || `verifier-divergence-${index + 1}`,
      severity: finalSeverity,
      requires_hitl: divergence.requires_hitl || severityRank(finalSeverity) >= severityRank('medium'),
      blocks_consolidation:
        divergence.blocks_consolidation || finalSeverity === 'high' || finalSeverity === 'critical',
    };
  });
  const explicitFamilies = new Set(explicitDivergences.map(divergenceFamilyKey));
  const disputedDivergences = verifierOutput.disputed_items
    .map((item, index) => {
      const severity = classifyVerifierDivergenceSeverity(item);

      return {
        id: `verifier-disputed-divergence-${index + 1}`,
        category: inferDivergenceCategory(item),
        title: item,
        reader_value: '',
        verifier_value: item,
        reason: 'Verifier marcou item como disputado.',
        severity,
        requires_hitl: severityRank(severity) >= severityRank('medium'),
        blocks_consolidation: severity === 'high' || severity === 'critical',
      };
    })
    .filter((divergence) => !explicitFamilies.has(divergenceFamilyKey(divergence)));

  return dedupeByNormalized([...explicitDivergences, ...disputedDivergences], divergenceFamilyKey);
}

export function extractConfirmedItems(
  verifierOutput: OrcamentistaManualVerifierNormalizedOutput
): OrcamentistaVerifierConfirmedItem[] {
  const manualConfirmed = [
    ...verifierOutput.verified_items.map((label) => ({ label, source: 'verified_items' })),
    ...verifierOutput.confirmed_items.map((label) => ({ label, source: 'confirmed_items' })),
  ];

  return dedupeByNormalized(manualConfirmed, (item) => item.label).map((item, index) => ({
    id: `confirmed-verifier-${index + 1}`,
    category: inferConfirmedCategory(item.label),
    label: item.label,
    verifier_reference: item.source,
  }));
}

export function extractDisputedItems(
  verifierOutput: OrcamentistaManualVerifierNormalizedOutput
): OrcamentistaVerifierDisputedItem[] {
  const divergences = extractVerifierDivergences(verifierOutput);
  const disputedFromVerifier = verifierOutput.disputed_items.map((item, index) => {
    const matchingDivergence = divergences.find(
      (divergence) => semanticFamilyKey(item) === divergenceFamilyKey(divergence)
    );
    const severity = matchingDivergence?.severity ?? classifyVerifierDivergenceSeverity(item);

    return {
      id: matchingDivergence ? `disputed-${matchingDivergence.id}` : `disputed-verifier-item-${index + 1}`,
      category: matchingDivergence?.category ?? inferDivergenceCategory(item),
      label: item,
      reader_value: matchingDivergence?.reader_value ?? '',
      verifier_value: matchingDivergence?.verifier_value ?? '',
      severity,
      requires_hitl: matchingDivergence?.requires_hitl ?? severityRank(severity) >= severityRank('medium'),
    };
  });
  const disputedFamilies = new Set(disputedFromVerifier.map((item) => semanticFamilyKey(item.label)));
  const disputedFromDivergences = divergences
    .filter((divergence) => !disputedFamilies.has(divergenceFamilyKey(divergence)))
    .map((divergence) => ({
      id: `disputed-${divergence.id}`,
      category: divergence.category,
      label: divergence.title,
      reader_value: divergence.reader_value,
      verifier_value: divergence.verifier_value,
      severity: divergence.severity,
      requires_hitl: divergence.requires_hitl,
    }));

  return dedupeByNormalized([...disputedFromVerifier, ...disputedFromDivergences], (item) =>
    semanticFamilyKey(item.label)
  );
}

export function calculateAgreementScore(
  readerOutput: OrcamentistaNormalizedReaderOutput,
  verifierOutput: OrcamentistaManualVerifierNormalizedOutput
): OrcamentistaVerifierAgreementScore {
  const points = asReaderPoints(readerOutput);
  const matchedPoints = points.filter((point) => hasVerifierMatch(point, verifierOutput)).length;
  const totalPoints = points.length || 1;
  const explicitDivergencePenalty = Math.min(0.5, extractVerifierDivergences(verifierOutput).length * 0.08);
  const calculatedScore = Math.max(0, Math.min(1, matchedPoints / totalPoints - explicitDivergencePenalty));
  const providedScore = verifierOutput.agreement_score;
  const score = providedScore === undefined ? calculatedScore : Math.min(providedScore, calculatedScore || providedScore);

  return {
    score: Number(score.toFixed(2)),
    band: score >= 0.9 ? 'high' : score >= 0.8 ? 'medium' : 'low',
    matched_points: matchedPoints,
    total_points: points.length,
    provided_score: providedScore,
    calculated_score: Number(calculatedScore.toFixed(2)),
  };
}

export function buildVerifierHitlRequests(
  divergences: OrcamentistaVerifierDivergence[],
  verifierOutput: OrcamentistaManualVerifierNormalizedOutput
): OrcamentistaVerifierHitlRequest[] {
  const explicitHitls = dedupeByNormalized(verifierOutput.hitl_requests, hitlFamilyKey);
  const explicitHitlFamilies = new Set(explicitHitls.map(hitlFamilyKey));
  const divergenceHitls = divergences
    .filter((divergence) => divergence.requires_hitl || severityRank(divergence.severity) >= severityRank('medium'))
    .filter((divergence) => !explicitHitlFamilies.has(divergenceFamilyKey(divergence)))
    .map((divergence) => ({
      id: `hitl-${divergence.id}`,
      title: `Revisar: ${divergence.title}`,
      reason: divergence.reason,
      required_decision: `Decidir valor oficial para ${divergence.title} antes de dispatch ou consolidacao.`,
      severity: divergence.severity,
      source_divergence_ids: [divergence.id],
    }));

  return [...explicitHitls, ...divergenceHitls];
}

export function getVerifierBlockingReasons(comparison: Pick<
  OrcamentistaVerifierComparisonResult,
  'agreement_score' | 'divergence_points' | 'verifier_hitls' | 'blocks_consolidation'
>) {
  const reasons: string[] = [];
  const highOrCritical = comparison.divergence_points.filter(
    (divergence) => divergence.severity === 'high' || divergence.severity === 'critical'
  );

  if (highOrCritical.length > 0) {
    reasons.push('Divergencia high/critical entre Reader e Verifier bloqueia dispatch.');
  }

  if (comparison.agreement_score.score < 0.9) {
    reasons.push('Agreement score abaixo de 0.90 exige HITL.');
  }

  if (comparison.agreement_score.score < 0.8) {
    reasons.push('Agreement score abaixo de 0.80 bloqueia consolidacao.');
  }

  if (comparison.verifier_hitls.length > 0) {
    reasons.push('Verifier gerou HITLs pendentes.');
  }

  if (comparison.blocks_consolidation) {
    reasons.push('Comparacao Reader x Verifier mantem consolidacao bloqueada.');
  }

  return dedupeStrings(reasons);
}

export function getVerifierDispatchDecision(comparison: Pick<
  OrcamentistaVerifierComparisonResult,
  'agreement_score' | 'divergence_points' | 'verifier_hitls' | 'blocks_consolidation'
>): OrcamentistaVerifierDispatchDecision {
  const highOrCritical = comparison.divergence_points.some(
    (divergence) => divergence.severity === 'high' || divergence.severity === 'critical'
  );
  const requiresHitl =
    highOrCritical || comparison.agreement_score.score < 0.9 || comparison.verifier_hitls.length > 0;
  const blocksConsolidation =
    highOrCritical || comparison.agreement_score.score < 0.8 || comparison.blocks_consolidation;
  const allowedToDispatch = !requiresHitl && !blocksConsolidation;
  const reasons = getVerifierBlockingReasons({
    ...comparison,
    blocks_consolidation: blocksConsolidation,
  });

  return {
    allowed_to_dispatch: allowedToDispatch,
    requires_hitl: requiresHitl,
    blocks_consolidation: blocksConsolidation,
    decision: allowedToDispatch ? 'dispatch_allowed' : requiresHitl ? 'requires_hitl' : 'dispatch_blocked',
    reasons: allowedToDispatch ? ['Reader e Verifier concordam sem bloqueios locais.'] : reasons,
  };
}

export function summarizeVerifierComparison(comparison: OrcamentistaVerifierComparisonResult) {
  return {
    agreement_score: comparison.agreement_score.score,
    confirmed_items_count: comparison.confirmed_items.length,
    disputed_items_count: comparison.disputed_items.length,
    divergence_points_count: comparison.divergence_points.length,
    verifier_hitls_count: comparison.verifier_hitls.length,
    high_or_critical_divergences: comparison.divergence_points.filter(
      (divergence) => divergence.severity === 'high' || divergence.severity === 'critical'
    ).length,
    allowed_to_dispatch: comparison.allowed_to_dispatch,
    requires_hitl: comparison.requires_hitl,
    blocks_consolidation: comparison.blocks_consolidation,
  };
}

export function compareReaderAndVerifierOutputs({
  readerOutput,
  verifierOutput,
}: {
  readerOutput: OrcamentistaNormalizedReaderOutput;
  verifierOutput: OrcamentistaManualVerifierNormalizedOutput;
}): OrcamentistaVerifierComparisonResult {
  const divergencePoints = extractVerifierDivergences(verifierOutput);
  const confirmedItems = extractConfirmedItems(verifierOutput);
  const disputedItems = extractDisputedItems(verifierOutput);
  const agreementScore = calculateAgreementScore(readerOutput, verifierOutput);
  const verifierHitls = buildVerifierHitlRequests(divergencePoints, verifierOutput);
  const preliminaryBlocks =
    verifierOutput.blocks_consolidation ||
    divergencePoints.some((divergence) => divergence.blocks_consolidation);
  const dispatchDecision = getVerifierDispatchDecision({
    agreement_score: agreementScore,
    divergence_points: divergencePoints,
    verifier_hitls: verifierHitls,
    blocks_consolidation: preliminaryBlocks,
  });
  const recommendations = dedupeStrings([
    ...verifierOutput.recommendations,
    ...(dispatchDecision.requires_hitl ? ['Resolver HITLs do Verifier antes de qualquer dispatch.'] : []),
    ...(dispatchDecision.blocks_consolidation ? ['Manter consolidacao bloqueada ate divergencias serem resolvidas.'] : []),
  ]);

  return {
    id: `reader-verifier-comparison-${readerOutput.document_id}-p${readerOutput.page_number}`,
    reader_output_id: readerOutput.id,
    agreement_score: agreementScore,
    divergence_points: divergencePoints,
    confirmed_items: confirmedItems,
    disputed_items: disputedItems,
    verifier_hitls: verifierHitls,
    blocks_consolidation: dispatchDecision.blocks_consolidation,
    allowed_to_dispatch: dispatchDecision.allowed_to_dispatch,
    requires_hitl: dispatchDecision.requires_hitl,
    dispatch_decision: dispatchDecision,
    recommendations,
    created_at: new Date().toISOString(),
  };
}
