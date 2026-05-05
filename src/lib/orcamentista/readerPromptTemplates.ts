import {
  OrcamentistaReaderPromptPackage,
  OrcamentistaRealReaderSandboxInput,
  OrcamentistaVerifierPromptPackage,
  OrcamentistaNormalizedReaderOutput,
} from '../../types';

export const READER_OUTPUT_JSON_SCHEMA = `{
  "page_summary": "string",
  "source_quality": "vector_pdf_clear | vector_pdf_mixed | raster_pdf_clear | raster_pdf_low_resolution | compressed_image | readable_table | illegible_table | unknown",
  "confidence_score": 0.0,
  "identified_items": [
    {
      "id": "string",
      "label": "string",
      "description": "string",
      "quantity": "string | optional",
      "confidence_score": 0.0,
      "source_reference": "file/page/axis/table/cell/excerpt",
      "evidence_type": "TEXT_EXPLICIT | TABLE_ROW | DRAWING_ANNOTATION | VISUAL_MEASUREMENT | INFERENCE | UNKNOWN",
      "tags": ["string"]
    }
  ],
  "inferred_items": [
    {
      "id": "string",
      "label": "string",
      "description": "reasoning, not fact",
      "confidence_score": 0.0,
      "source_reference": "file/page/axis/table/cell/excerpt or global_page_evidence",
      "source_references": ["file/page/axis/table/cell/excerpt"],
      "evidence_that_supports": ["visible text, note, symbol or cross-reference that supports the inference"],
      "tags": ["inferencia"]
    }
  ],
  "missing_information": [
    {
      "id": "string",
      "description": "string",
      "impact": "string",
      "severity": "low | medium | high | critical",
      "source_reference": "file/page/axis/table/cell/excerpt or global_page_gap",
      "suggested_action": "string"
    }
  ],
  "risks": [
    {
      "id": "string",
      "description": "string",
      "severity": "low | medium | high | critical",
      "source_reference": "file/page/axis/table/cell/excerpt or global_page_risk"
    }
  ],
  "hitl_requests": [
    {
      "id": "string",
      "question": "string",
      "reason": "string",
      "required_decision": "specific human decision needed",
      "severity": "low | medium | high | critical",
      "source_reference": "file/page/axis/table/cell/excerpt or global_page_hitl"
    }
  ],
  "critical_dimensions": [
    {
      "id": "string",
      "dimension_type": "pile_depth | pile_diameter | pile_quantity | pile_volume | slab_area | steel_quantity | concrete_volume | critical_level | foundation_dimension | decimal_ambiguity",
      "label": "string",
      "value": 0.0,
      "unit": "m | cm | mm | m2 | m3 | kg | un",
      "source_text": "exact text or visible annotation",
      "source_reference": "file/page/axis/table/cell/excerpt",
      "confidence_score": 0.0,
      "context_tags": ["fundacao", "estaca", "cota_critica"],
      "pile_diameter_cm": 0.0,
      "pile_quantity": 0,
      "reported_concrete_volume_m3": 0.0,
      "source_type": "visual_calculation | explicit_table | manual_assumption | rebar_schedule | coefficient | visual_estimate | unknown"
    }
  ],
  "contains_foundation_or_pile": false,
  "notes": ["string"]
}`;

const READER_SYSTEM_PROMPT = [
  'Voce e o Reader tecnico do Orçamentista IA EVIS.',
  'Leia exatamente uma pagina isolada. Nao leia outras paginas e nao use memoria externa.',
  'Sua tarefa e extrair evidencias auditaveis, nao gerar orcamento.',
  'Nao crie itens oficiais, nao estime preco, nao consolide quantitativo e nao afirme conformidade normativa.',
  'Nao invente informacao ausente. Separe fatos identificados, inferencias, informacoes faltantes, riscos e pedidos HITL.',
  'Toda informacao deve trazer fonte/evidencia: pagina, eixo, quadro, linha, celula, nota ou trecho visivel.',
  'Todo inferred_items, missing_information, risks e hitl_requests deve trazer source_reference. Se for um alerta global da pagina, use global_page_evidence/global_page_gap/global_page_risk/global_page_hitl e explique no campo textual.',
  'Inferencia nunca pode ser tratada como fato.',
  'Dimensao critica, fundacao, estaca, aco e volume de concreto exigem marcacao explicita para Verifier e HITL.',
  'Ambiguidade decimal ou unidade deve ser bloqueada por hitl_requests e critical_dimensions.',
  'Responda somente JSON valido conforme o schema solicitado.',
].join('\n');

const VERIFIER_SYSTEM_PROMPT = [
  'Voce e o Verifier conservador do Orçamentista IA EVIS.',
  'Revise uma unica pagina isolada e o JSON do Reader.',
  'Procure erro numerico, decimal, unidade, omissao, fonte fraca e inferencia indevida.',
  'Nao gere orcamento, nao crie item oficial e nao aprove dimensao critica sozinho.',
  'Se houver fundacao, estaca, cota critica, baixa legibilidade ou inferencia, exija HITL quando necessario.',
  'Responda com JSON auditavel de verificacao, apontando concordancias, divergencias, bloqueios e HITL.',
].join('\n');

export function buildPrimaryReaderPrompt(input: OrcamentistaRealReaderSandboxInput): OrcamentistaReaderPromptPackage {
  const createdAt = new Date().toISOString();
  const userPrompt = [
    `Documento: ${input.file_name}`,
    `document_id: ${input.document_id}`,
    `Pagina isolada: ${input.page_number}${input.page_label ? ` - ${input.page_label}` : ''}`,
    `Fonte visual: ${input.page_image_ref ?? 'nao fornecida'}`,
    `Fonte textual: ${input.page_text_ref ?? 'nao fornecida'}`,
    `Qualidade de origem declarada: ${input.source_quality}`,
    '',
    'Execute leitura tecnica somente desta pagina.',
    'Retorne exclusivamente JSON conforme READER_OUTPUT_JSON_SCHEMA.',
    'Nao gere orcamento, item oficial, proposta, obra, cronograma ou payload de banco.',
    'Quando a pagina nao trouxer fonte suficiente, mova o ponto para missing_information ou hitl_requests.',
    'Preencha source_reference em risks, hitl_requests, inferred_items e missing_information; para risco global da pagina use global_page_risk, e para HITL global use global_page_hitl.',
    'Para estaca/fundacao/cota critica, preencha critical_dimensions e marque contains_foundation_or_pile quando aplicavel.',
    '',
    'READER_OUTPUT_JSON_SCHEMA:',
    READER_OUTPUT_JSON_SCHEMA,
  ].join('\n');

  return {
    id: `reader-prompt-${input.document_id}-p${input.page_number}`,
    document_id: input.document_id,
    file_name: input.file_name,
    page_number: input.page_number,
    page_image_ref: input.page_image_ref,
    page_text_ref: input.page_text_ref,
    source_quality: input.source_quality,
    reader_motor: input.reader_motor,
    system_prompt: READER_SYSTEM_PROMPT,
    user_prompt: userPrompt,
    output_schema: READER_OUTPUT_JSON_SCHEMA,
    safety_notes: [
      'Manual model run ready: este pacote nao chama IA/API.',
      'Reader nao gera orcamento nem grava em orcamento_itens.',
      'Dimensoes criticas exigem Verifier, sanity checks e HITL quando ambiguas.',
      'PDF rasterizado recebe teto de confianca por policy.',
    ],
    created_at: createdAt,
  };
}

export function buildVerifierPrompt({
  input,
  normalizedOutput,
}: {
  input: OrcamentistaRealReaderSandboxInput;
  normalizedOutput: OrcamentistaNormalizedReaderOutput;
}): OrcamentistaVerifierPromptPackage {
  const createdAt = new Date().toISOString();
  const userPrompt = [
    `Documento: ${input.file_name}`,
    `document_id: ${input.document_id}`,
    `Pagina isolada: ${input.page_number}${input.page_label ? ` - ${input.page_label}` : ''}`,
    `Fonte visual: ${input.page_image_ref ?? 'nao fornecida'}`,
    `Fonte textual: ${input.page_text_ref ?? 'nao fornecida'}`,
    `Qualidade de origem declarada: ${input.source_quality}`,
    '',
    'Revise o JSON normalizado do Reader abaixo.',
    'Aponte divergencias, omissoes, fontes insuficientes, ambiguidade decimal e qualquer risco de inferencia como fato.',
    'Nao aprove consolidacao oficial. Quando em duvida, bloqueie ou exija HITL.',
    '',
    JSON.stringify(normalizedOutput, null, 2),
  ].join('\n');

  return {
    id: `verifier-prompt-${input.document_id}-p${input.page_number}`,
    document_id: input.document_id,
    file_name: input.file_name,
    page_number: input.page_number,
    page_image_ref: input.page_image_ref,
    page_text_ref: input.page_text_ref,
    source_quality: input.source_quality,
    reader_motor: input.reader_motor,
    verifier_motor: input.verifier_motor,
    normalized_reader_output: normalizedOutput,
    system_prompt: VERIFIER_SYSTEM_PROMPT,
    user_prompt: userPrompt,
    output_schema:
      '{"agreement_score":0.0,"verification_status":"APPROVED|HITL_REQUIRED|REANALYSIS_REQUIRED|BLOCKED","disagreements":[],"requires_hitl":false,"blocks_consolidation":false,"verifier_notes":[]}',
    created_at: createdAt,
  };
}
