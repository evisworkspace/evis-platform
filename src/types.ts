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
  | { id: string, [key: string]: unknown };

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
  obra_id: string;
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
