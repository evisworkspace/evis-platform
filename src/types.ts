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
