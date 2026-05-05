import {
  OrcamentistaManualReaderIngestionResult,
  OrcamentistaManualReaderIngestionStatus,
  OrcamentistaRawReaderModelOutput,
  OrcamentistaRealReaderSandboxInput,
} from '../../types';
import { getMaxAllowedConfidenceForSource } from './readerSafetyPolicy';
import {
  normalizeRawReaderOutput,
  validateReaderOutputShape,
} from './readerResultNormalizer';
import { runReaderSafetyGate } from './readerSafetyRunner';
import { MOCK_FIRST_REAL_READER_SANDBOX_INPUT } from './realReaderSandbox';

type ManualReaderParseResult = {
  parse_status: Extract<OrcamentistaManualReaderIngestionStatus, 'empty_input' | 'invalid_json'> | 'valid_json';
  parsed_output?: OrcamentistaRawReaderModelOutput;
  errors: string[];
};

function buildEmptyOrInvalidResult({
  parseStatus,
  errors,
}: {
  parseStatus: Extract<OrcamentistaManualReaderIngestionStatus, 'empty_input' | 'invalid_json'>;
  errors: string[];
}): OrcamentistaManualReaderIngestionResult {
  return {
    id: `manual-reader-ingestion-${parseStatus}`,
    parse_status: parseStatus,
    dimensional_checks: [],
    requires_verifier: false,
    requires_hitl: false,
    blocks_consolidation: true,
    allowed_to_dispatch: false,
    errors,
    warnings: [
      'Resultado nao foi normalizado porque o JSON colado nao esta disponivel em formato avaliavel.',
      'Resultado bloqueado nao pode seguir para dispatch/consolidacao.',
    ],
    created_at: new Date().toISOString(),
  };
}

function determineManualIngestionStatus({
  shapeIsValid,
  requiresVerifier,
  requiresHitl,
  blocksConsolidation,
  allowedToDispatch,
}: {
  shapeIsValid: boolean;
  requiresVerifier: boolean;
  requiresHitl: boolean;
  blocksConsolidation: boolean;
  allowedToDispatch: boolean;
}): OrcamentistaManualReaderIngestionStatus {
  if (!shapeIsValid) return 'invalid_shape';
  if (blocksConsolidation) return 'blocked_by_safety_gate';
  if (requiresHitl) return 'evaluated_requires_hitl';
  if (requiresVerifier) return 'evaluated_requires_verifier';
  if (allowedToDispatch) return 'evaluated_dispatch_ready';
  return 'blocked_by_safety_gate';
}

export function parseManualReaderJson(jsonString: string): ManualReaderParseResult {
  const trimmed = jsonString.trim();

  if (!trimmed) {
    return {
      parse_status: 'empty_input',
      errors: ['Nenhum JSON foi colado para avaliacao.'],
    };
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        parse_status: 'invalid_json',
        errors: ['JSON precisa representar um objeto de output do Reader.'],
      };
    }

    return {
      parse_status: 'valid_json',
      parsed_output: parsed as OrcamentistaRawReaderModelOutput,
      errors: [],
    };
  } catch (error) {
    return {
      parse_status: 'invalid_json',
      errors: [
        error instanceof Error
          ? `JSON invalido: ${error.message}`
          : 'JSON invalido: erro desconhecido no parse.',
      ],
    };
  }
}

export function buildManualReaderEvaluationResult({
  parsedOutput,
  input = MOCK_FIRST_REAL_READER_SANDBOX_INPUT,
}: {
  parsedOutput: OrcamentistaRawReaderModelOutput;
  input?: OrcamentistaRealReaderSandboxInput;
}): OrcamentistaManualReaderIngestionResult {
  const shapeValidation = validateReaderOutputShape(parsedOutput);
  const confidenceCap = getMaxAllowedConfidenceForSource(input.source_quality);
  const normalizedOutput = normalizeRawReaderOutput({
    rawOutput: parsedOutput,
    input,
    confidenceCap,
  });
  const safetyRunnerResult = runReaderSafetyGate(normalizedOutput);
  const warnings = [
    ...normalizedOutput.source_reference_warnings,
    ...safetyRunnerResult.safety_gate_result.messages,
    ...safetyRunnerResult.dispatch_block_reasons,
  ];
  const status = determineManualIngestionStatus({
    shapeIsValid: shapeValidation.is_valid,
    requiresVerifier: safetyRunnerResult.requires_verifier,
    requiresHitl: safetyRunnerResult.requires_hitl,
    blocksConsolidation: safetyRunnerResult.blocks_consolidation,
    allowedToDispatch: safetyRunnerResult.allowed_to_dispatch,
  });

  return {
    id: `manual-reader-ingestion-${input.document_id}-p${input.page_number}`,
    parse_status: status,
    parsed_output: parsedOutput,
    normalized_output: normalizedOutput,
    safety_gate_result: safetyRunnerResult.safety_gate_result,
    dimensional_checks: safetyRunnerResult.dimensional_checks,
    safety_runner_result: safetyRunnerResult,
    requires_verifier: safetyRunnerResult.requires_verifier,
    requires_hitl: safetyRunnerResult.requires_hitl,
    blocks_consolidation: safetyRunnerResult.blocks_consolidation,
    allowed_to_dispatch: safetyRunnerResult.allowed_to_dispatch,
    errors: shapeValidation.errors,
    warnings,
    created_at: new Date().toISOString(),
  };
}

export function ingestManualReaderOutput({
  jsonString,
  input = MOCK_FIRST_REAL_READER_SANDBOX_INPUT,
}: {
  jsonString: string;
  input?: OrcamentistaRealReaderSandboxInput;
}): OrcamentistaManualReaderIngestionResult {
  const parsed = parseManualReaderJson(jsonString);

  if (parsed.parse_status === 'empty_input' || parsed.parse_status === 'invalid_json') {
    return buildEmptyOrInvalidResult({
      parseStatus: parsed.parse_status,
      errors: parsed.errors,
    });
  }

  return buildManualReaderEvaluationResult({
    parsedOutput: parsed.parsed_output ?? {},
    input,
  });
}
