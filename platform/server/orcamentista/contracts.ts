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

// As etapas posteriores (Quantitativos, Composição) serão movidas 
// gradativamente para código determinístico (TypeScript puro) 
// e deixarão de ser "Outputs" diretos de LLMs.
