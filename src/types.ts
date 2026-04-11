export type Servico = {
  id?: string;
  id_servico: string;
  nome: string;
  categoria: string;
  avanco_atual: number;
  status_atual: string;
  data_inicio?: string;
  data_fim?: string;
  equipe?: string;
  unidade?: string;
  quantidade?: number;
  valor_unitario?: number;
  valor_total?: number;
  obra_id?: string;
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
  especialidade?: string;
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
    status_novo: 'nao_iniciado' | 'em_andamento' | 'concluido';
    data_inicio?: string | null;
    data_fim?: string | null;
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

export type PendingChangeData = 
  | Servico 
  | Pendencia 
  | Equipe 
  | Nota 
  | Foto 
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
  currentDay: string;
  pendingChanges: PendingChange[];
};

export type Config = {
  url: string;
  key: string;
  obraId: string;
  gemini: string;
  model: string;
  imgbbKey: string;
};
