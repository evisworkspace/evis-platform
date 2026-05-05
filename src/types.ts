export type Servico = {
  id?: string;
  id_servico?: string; // Legado
  codigo_servico?: string;
  codigo_referencia?: string;
  nome: string;
  categoria: string;
  avanco_atual: number;
  status: string;
  data_prevista?: string;
  data_conclusao?: string;
  responsavel?: string;
  equipe?: string;
  unidade?: string;
  quantidade?: number;
  valor_unitario?: number;
  valor_total?: number;
  custo_mao_obra?: number;
  custo_material?: number;
  obra_id?: string;
  origem_preco?: string;
  origem_preco_detalhe?: string;
  competencia_preco?: string;
  fonte_preco?: string;
  confianca_referencia?: number;
};

export type Pendencia = {
  id: string;
  descricao: string;
  prioridade: 'alta' | 'media' | 'baixa';
  status: 'ABERTA' | 'RESOLVIDA';
  obra_id?: string;
};

export type Equipe = {
  id?: string;
  cod: string;
  nome: string;
  funcao?: string;
  telefone?: string;
  email?: string;
  pix?: string;
  obs_obras?: string;
  ativo?: boolean;
};

export type Nota = {
  id: string;
  tipo: 'observacao' | 'decisao' | 'alerta' | 'lembrete';
  texto: string;
  data_nota: string;
  autor?: string;
};

export type Foto = {
  id: string;
  url: string;
  thumb?: string;
  legenda: string;
  data_foto: string;
  semana?: string;
};

export type IAResult = {
  resumo: string;
  narrativa: string;
  equipes_presentes: string[];
  servicos_atualizar: {
    id_servico: string;
    avanco_novo: number;
    status_novo: 'nao_iniciado' | 'em_andamento' | 'concluido' | 'pausado';
    data_prevista?: string | null;
    data_conclusao?: string | null;
  }[];
  pendencias_novas: {
    descricao: string;
    prioridade: 'alta' | 'media' | 'baixa';
  }[];
  pendencias_resolver: {
    id: string;
  }[];
  notas_adicionar: {
    tipo: 'observacao' | 'decisao' | 'alerta' | 'lembrete';
    texto: string;
  }[];
};

export type DiarioEntry = {
  texto: string;
  iaResult?: IAResult;
  confirmado?: boolean;
  ts?: number;
};

export type RelatorioSemanal = {
  id: string; // Ex: "2026-W11"
  semana_str: string; // "Semana 11"
  periodo: { inicio: string; fim: string };
  resumo_executivo: string;
  narrativa_tecnica: string;
  kpis: {
    avanco_fisico: number;
    avanco_ponderado: number;
  };
  cronograma: Servico[];
  presenca: Record<string, string[]>;
  fotos: Foto[];
  notas_criticas: Nota[];
  pendencias_criticas: Pendencia[];
  data_fechamento: string;
};

export type PendingChangeData =
  | Servico
  | Pendencia
  | Equipe
  | Nota
  | Foto
  | RelatorioSemanal
  | { id: string; [key: string]: unknown };

export type PendingChange = {
  table: string;
  data: PendingChangeData;
  ts: number;
};

export type AppState = {
  servicos: Servico[];
  pendencias: Pendencia[];
  presenca: Record<string, string[]>; // dia -> [cod_equipe]
  diario: Record<string, DiarioEntry>; // dia -> { texto, iaResult, confirmado, ts }
  narrativas: Record<string, string>; // dia -> texto da narrativa
  notas: Nota[];
  fotos: Foto[];
  equipes: Equipe[];
  relatorios: Record<string, RelatorioSemanal>; // dict de semana (ex: '2026-W11') -> RelatorioSemanal congelado
  currentDay: string;
  globalFilter: {
    referenceDate: string;
    periodDays: number;
    viewMode: string;
  };
  pendingChanges: PendingChange[];
};

export type Config = {
  url: string;
  key: string;
  obraId: string;
  gemini: string;
  model: string;
  imgbbKey: string;
  ollama: string;
  minimax: string;
  mcpServer: string;
};

export type OrcamentoStatus = 'rascunho' | 'aprovado' | 'importado';
export type ServicoStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'bloqueado' | 'pausado';

export type Orcamento = {
  id: string;
  obra_id?: string;
  nome: string;
  cliente?: string;
  status: OrcamentoStatus;
  bdi: number;
  total_bruto: number;
  total_final: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
};

// Resultado controlado da criação/vinculação de orçamento por oportunidade (Fase 1C)
export type CreateOpportunityBudgetResult =
  | { status: 'already_linked'; orcamentoId: string; message: string }
  | { status: 'created'; orcamento: Orcamento; message: string }
  | { status: 'blocked'; reason: string; message: string }
  | { status: 'error'; error: string; message: string };

export type OrcamentoItem = {
  id: string;
  orcamento_id: string;
  codigo?: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  origem: 'manual' | 'sinapi' | 'ia';
  created_at?: string;
};

// ── Tipos auxiliares para itens manuais do orçamento da oportunidade (Fase 1D) ──

/** Campos necessários para criar um item manual. valor_total é calculado automaticamente. */
export type CreateManualBudgetItemInput = {
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  codigo?: string;
};

/** Campos que podem ser atualizados em um item manual existente. */
export type UpdateManualBudgetItemInput = Partial<CreateManualBudgetItemInput>;

/** Resultado controlado de operações de criação/edição/remoção de item manual. */
export type ManualBudgetItemActionResult =
  | { status: 'success'; item: OrcamentoItem; message: string }
  | { status: 'removed'; itemId: string; message: string }
  | { status: 'blocked'; reason: string; message: string }
  | { status: 'error'; error: string; message: string };

export type Etapa = {
  id: number;
  chave: string;
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em_andamento' | 'concluida' | 'aguardando_hitl' | 'bloqueada' | 'erro';
};

export type Anexo = {
  id: string;
  nome: string;
  mimeType: string;
  base64?: string;
  origem: 'workspace' | 'inline';
  relativePath?: string;
};

export type HitlPendente = {
  roteiro: Array<{
    id: number;
    etapa: string;
    agente_responsavel: string;
    hitl_obrigatorio: boolean;
  }>;
  scoreConsistencia: number;
};

export type Mensagem = {
  id: string;
  role: 'user' | 'assistant' | 'hitl';
  conteudo: string;
  timestamp: Date;
  anexos?: { nome: string; mimeType: string }[];
  hitlData?: HitlPendente;
};

export type AuditLog = {
  id: string;
  timestamp: Date;
  status: 'info' | 'success' | 'warning' | 'error';
  mensagem: string;
};

export type PreviewItem = {
  codigo?: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  categoria?: string;
  origem?: string;
  confianca?: number;
  observacoes?: string;
};

export type ProgressoRuntime = {
  faseAtual: string;
  agenteAtual: string;
  origemExecucao: string;
  leituraMultimodal: boolean;
  consolidadoDisponivel: boolean;
};

export type PipelineFase =
  | 'idle'
  | 'recebendo_arquivos'
  | 'arquivos_recebidos'
  | 'em_leitura'
  | 'leitura_concluida'
  | 'classificando_documentos'
  | 'planejando_escopo'
  | 'acionando_agentes'
  | 'quantificando'
  | 'precificando'
  | 'aplicando_bdi'
  | 'auditando'
  | 'aguardando_hitl'
  | 'gerando_cronograma'
  | 'gerando_proposta'
  | 'consolidado'
  | 'erro'
  | 'cancelado';

export type OrcamentistaWorkspace = {
  id: string;
  nome?: string;
  opportunity_id?: string | null;
  orcamento_id?: string | null;
  status?: PipelineFase;
  created_at?: string;
  updated_at?: string;
};

export type OrcamentistaRun = {
  id: string;
  workspace_id: string;
  opportunity_id?: string | null;
  orcamento_id?: string | null;
  fase: PipelineFase;
  status: 'pendente' | 'em_execucao' | 'concluido' | 'concluido_com_alertas' | 'erro' | 'cancelado';
  started_at?: string;
  finished_at?: string | null;
  output_summary?: string | null;
  error_message?: string | null;
};

export type AgentOutput = {
  agent_name: string;
  agent_type: string;
  orcamento_id?: string | null;
  versao_orcamento?: string | number | null;
  item_analisado?: string | null;
  disciplina?: string | null;
  status: string;
  confianca: number;
  origem?: {
    tipo?: string;
    arquivo_id?: string | null;
    pagina?: string | number | null;
    referencia?: string | null;
  };
  itens_identificados?: unknown[];
  itens_inferidos?: unknown[];
  servicos_sugeridos?: unknown[];
  quantitativos_possiveis?: unknown[];
  riscos?: unknown[];
  hitl?: unknown[];
  premissas?: unknown[];
  exclusoes?: unknown[];
  bloqueia_consolidacao?: boolean;
  observacoes_tecnicas?: string;
  observacoes_internas?: string;
};

export type OrcamentistaHitl = {
  id: string;
  orcamento_id?: string | null;
  versao_id?: string | null;
  item_ref?: string | null;
  tipo_item?: string | null;
  hitl_type:
    | 'hitl_escopo'
    | 'hitl_quantidade'
    | 'hitl_custo'
    | 'hitl_fornecimento'
    | 'hitl_risco_tecnico'
    | 'hitl_risco_financeiro'
    | 'hitl_responsabilidade_tecnica'
    | 'hitl_documentacao'
    | 'hitl_aprovacao_externa'
    | 'hitl_premissa'
    | 'hitl_exclusao'
    | 'hitl_margem_bdi'
    | 'hitl_cronograma'
    | 'hitl_compatibilizacao'
    | 'hitl_comercial';
  disciplina?: string | null;
  titulo: string;
  motivo: string;
  impacto_tecnico?: string | null;
  impacto_financeiro?: string | null;
  impacto_prazo?: string | null;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  status:
    | 'pendente'
    | 'em_revisao'
    | 'aprovada'
    | 'corrigida'
    | 'rejeitada'
    | 'convertida_em_verba'
    | 'fora_do_escopo'
    | 'aguardando_documento'
    | 'bloqueada'
    | 'resolvida'
    | 'cancelada';
  opcoes?: string[];
  decisao_usuario?: string | null;
  comentario_usuario?: string | null;
  created_by_agent?: string | null;
  created_at?: string;
  resolved_at?: string | null;
};

export type PropostaStatus = 'rascunho' | 'enviada' | 'aceita' | 'recusada' | 'expirada';

export type Proposta = {
  id: string;
  opportunity_id: string | null;
  orcamento_id: string | null;
  titulo: string;
  cliente_nome_snapshot: string | null;
  status: PropostaStatus;
  validade_dias: number | null;
  valor_total: number | null;
  bdi: number | null;
  payload: Record<string, unknown> | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityStatus =
  | 'novo'
  | 'qualificando'
  | 'aguardando_documentos'
  | 'em_orcamento'
  | 'proposta_enviada'
  | 'negociacao'
  | 'ganha'
  | 'perdida'
  | 'arquivada';

export type OpportunityPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type Contact = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  documento: string | null;
  tipo: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type Opportunity = {
  id: string;
  titulo: string;
  status: OpportunityStatus;
  contact_id: string | null;
  origem: string | null;
  prioridade: OpportunityPriority;
  cliente_nome_snapshot: string | null;
  telefone_snapshot: string | null;
  email_snapshot: string | null;
  endereco_resumo: string | null;
  tipo_obra: string | null;
  metragem_estimada: number | null;
  valor_estimado: number | null;
  observacao: string | null;
  orcamentista_workspace_id: string | null;
  orcamento_id: string | null;
  proposta_id: string | null;
  obra_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OpportunityEvent = {
  id: string;
  opportunity_id: string;
  tipo: string;
  descricao: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type OpportunityFile = {
  id: string;
  opportunity_id: string;
  nome: string;
  url: string | null;
  storage_path: string | null;
  categoria: string | null;
  mime_type: string | null;
  tamanho_bytes: number | null;
  created_at: string;
};

// ── Fase 2A: Pipeline IA mockado ──────────────────────────────────────────────

export type OrcamentistaAgentStatus = 'idle' | 'em_execucao' | 'concluido' | 'aguardando_hitl' | 'erro';

export type OrcamentistaAgentDefinition = {
  id: string;
  nome: string;
  disciplina: string;
  descricao: string;
  status: OrcamentistaAgentStatus;
  exigeHitl: boolean;
  podeGerarItens: boolean;
  podeBloquearConsolidacao: boolean;
  outputSchema: string;
};

export type OrcamentistaPipelineStepStatus =
  | 'pendente'
  | 'em_execucao'
  | 'concluido'
  | 'aguardando_hitl'
  | 'bloqueado'
  | 'erro';

export type OrcamentistaPipelineStep = {
  id: string;
  nome: string;
  descricao: string;
  status: OrcamentistaPipelineStepStatus;
  progresso: number;
  agentes: string[];
};

export type OrcamentistaPreviewService = {
  codigo?: string;
  descricao: string;
  unidade: string;
  quantidade_estimada: number;
  custo_estimado: number;
  categoria?: string;
  confianca: number;
  origem: 'preview_ia_mock';
  observacoes?: string;
};

export type OrcamentistaPreviewRisk = {
  id: string;
  descricao: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  impacto: string;
  disciplina?: string;
};

export type OrcamentistaPreviewHitl = {
  id: string;
  titulo: string;
  motivo: string;
  disciplina?: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  status: 'pendente';
};

export type OrcamentistaAiPreview = {
  servicos_sugeridos: OrcamentistaPreviewService[];
  quantitativos_estimados: string;
  custos_estimados: number;
  riscos: OrcamentistaPreviewRisk[];
  pendencias_hitl: OrcamentistaPreviewHitl[];
  premissas: string[];
  exclusoes: string[];
  confianca: number;
  origem: 'preview_ia_mock';
  aviso: string;
};

// ── Fase 2B: PDF Reader + Verification Contract ──────────────────────────────

export type OrcamentistaDocument = {
  file_id: string;
  file_name: string;
  total_pages: number;
  uploaded_at: string;
  status: 'pending' | 'processing' | 'processed' | 'error';
};

export type OrcamentistaPageType =
  | 'PLANTA_BAIXA'
  | 'CORTE'
  | 'FACHADA'
  | 'DETALHE'
  | 'MEMORIAL'
  | 'ESPECIFICACAO'
  | 'QUANTITATIVO'
  | 'DESCONHECIDO';

export type OrcamentistaEvidenceType =
  | 'TEXT_EXPLICIT'
  | 'TABLE_ROW'
  | 'DRAWING_ANNOTATION'
  | 'DRAWING_MEASUREMENT'
  | 'INFERRED_FROM_CONTEXT';

export type OrcamentistaPageRender = {
  file_id: string;
  page_number: number;
  image_url: string; // Caminho determinístico da imagem gerada
  width: number;
  height: number;
};

export type OrcamentistaPageTextExtraction = {
  file_id: string;
  page_number: number;
  raw_text: string;
  extracted_at: string;
};

export type OrcamentistaPageClassification = {
  file_id: string;
  page_number: number;
  page_type: OrcamentistaPageType;
  discipline: string; // Ex: ARQUITETURA, ESTRUTURA, ELETRICA
  confidence: number;
};

export type OrcamentistaExtractedItem = {
  element: string;
  quantity?: string;
  evidence_type: OrcamentistaEvidenceType;
  source_reference: string;
};

export type OrcamentistaInferredItem = {
  element: string;
  reasoning: string;
};

export type OrcamentistaPrimaryPageReading = {
  file_id: string;
  page_number: number;
  classification: OrcamentistaPageClassification;
  identified_items: OrcamentistaExtractedItem[];
  inferred_items: OrcamentistaInferredItem[];
  missing_information: string[];
  reading_confidence: number;
};

export type OrcamentistaReadingDisagreement = {
  field: string;
  primary_value: string | object;
  verifier_value: string | object;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
};

export type OrcamentistaReaderVerificationResult = {
  file_id: string;
  page_number: number;
  agreement_score: number;
  disagreements: OrcamentistaReadingDisagreement[];
  requires_reanalysis: boolean;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
};

export type OrcamentistaVerifiedPageReading = {
  primary_reading: OrcamentistaPrimaryPageReading;
  verification_result: OrcamentistaReaderVerificationResult;
  final_status: 'APPROVED' | 'HITL_REQUIRED' | 'REJECTED';
};

export type OrcamentistaReaderDispatchTarget = {
  file_id: string;
  page_number: number;
  target_agent_id: string;
  discipline: string;
  dispatch_reason: string;
};

export type OrcamentistaReaderGateStatus =
  | 'CLASSIFIED'
  | 'PRIMARY_READ'
  | 'VERIFIED'
  | 'DISPATCHED_TO_SPECIALIST'
  | 'HITL_REQUIRED';

// ── Fase 2C: Document Intake + Inventário mockado ───────────────────────────

export type OrcamentistaDocumentUploadStatus =
  | 'registered'
  | 'received'
  | 'partial'
  | 'failed';

export type OrcamentistaDocumentProcessingStatus =
  | 'not_started'
  | 'inventory_mocked'
  | 'reader_pending'
  | 'verification_pending'
  | 'hitl_required'
  | 'blocked'
  | 'ready_for_future_analysis';

export type OrcamentistaDocumentReadinessStatus =
  | 'not_ready'
  | 'partial_inventory'
  | 'ready_for_reader'
  | 'requires_verification'
  | 'requires_hitl'
  | 'blocked';

export type OrcamentistaDocumentInventoryPageStatus =
  | 'INVENTORY_ONLY'
  | 'READER_PENDING'
  | 'VERIFIER_PENDING'
  | 'HITL_REQUIRED'
  | 'BLOCKED'
  | 'READY_FOR_READER';

export type OrcamentistaDocumentDisciplineSummary = {
  discipline: string;
  detected: boolean;
  pages_count: number;
  confidence: number;
  status: 'detected' | 'missing' | 'partial';
};

export type OrcamentistaDocumentInventoryPage = {
  page_number: number;
  page_label: string;
  page_type: OrcamentistaPageType;
  discipline: string;
  confidence: number;
  status: OrcamentistaDocumentInventoryPageStatus;
  requires_reader: boolean;
  requires_verifier: boolean;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
};

export type OrcamentistaDocumentInventory = {
  id: string;
  document_id: string;
  opportunity_id: string;
  orcamento_id: string | null;
  total_pages: number;
  detected_disciplines: OrcamentistaDocumentDisciplineSummary[];
  missing_disciplines: string[];
  pages: OrcamentistaDocumentInventoryPage[];
  readiness_status: OrcamentistaDocumentReadinessStatus;
  initial_risk: 'baixo' | 'medio' | 'alto' | 'critico';
  risk_notes: string[];
  created_at: string;
  updated_at: string;
};

export type OrcamentistaDocumentIntakeFile = {
  id: string;
  opportunity_id: string;
  orcamento_id: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  source: 'opportunity_files_readonly' | 'mock_local' | 'manual_registry_mock';
  upload_status: OrcamentistaDocumentUploadStatus;
  processing_status: OrcamentistaDocumentProcessingStatus;
  total_pages: number;
  detected_disciplines: OrcamentistaDocumentDisciplineSummary[];
  missing_disciplines: string[];
  readiness_status: OrcamentistaDocumentReadinessStatus;
  inventory: OrcamentistaDocumentInventory;
  created_at: string;
  updated_at: string;
};

// ── Fase 2D: Page Rendering / Processing Contract ───────────────────────────

export type OrcamentistaPageProcessingStatus = 
  | 'PENDING'
  | 'RENDERING_IMAGE'
  | 'EXTRACTING_TEXT'
  | 'COMPLETED'
  | 'FAILED'
  | 'BLOCKED';

export type OrcamentistaPageProcessingError = {
  code: string;
  message: string;
  details?: string;
  severity: 'warning' | 'error' | 'critical';
};

export type OrcamentistaPageReadinessForReader = 
  | 'READY'
  | 'READY_WITH_WARNINGS'
  | 'REQUIRES_OCR'
  | 'BLOCKED';

export type OrcamentistaPageImageAsset = {
  asset_type: 'image/png' | 'image/jpeg' | 'image/webp';
  storage_ref: string;
  mime_type: string;
  size_bytes: number;
  checksum?: string;
  generated_by: string;
  generated_at: string;
};

export type OrcamentistaPageTextAsset = {
  asset_type: 'text/plain' | 'text/markdown' | 'application/json';
  storage_ref: string;
  mime_type: string;
  size_bytes: number;
  checksum?: string;
  generated_by: string;
  generated_at: string;
};

export type OrcamentistaRenderedPage = {
  id: string;
  document_id: string;
  file_id: string;
  page_number: number;
  page_label: string;
  render_status: OrcamentistaPageProcessingStatus;
  image_ref?: OrcamentistaPageImageAsset;
  thumbnail_ref?: OrcamentistaPageImageAsset;
  text_ref?: OrcamentistaPageTextAsset;
  has_text_layer: boolean;
  is_scanned: boolean;
  width?: number;
  height?: number;
  dpi?: number;
  processing_confidence: number;
  ready_for_reader: OrcamentistaPageReadinessForReader;
  requires_ocr_future: boolean;
  errors?: OrcamentistaPageProcessingError[];
  created_at: string;
};

export type OrcamentistaPageProcessingSummary = {
  total_pages: number;
  processed_pages: number;
  failed_pages: number;
  ready_for_reader: number;
  requires_ocr: number;
  blocked_pages: number;
};

export type OrcamentistaPageProcessingJob = {
  id: string;
  document_id: string;
  opportunity_id: string;
  orcamento_id: string | null;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';
  total_pages: number;
  processed_pages: number;
  failed_pages: number;
  started_at?: string;
  finished_at?: string;
  errors?: OrcamentistaPageProcessingError[];
  summary?: OrcamentistaPageProcessingSummary;
};

// ── Fase 2E: Reader/Verifier UI Contract ───────────────────────────────────

export type OrcamentistaReaderEvidenceStatus =
  | 'IDENTIFIED'
  | 'INFERRED'
  | 'PENDING';

export type OrcamentistaReaderEvidenceItem = {
  id: string;
  label: string;
  description: string;
  quantity?: string;
  evidence_type: OrcamentistaEvidenceType;
  evidence_status: OrcamentistaReaderEvidenceStatus;
  source_reference: string;
  confidence_score: number;
};

export type OrcamentistaReaderInferredItem = {
  id: string;
  element: string;
  reasoning: string;
  source_references: string[];
  confidence_score: number;
  can_be_treated_as_fact: false;
};

export type OrcamentistaReaderMissingInfo = {
  id: string;
  description: string;
  impact: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggested_action: string;
};

export type OrcamentistaReaderRun = {
  id: string;
  rendered_page_id: string;
  document_id: string;
  document_name: string;
  page_number: number;
  page_label: string;
  page_type: OrcamentistaPageType;
  discipline: string;
  identified_items: OrcamentistaReaderEvidenceItem[];
  inferred_items: OrcamentistaReaderInferredItem[];
  missing_information: OrcamentistaReaderMissingInfo[];
  confidence_score: number;
  evidence_items: OrcamentistaReaderEvidenceItem[];
  source_references: string[];
  requires_hitl: boolean;
  blocks_consolidation: boolean;
};

export type OrcamentistaVerifierDisagreement = {
  id: string;
  field: string;
  reader_value: string;
  verifier_value: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  target_agents: string[];
};

export type OrcamentistaVerifierRun = {
  id: string;
  reader_run_id: string;
  agreement_score: number;
  verification_status:
    | 'APPROVED'
    | 'APPROVED_WITH_WARNINGS'
    | 'HITL_REQUIRED'
    | 'REANALYSIS_REQUIRED'
    | 'BLOCKED';
  disagreement_points: OrcamentistaVerifierDisagreement[];
  confirmed_items: string[];
  disputed_items: string[];
  omitted_possible_items: string[];
  requires_reanalysis: boolean;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  verifier_notes: string[];
};

export type OrcamentistaReaderDispatchDecision = {
  reader_run_id: string;
  verifier_run_id: string;
  target_agents: string[];
  allowed_to_dispatch: boolean;
  dispatch_status:
    | 'not_started'
    | 'ready_for_future_dispatch'
    | 'requires_hitl'
    | 'blocked'
    | 'dispatched_mock';
  dispatch_reason: string;
  blocked_reason?: string;
};

export type OrcamentistaReaderVerifierSummary = {
  id: string;
  reader_run: OrcamentistaReaderRun;
  verifier_run: OrcamentistaVerifierRun;
  dispatch_decision: OrcamentistaReaderDispatchDecision;
};

// ── Fase 2F: HITL visual especifico do Orçamentista ─────────────────────────

export type OrcamentistaHitlIssueSeverity = 'baixa' | 'media' | 'alta' | 'critica';

export type OrcamentistaHitlIssueStatus =
  | 'pendente'
  | 'em_revisao'
  | 'aprovada_com_ressalva'
  | 'bloqueada'
  | 'documento_solicitado'
  | 'convertida_em_verba'
  | 'ignorada_nesta_fase'
  | 'reanalisar_futuramente';

export type OrcamentistaHitlDecisionType =
  | 'aprovar_com_ressalva'
  | 'manter_bloqueado'
  | 'solicitar_documento'
  | 'marcar_como_verba'
  | 'ignorar_nesta_fase'
  | 'reanalisar_futuramente';

export type OrcamentistaHitlIssue = {
  id: string;
  source_type:
    | 'reader_verifier'
    | 'document_inventory'
    | 'page_processing'
    | 'agent_preview'
    | 'costing'
    | 'discipline_gap';
  source_id: string;
  document_id?: string;
  document_name?: string;
  page_number?: number;
  agent_id?: string;
  issue_type:
    | 'divergencia_reader_verifier'
    | 'risco_tecnico'
    | 'quantidade_inferida'
    | 'disciplina_ausente'
    | 'custo_sem_fonte'
    | 'documento_pendente'
    | 'ppci_pendente';
  severity: OrcamentistaHitlIssueSeverity;
  title: string;
  description: string;
  evidence_summary: string;
  recommended_action: string;
  status: OrcamentistaHitlIssueStatus;
  decision_type?: OrcamentistaHitlDecisionType;
  decided_by?: string;
  decided_at?: string;
  blocks_consolidation: boolean;
  blocks_dispatch: boolean;
};

export type OrcamentistaHitlDecision = {
  issue_id: string;
  decision_type: OrcamentistaHitlDecisionType;
  decided_by: string;
  decided_at: string;
  notes: string;
};

export type OrcamentistaHitlResolution = {
  issue: OrcamentistaHitlIssue;
  decision: OrcamentistaHitlDecision;
  dispatch_released: boolean;
  consolidation_released: boolean;
};

export type OrcamentistaHitlQueueSummary = {
  total_issues: number;
  pending_issues: number;
  critical_issues: number;
  high_issues: number;
  blocking_dispatch: number;
  blocking_consolidation: number;
  resolved_issues: number;
};

// ── Fase 2G: Dispatch mockado para agentes especialistas ────────────────────

export type OrcamentistaAgentDispatchStatus =
  | 'waiting'
  | 'released'
  | 'blocked'
  | 'running_mock'
  | 'completed';

export type OrcamentistaAgentOutputStatus =
  | 'not_started'
  | 'completed'
  | 'completed_with_warnings'
  | 'blocked'
  | 'waiting_dependencies';

export type OrcamentistaAgentDispatchBlocker = {
  id: string;
  reason: string;
  severity: OrcamentistaHitlIssueSeverity;
  source_type:
    | 'page_processing'
    | 'reader_verifier'
    | 'hitl'
    | 'dependency'
    | 'discipline_gap';
  source_id: string;
  blocks_dispatch: boolean;
  blocks_preview: boolean;
  blocks_consolidation: boolean;
};

export type OrcamentistaAgentDispatchInput = {
  source_page_ids: string[];
  source_reader_run_ids: string[];
  source_hitl_issue_ids: string[];
  source_references: string[];
  evidence_summary: string;
  constraints: string[];
};

export type OrcamentistaDomainAgentFinding = {
  id: string;
  title: string;
  description: string;
  discipline: string;
  source_references: string[];
  confidence_score: number;
};

export type OrcamentistaDomainAgentSuggestedService = {
  id: string;
  description: string;
  unit: string;
  quantity_basis: string;
  confidence_score: number;
  source_references: string[];
  is_official: false;
};

export type OrcamentistaDomainAgentRisk = {
  id: string;
  description: string;
  severity: OrcamentistaHitlIssueSeverity;
  impact: string;
  blocks_preview: boolean;
  blocks_consolidation: boolean;
};

export type OrcamentistaDomainAgentHitlRequest = {
  id: string;
  title: string;
  reason: string;
  severity: OrcamentistaHitlIssueSeverity;
  source_references: string[];
};

export type OrcamentistaDomainAgentOutput = {
  id: string;
  dispatch_job_id: string;
  agent_id: string;
  status: OrcamentistaAgentOutputStatus;
  confidence_score: number;
  findings: OrcamentistaDomainAgentFinding[];
  suggested_services: OrcamentistaDomainAgentSuggestedService[];
  risks: OrcamentistaDomainAgentRisk[];
  hitl_requests: OrcamentistaDomainAgentHitlRequest[];
  missing_information: string[];
  blocks_preview: boolean;
  blocks_consolidation: boolean;
  source_references: string[];
};

export type OrcamentistaAgentDispatchJob = {
  id: string;
  agent_id: string;
  agent_name: string;
  discipline: string;
  status: OrcamentistaAgentDispatchStatus;
  source_page_ids: string[];
  source_reader_run_ids: string[];
  source_hitl_issue_ids: string[];
  allowed_to_run: boolean;
  blockers: OrcamentistaAgentDispatchBlocker[];
  input_summary: OrcamentistaAgentDispatchInput;
  started_at?: string;
  finished_at?: string;
  output?: OrcamentistaDomainAgentOutput;
};

export type OrcamentistaAgentDispatchSummary = {
  total_agents: number;
  released_agents: number;
  blocked_agents: number;
  completed_agents: number;
  waiting_agents: number;
  hitl_pending_agents: number;
  preview_blocked_agents: number;
  consolidation_blocked_agents: number;
};

// ── Fase 2H: Preview Consolidado Mockado ────────────────────────────────────

export type OrcamentistaConsolidatedPreviewStatus =
  | 'draft'
  | 'blocked'
  | 'ready_for_validation'
  | 'validated'
  | 'consolidated';

export type OrcamentistaConsolidatedPreviewHitl = {
  id: string;
  source_hitl_request_id: string;
  source_agent_id?: string;
  title: string;
  reason: string;
  severity: OrcamentistaHitlIssueSeverity;
  source_references: string[];
};

export type OrcamentistaConsolidatedPreviewRisk = {
  id: string;
  source_risk_id: string;
  source_agent_id?: string;
  description: string;
  severity: OrcamentistaHitlIssueSeverity;
  impact: string;
  blocks_consolidation: boolean;
};

export type OrcamentistaConsolidatedPreviewService = {
  id: string;
  category: string;
  discipline: string;
  description: string;
  unit: string;
  estimated_quantity: number;
  quantity_confidence: number;
  estimated_unit_cost: number;
  estimated_total: number;
  cost_confidence: number;
  source_agent_ids: string[];
  source_page_refs: string[];
  source_evidence_refs: string[];
  identification_type: 'identified' | 'inferred' | 'manual_assumption';
  requires_hitl: boolean;
  blocks_consolidation: boolean;
};

export type OrcamentistaPreviewConsolidationBlocker = {
  id: string;
  reason: string;
  severity: OrcamentistaHitlIssueSeverity;
  source_type: 'risk' | 'hitl' | 'agent_output' | 'validation';
  source_id: string;
};

export type OrcamentistaConsolidatedPreviewPremise = {
  id: string;
  description: string;
  source_agent_ids: string[];
};

export type OrcamentistaConsolidatedPreviewExclusion = {
  id: string;
  description: string;
  source_agent_ids: string[];
};

export type OrcamentistaConsolidatedPreviewSummary = {
  total_services: number;
  total_estimated_value: number;
  average_confidence: number;
  traceability_score: number;
  total_risks: number;
  total_hitls: number;
  total_blockers: number;
};

export type OrcamentistaConsolidatedPreview = {
  id: string;
  opportunity_id: string;
  orcamento_id: string | null;
  status: OrcamentistaConsolidatedPreviewStatus;
  generated_from_agent_output_ids: string[];
  services: OrcamentistaConsolidatedPreviewService[];
  risks: OrcamentistaConsolidatedPreviewRisk[];
  hitls: OrcamentistaConsolidatedPreviewHitl[];
  premises: OrcamentistaConsolidatedPreviewPremise[];
  exclusions: OrcamentistaConsolidatedPreviewExclusion[];
  blockers: OrcamentistaPreviewConsolidationBlocker[];
  confidence_score: number;
  traceability_score: number;
  can_consolidate: boolean;
  consolidation_blocked_reason?: string;
  summary: OrcamentistaConsolidatedPreviewSummary;
  generated_at: string;
};

// ── Fase 2I: Gate de Consolidação Mockado ──────────────────────────────────

export type OrcamentistaConsolidationGateStatus =
  | 'blocked'
  | 'pending_hitl'
  | 'payload_simulated'
  | 'ready_for_future_review';

export type OrcamentistaConsolidationCandidateItem = {
  id: string;
  preview_service_id: string;
  description: string;
  category: string;
  discipline: string;
  unit: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  origin: 'consolidated_preview_mock';
  codigo?: string;
  identification_type: OrcamentistaConsolidatedPreviewService['identification_type'];
  source_agent_ids: string[];
  source_page_refs: string[];
  source_evidence_refs: string[];
  quantity_confidence: number;
  cost_confidence: number;
  confidence_score: number;
  traceability_score: number;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
};

export type OrcamentistaConsolidationPayloadItem = {
  id: string;
  preview_service_id: string;
  descricao: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  origem: 'consolidated_preview_mock';
  codigo?: string;
  source_agent_ids: string[];
  source_page_refs: string[];
  source_evidence_refs: string[];
  confidence_score: number;
  traceability_score: number;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  simulated_only: true;
};

export type OrcamentistaConsolidationValidationIssue = {
  id: string;
  candidate_item_id?: string;
  source_service_id: string;
  code:
    | 'requires_hitl'
    | 'blocks_consolidation'
    | 'missing_source_agent_ids'
    | 'missing_source_page_refs'
    | 'missing_source_evidence_refs'
    | 'low_quantity_confidence'
    | 'low_cost_confidence'
    | 'inferred_without_validation'
    | 'manual_assumption_without_validation';
  severity: OrcamentistaHitlIssueSeverity;
  field: string;
  message: string;
  blocks_payload: boolean;
  blocks_consolidation: boolean;
  required_action: string;
};

export type OrcamentistaConsolidationBlockedItem = {
  id: string;
  candidate_item_id: string;
  preview_service_id: string;
  description: string;
  reason: string;
  severity: OrcamentistaHitlIssueSeverity;
  missing_fields: string[];
  required_action: string;
  validation_issues: OrcamentistaConsolidationValidationIssue[];
};

export type OrcamentistaConsolidationPendingHitlItem = {
  id: string;
  candidate_item_id: string;
  preview_service_id: string;
  description: string;
  reason: string;
  severity: OrcamentistaHitlIssueSeverity;
  required_human_action: string;
  validation_issues: OrcamentistaConsolidationValidationIssue[];
};

export type OrcamentistaConsolidationGateSummary = {
  total_candidates: number;
  approved_count: number;
  blocked_count: number;
  pending_hitl_count: number;
  simulated_payload_count: number;
  total_simulated_value: number;
  critical_issues: number;
  can_write_to_budget: boolean;
  write_blocked_reason: string;
};

export type OrcamentistaConsolidationGate = {
  id: string;
  preview_id: string;
  opportunity_id: string;
  orcamento_id: string | null;
  status: OrcamentistaConsolidationGateStatus;
  approved_items: OrcamentistaConsolidationCandidateItem[];
  blocked_items: OrcamentistaConsolidationBlockedItem[];
  pending_hitl_items: OrcamentistaConsolidationPendingHitlItem[];
  simulated_payload: OrcamentistaConsolidationPayloadItem[];
  validation_issues: OrcamentistaConsolidationValidationIssue[];
  can_write_to_budget: boolean;
  write_blocked_reason: string;
  summary: OrcamentistaConsolidationGateSummary;
  generated_at: string;
};

// ── Fase 2J: Revisao humana do payload simulado ────────────────────────────

export type OrcamentistaPayloadReviewStatus =
  | 'not_started'
  | 'in_review'
  | 'partially_reviewed'
  | 'blocked'
  | 'ready_for_future_write';

export type OrcamentistaPayloadReviewItemStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'edited'
  | 'blocked'
  | 'validation_requested';

export type OrcamentistaPayloadReviewDecisionType =
  | 'approve'
  | 'reject'
  | 'edit'
  | 'keep_pending'
  | 'request_validation';

export type OrcamentistaPayloadReviewEditPatch = Partial<
  Pick<
    OrcamentistaConsolidationPayloadItem,
    'descricao' | 'categoria' | 'unidade' | 'quantidade' | 'valor_unitario' | 'codigo'
  >
>;

export type OrcamentistaPayloadReviewDecision = {
  item_id: string;
  decision_type: OrcamentistaPayloadReviewDecisionType;
  reason: string;
  edit_patch?: OrcamentistaPayloadReviewEditPatch;
  decided_at: string;
};

export type OrcamentistaPayloadReviewItem = {
  id: string;
  payload_item_id: string;
  original_payload: OrcamentistaConsolidationPayloadItem;
  edited_payload?: OrcamentistaConsolidationPayloadItem;
  status: OrcamentistaPayloadReviewItemStatus;
  decision_type?: OrcamentistaPayloadReviewDecisionType;
  decision_reason?: string;
  requires_traceability: boolean;
  has_required_traceability: boolean;
  requires_hitl_resolution: boolean;
  blocks_write: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
};

export type OrcamentistaPayloadReviewSummary = {
  total_items: number;
  approved_count: number;
  edited_count: number;
  rejected_count: number;
  pending_count: number;
  blocked_count: number;
  validation_requested_count: number;
  total_original_value: number;
  total_reviewed_value: number;
  can_write_to_budget: boolean;
  write_blocked_reason: string;
};

export type OrcamentistaPayloadReviewSession = {
  id: string;
  consolidation_gate_id: string;
  opportunity_id: string;
  orcamento_id: string | null;
  status: OrcamentistaPayloadReviewStatus;
  items: OrcamentistaPayloadReviewItem[];
  summary: OrcamentistaPayloadReviewSummary;
  can_write_to_budget: boolean;
  write_blocked_reason: string;
  created_at: string;
  updated_at: string;
};

// ── Fase 3A: Motor Selection & Reader Safety Policy ────────────────────────

export type OrcamentistaAiMotorId =
  | 'gpt_5_5'
  | 'gemini_3_1'
  | 'claude';

export type OrcamentistaAiMotorRole =
  | 'primary_reader'
  | 'conservative_verifier'
  | 'final_auditor'
  | 'qualitative_reviewer'
  | 'specialist_support'
  | 'safety_checker';

export type OrcamentistaMotorCostProfile = 'baixo' | 'medio' | 'alto';

export type OrcamentistaMotorRiskProfile = 'baixo' | 'medio' | 'alto' | 'critico';

export type OrcamentistaMotorCapability = {
  id: OrcamentistaAiMotorId;
  name: string;
  role: OrcamentistaAiMotorRole[];
  recommended_for: string[];
  not_recommended_for: string[];
  strengths: string[];
  weaknesses: string[];
  cost_profile: OrcamentistaMotorCostProfile;
  risk_profile: OrcamentistaMotorRiskProfile;
};

export type OrcamentistaMotorSelectionPolicy = {
  id: string;
  version: string;
  default_by_role: Partial<Record<OrcamentistaAiMotorRole, OrcamentistaAiMotorId>>;
  motors: OrcamentistaMotorCapability[];
  critical_dimension_policy: string[];
  cost_benefit_policy: string[];
  generated_at: string;
};

export type OrcamentistaReadingSourceQuality =
  | 'vector_pdf_clear'
  | 'vector_pdf_mixed'
  | 'raster_pdf_clear'
  | 'raster_pdf_low_resolution'
  | 'compressed_image'
  | 'readable_table'
  | 'illegible_table'
  | 'unknown';

export type OrcamentistaReaderSafetyRule = {
  id: string;
  name: string;
  applies_to: string[];
  source_quality: OrcamentistaReadingSourceQuality[];
  max_confidence_allowed: number;
  requires_verifier: boolean;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  reason: string;
};

export type OrcamentistaCriticalDimensionType =
  | 'pile_depth'
  | 'pile_diameter'
  | 'pile_quantity'
  | 'pile_volume'
  | 'slab_area'
  | 'steel_quantity'
  | 'concrete_volume'
  | 'critical_level'
  | 'foundation_dimension'
  | 'decimal_ambiguity';

export type OrcamentistaDimensionalSanityCheck = {
  id: string;
  dimension_type: OrcamentistaCriticalDimensionType;
  value: number;
  unit: string;
  expected_min: number;
  expected_max: number;
  severity: OrcamentistaHitlIssueSeverity;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  message: string;
  source_text?: string;
  normalized_value?: number;
  ambiguity_candidates?: number[];
};

export type OrcamentistaSafetyGateResult = {
  id: string;
  source_quality: OrcamentistaReadingSourceQuality;
  applied_rule_ids: string[];
  max_confidence_allowed: number;
  requires_verifier: boolean;
  requires_hitl: boolean;
  blocks_consolidation: boolean;
  messages: string[];
};

export type OrcamentistaCriticalReadingPolicy = {
  id: string;
  dimension_type: OrcamentistaCriticalDimensionType;
  requires_dual_motor: boolean;
  requires_deterministic_check: boolean;
  requires_hitl: boolean;
  blocks_if_ambiguous: boolean;
  notes: string;
};
