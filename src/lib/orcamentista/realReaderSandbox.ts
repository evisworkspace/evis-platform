import {
  OrcamentistaRawReaderModelOutput,
  OrcamentistaRealReaderSandboxInput,
  OrcamentistaRealReaderSandboxResult,
} from '../../types';
import { buildPrimaryReaderPrompt, buildVerifierPrompt } from './readerPromptTemplates';
import { normalizeRawReaderOutput } from './readerResultNormalizer';
import { runReaderSafetyGate } from './readerSafetyRunner';
import { getMaxAllowedConfidenceForSource } from './readerSafetyPolicy';

export const MOCK_FIRST_REAL_READER_SANDBOX_INPUT: OrcamentistaRealReaderSandboxInput = {
  id: 'real-reader-sandbox-page-001',
  opportunity_id: 'opp-sandbox',
  orcamento_id: null,
  document_id: 'doc-sandbox-fundacao',
  file_name: 'Projeto Estrutural - Fundacoes.pdf',
  page_number: 1,
  page_label: 'E-01 Fundacoes - pagina isolada',
  page_image_ref: 'manual://page-image/fundacoes-p1.png',
  page_text_ref: 'manual://page-text/fundacoes-p1.txt',
  source_quality: 'raster_pdf_clear',
  reader_motor: 'gpt_5_5',
  verifier_motor: 'gemini_3_1',
  manual_model_run_only: true,
  created_at: '2026-05-05T15:00:00.000Z',
};

export const MOCK_RAW_READER_OUTPUT_35M_AMBIGUITY: OrcamentistaRawReaderModelOutput = {
  page_summary:
    'Pagina isolada de fundacoes com anotacao visual de estacas. A leitura deve ser tratada como sandbox e nao como quantitativo oficial.',
  source_quality: 'raster_pdf_clear',
  confidence_score: 0.91,
  identified_items: [
    {
      id: 'identified-estaca-e1',
      label: 'Estaca E1',
      description: 'Anotacao indica estaca com diametro 25 cm e profundidade lida como 35 m.',
      quantity: '1 un',
      confidence_score: 0.91,
      source_reference: 'Projeto Estrutural - Fundacoes.pdf · p.1 · detalhe E1',
      evidence_type: 'DRAWING_MEASUREMENT',
      tags: ['fundacao', 'estaca', 'cota_critica'],
    },
  ],
  inferred_items: [
    {
      id: 'inferred-volume-estaca-e1',
      label: 'Volume de concreto da estaca E1',
      description: 'Volume seria derivado de profundidade, diametro e quantidade, portanto nao e fato identificado.',
      confidence_score: 0.55,
      source_references: ['Projeto Estrutural - Fundacoes.pdf · p.1 · detalhe E1'],
      tags: ['inferencia', 'volume_concreto_visual'],
    },
  ],
  missing_information: [
    {
      id: 'missing-sondagem',
      description: 'Sondagem e memoria de calculo nao estao disponiveis nesta pagina isolada.',
      impact: 'Nao e possivel validar profundidade de estaca nem criterio de fundacao.',
      severity: 'critical',
      suggested_action: 'Solicitar Verifier independente e decisao HITL antes de qualquer uso.',
    },
  ],
  risks: [
    {
      id: 'risk-decimal-depth',
      description: 'A profundidade pode representar 35 m ou 3,5 m por ambiguidade decimal visual.',
      severity: 'critical',
      source_reference: 'Projeto Estrutural - Fundacoes.pdf · p.1 · detalhe E1',
    },
  ],
  hitl_requests: [
    {
      id: 'hitl-confirm-depth',
      question: 'A profundidade correta da estaca E1 e 35 m ou 3,5 m?',
      reason: 'Dimensao critica com ambiguidade decimal em fundacao.',
      severity: 'critical',
      source_reference: 'Projeto Estrutural - Fundacoes.pdf · p.1 · detalhe E1',
    },
  ],
  critical_dimensions: [
    {
      id: 'critdim-estaca-e1-depth',
      dimension_type: 'pile_depth',
      label: 'Profundidade da estaca E1',
      value: 35,
      unit: 'm',
      source_text: 'E1 Ø25 h=35m',
      source_reference: 'Projeto Estrutural - Fundacoes.pdf · p.1 · detalhe E1',
      confidence_score: 0.91,
      context_tags: ['fundacao', 'estaca', 'profundidade_estaca', 'cota_critica'],
      pile_diameter_cm: 25,
      source_type: 'visual_calculation',
    },
  ],
  contains_foundation_or_pile: true,
  notes: ['Mock estrutural para testar bloqueio 35 m vs 3,5 m.'],
};

export function buildManualReaderSandboxPromptPackage(
  input: OrcamentistaRealReaderSandboxInput = MOCK_FIRST_REAL_READER_SANDBOX_INPUT
) {
  return buildPrimaryReaderPrompt(input);
}

export function runRealReaderSandbox({
  input = MOCK_FIRST_REAL_READER_SANDBOX_INPUT,
  rawReaderOutput = MOCK_RAW_READER_OUTPUT_35M_AMBIGUITY,
}: {
  input?: OrcamentistaRealReaderSandboxInput;
  rawReaderOutput?: OrcamentistaRawReaderModelOutput;
} = {}): OrcamentistaRealReaderSandboxResult {
  const promptPackage = buildPrimaryReaderPrompt(input);
  const confidenceCap = getMaxAllowedConfidenceForSource(input.source_quality);
  const normalizedOutput = normalizeRawReaderOutput({
    rawOutput: rawReaderOutput,
    input,
    confidenceCap,
  });
  const safetyRunnerResult = runReaderSafetyGate(normalizedOutput);
  const verifierPromptPackage = buildVerifierPrompt({
    input,
    normalizedOutput,
  });
  const status = normalizedOutput.shape_errors.length
    ? 'invalid_reader_output'
    : safetyRunnerResult.blocks_consolidation
      ? 'blocked_by_safety_gate'
      : safetyRunnerResult.requires_verifier
        ? 'ready_for_verifier'
        : 'mock_output_normalized';

  return {
    id: `real-reader-sandbox-result-${input.document_id}-p${input.page_number}`,
    status,
    document_id: input.document_id,
    file_name: input.file_name,
    page_number: input.page_number,
    page_image_ref: input.page_image_ref,
    page_text_ref: input.page_text_ref,
    source_quality: input.source_quality,
    reader_motor: input.reader_motor,
    verifier_motor: input.verifier_motor,
    prompt_package: promptPackage,
    verifier_prompt_package: verifierPromptPackage,
    raw_reader_output: rawReaderOutput,
    normalized_output: normalizedOutput,
    safety_gate_result: safetyRunnerResult.safety_gate_result,
    dimensional_checks: safetyRunnerResult.dimensional_checks,
    safety_runner_result: safetyRunnerResult,
    requires_verifier: safetyRunnerResult.requires_verifier,
    requires_hitl: safetyRunnerResult.requires_hitl,
    blocks_consolidation: safetyRunnerResult.blocks_consolidation,
    allowed_to_dispatch: safetyRunnerResult.allowed_to_dispatch,
    manual_model_run_ready: true,
    created_at: new Date().toISOString(),
  };
}
