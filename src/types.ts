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
  legenda: string;
  data_foto: string;
};

export type AppState = {
  servicos: Servico[];
  pendencias: Pendencia[];
  presenca: Record<string, string[]>; // dia -> [cod_equipe]
  diario: Record<string, any>; // dia -> { texto, iaResult, confirmado, ts }
  narrativas: Record<string, string>; // dia -> texto da narrativa
  notas: Nota[];
  fotos: Foto[];
  equipes: Equipe[];
  currentDay: string;
  pendingChanges: { table: string, data: any, ts: number }[];
};

export type Config = {
  url: string;
  key: string;
  obraId: string;
  gemini: string;
  model: string;
  imgbbKey: string;
};
