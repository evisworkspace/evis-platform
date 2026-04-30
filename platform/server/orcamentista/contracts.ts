/**
 * CONTRATOS DE DOMÍNIO - EVIS HYBRID ENGINE
 * Define as fronteiras rígidas entre os agentes especialistas.
 */

// ─── ETAPA 0 (Fundação - Extração Factual e Grounding) ───────────────────────
export interface Etapa0Schema {
  revisao_registry_id: string; // Vínculo com a versão do documento (Context Cache)
  documentos: Array<{
    nome: string;
    tipo: string;
    hash_conteudo: string;
  }>;
  disciplinas: string[];
  ambientes: Array<{
    nome: string;
    metragem_estimada?: number;
    padrao_acabamento?: string;
  }>;
  areas: Array<{
    tipo: 'terreno' | 'construida' | 'permeavel' | 'outra';
    valor_m2: number;
  }>;
  materiais: Array<{
    categoria: string;
    especificacao: string;
  }>;
  sistemas: string[]; // ex: "ar condicionado vrf", "aquecimento solar"
  lacunas: string[]; 
  conflitos: Array<{
    descricao: string;
    severidade: 'baixa' | 'media' | 'alta';
    impacto_financeiro_estimado: boolean;
  }>;
  alertas: Array<{
    mensagem: string;
    tipo: 'tecnico' | 'normativo' | 'economico';
  }>;
  evidencias: Array<{
    dado_extraido: string;
    fonte_referencia: string; // Citação direta da página/documento
  }>;
  pendencias_hitl: string[]; // Perguntas diretas que o orçamentista humano deve responder antes de destravar a Etapa 1
}

// ─── CONTRATOS LEGADOS DO MOTOR MULTIAGENTE ──────────────────────────────────
// Mantidos para compatibilidade com os agentes Reader/Planner/Quantitativos
// enquanto as etapas posteriores migram para código determinístico.
export interface ReaderOutput {
  revisao_registry_id: string;
  documentos: Array<{
    nome: string;
    tipo: 'arquitetonico' | 'estrutural' | 'sondagem' | 'outros' | string;
    revisao?: string;
    hash_conteudo: string;
    achados_criticos?: string[];
  }>;
  contexto_geral: {
    fck_previsto?: string;
    n_spt_max?: number;
    area_total?: number;
  };
}

export interface PlannerOutput {
  roteiro: Array<{
    id: number;
    etapa: string;
    agente_responsavel: string;
    dependencias: number[];
    hitl_obrigatorio: boolean;
  }>;
  prioridade_geotecnica: boolean;
}

export interface QuantitativosOutput {
  itens: Array<{
    codigo_nm: string;
    equipe_id: string;
    descricao: string;
    unidade: string;
    quantidade: number;
    formula_aplicada: string;
    origem: 'CALCULADO' | 'EXTRAIDO' | string;
    evidencia: {
      documento: string;
      pagina_ou_detalhe: string;
      timestamp_extracao: string;
      confianca: number;
    };
  }>;
  confianca_geral: number;
}

// As etapas posteriores (Quantitativos, Composição) serão movidas 
// gradativamente para código determinístico (TypeScript puro) 
// e deixarão de ser "Outputs" diretos de LLMs.
