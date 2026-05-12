/**
 * PERSISTENCE CONTRACTS - ORCAMENTISTA IA
 * Fase 4C.1: Contratos oficiais para a camada de persistência.
 */

export type PipelineBaseInput = {
  opportunity_id: string;
  orcamento_id?: string | null;
  opportunity_file_id?: string | null;
  page_number?: number | null;
  document_id?: string | null;
  source_refs_json?: Record<string, unknown>;
};

// --- 1. Opportunity Files ---
export type RegisterOpportunityFileInput = {
  opportunity_id: string;
  nome: string;
  url?: string | null;
  storage_path?: string | null;
  categoria?: string | null;
  mime_type?: string | null;
  tamanho_bytes?: number | null;
};

// --- 2. Reader Runs ---
export type CreateReaderRunInput = PipelineBaseInput & {
  opportunity_file_id: string;
  page_number: number;
  reader_motor: string;
  source_quality: string;
  status: 'received' | 'normalized' | 'safety_evaluated' | 'blocked' | 'ready_for_verifier';
};

// --- 3. Reader Outputs ---
export type CreateReaderOutputInput = PipelineBaseInput & {
  reader_run_id: string;
  opportunity_file_id: string;
  page_number: number;
  raw_output_json: Record<string, unknown>;
  normalized_output_json: Record<string, unknown>;
  identified_count: number;
  inferred_count: number;
  missing_count: number;
  confidence_score?: number | null;
};

// --- 4. Safety Evaluations ---
export type CreateSafetyEvaluationInput = PipelineBaseInput & {
  reader_run_id: string;
  reader_output_id: string;
  opportunity_file_id: string;
  page_number: number;
  safety_gate_json: Record<string, unknown>;
  dimensional_checks_json: Record<string, unknown>;
  requires_verifier: boolean;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  allowed_to_dispatch: boolean;
};

// --- 5. Verifier Runs ---
export type CreateVerifierRunInput = PipelineBaseInput & {
  reader_run_id: string;
  reader_output_id: string;
  opportunity_file_id: string;
  page_number: number;
  verifier_motor: string;
  verifier_output_json: Record<string, unknown>;
  status: 'received' | 'normalized' | 'compared' | 'requires_hitl' | 'blocked' | 'approved';
};

// --- 6. Comparisons ---
export type CreateReaderVerifierComparisonInput = PipelineBaseInput & {
  reader_output_id: string;
  verifier_run_id: string;
  opportunity_file_id: string;
  page_number: number;
  agreement_score: number;
  agreement_band: 'low' | 'medium' | 'high';
  comparison_json: Record<string, unknown>;
  dispatch_decision_json: Record<string, unknown>;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  allowed_to_dispatch: boolean;
  status: 'pending' | 'divergent' | 'requires_hitl' | 'dispatch_allowed' | 'consolidation_blocked';
};

// --- 7. Divergences ---
export type CreateDivergenceInput = PipelineBaseInput & {
  comparison_id: string;
  reader_output_id: string;
  verifier_run_id: string;
  opportunity_file_id: string;
  page_number: number;
  category: string;
  technical_field: string;
  affected_item?: string | null;
  discipline?: string | null;
  title: string;
  reader_value?: string | null;
  verifier_value?: string | null;
  reason: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  dedupe_key: string;
  status?: 'aberta' | 'aceita' | 'descartada' | 'resolvida';
};

// --- 8. HITL Issues ---
export type CreateHitlIssueInput = PipelineBaseInput & {
  comparison_id?: string | null;
  reader_run_id?: string | null;
  reader_output_id?: string | null;
  verifier_run_id?: string | null;
  divergence_id?: string | null;
  opportunity_file_id?: string | null;
  source_type: string;
  source_id?: string | null;
  source_ref?: string | null;
  issue_type: string;
  severity: 'baixa' | 'media' | 'alta' | 'critica';
  status: 
    | 'pendente' 
    | 'em_revisao' 
    | 'aprovada_com_ressalva' 
    | 'bloqueada' 
    | 'documento_solicitado' 
    | 'convertida_em_verba' 
    | 'ignorada_nesta_fase' 
    | 'reanalisar_futuramente';
  title: string;
  description: string;
  evidence_summary: string;
  recommended_action: string;
  blocks_dispatch: boolean;
  blocks_consolidation: boolean;
};

// --- 9. HITL Decisions ---
export type CreateHitlDecisionInput = {
  hitl_issue_id: string;
  opportunity_id: string;
  orcamento_id?: string | null;
  decision_type: 
    | 'aprovar_com_ressalva' 
    | 'manter_bloqueado' 
    | 'solicitar_documento' 
    | 'marcar_como_verba' 
    | 'ignorar_nesta_fase' 
    | 'reanalisar_futuramente';
  notes: string;
  decided_by: string;
  dispatch_released: boolean;
  consolidation_released: boolean;
  source_refs_json?: Record<string, unknown>;
  issue_snapshot_json?: Record<string, unknown>;
  decision_payload_json?: Record<string, unknown>;
};

// --- 10. Context Snapshots ---
export type CreateContextSnapshotInput = PipelineBaseInput & {
  reader_run_id?: string | null;
  reader_output_id?: string | null;
  verifier_run_id?: string | null;
  comparison_id?: string | null;
  hitl_issue_id?: string | null;
  source_type: string;
  source_id?: string | null;
  source_ref?: string | null;
  phase: string;
  context_status: 'validated' | 'pending' | 'blocked' | 'incomplete';
  context_snapshot_json: Record<string, unknown>;
  created_by: string;
};

// --- Result Types ---
export type PersistenceResult<T> =
  | { status: 'success'; data: T; message: string }
  | { status: 'blocked'; reason: string; message: string }
  | { status: 'validation_error'; errors: string[]; message: string }
  | { status: 'persistence_error'; error: unknown; message: string };
