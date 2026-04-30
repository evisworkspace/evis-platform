import { Etapa0Schema } from './contracts';

// ─── 1. ESTADO GLOBAL DO GRAFO (O "Sangue" do Sistema) ────────────────────────
export type OrcamentistaState = {
  workspaceId: string;
  obraId?: string;

  status:
    | "AGUARDANDO_ETAPA_0"
    | "PREPARANDO_FONTES"
    | "EXTRAINDO_ETAPA_0"
    | "ETAPA_0_EXTRAIDA"
    | "ETAPA_0_EM_REVISAO_HITL"
    | "ETAPA_0_APROVADA"
    | "ERRO_ETAPA_0";

  fontes: {
    uploadedFiles: Array<{
      id: string;
      nome: string;
      mimeType: string;
      sizeBytes?: number;
      sha256?: string;
    }>;
    cacheRefs?: Array<{
      provider: "vertex";
      cacheName: string;
      expiresAt?: string;
      fileIds: string[];
    }>;
  };

  etapa0?: Etapa0Schema;

  diagnostico?: {
    warnings: string[];
    errors: string[];
    tokensInputEstimated?: number;
    providerUsed?: "gemini" | "claude" | "openai" | "none";
    modelUsed?: string;
  };

  hitl?: {
    required: boolean;
    motivo?: string;
    approvedBy?: string;
    approvedAt?: string;
    pendingFields?: string[];
  };
};

// ─── 2. NÓS DO GRAFO (A Linha de Montagem) ────────────────────────────────────

/**
 * NÓ 1: Prepara o contexto de documentos.
 * Substitui o envio cego de Base64 pela criação de um Context Cache no Vertex AI.
 */
async function prepareSourcesNode(state: OrcamentistaState): Promise<Partial<OrcamentistaState>> {
  console.log('[LangGraph] Node: prepare_sources - Iniciando cache de contexto...');
  
  // Aqui implementaremos a lógica real do Vertex AI Context Cache.
  // Ele recebe os arquivos, gera o cache remoto (válido por 60min) e devolve a referência.
  
  return {
    status: "EXTRAINDO_ETAPA_0",
    fontes: {
      ...state.fontes,
      cacheRefs: [
        {
          provider: "vertex",
          cacheName: "projects/evis-ai/locations/us-central1/cachedContents/mock-cache-id",
          fileIds: state.fontes.uploadedFiles.map(f => f.id),
        },
      ],
    },
  };
}

/**
 * NÓ 2: A extração rigorosa.
 * O modelo é forçado a cuspir um JSON exato (Structured Output). Nenhuma palavra fora do Schema.
 */
async function extractEtapa0Node(state: OrcamentistaState): Promise<Partial<OrcamentistaState>> {
  console.log('[LangGraph] Node: extract_etapa0 - Consumindo cache e extraindo JSON...');
  
  // TODO: Implementar chamada ao LLM forçando Structured Output (Tool Calling/JSON Schema)
  // O prompt usará APENAS o `state.fontes.cacheRefs[0].cacheName` como contexto.
  // Nenhum skill, planner ou especialista extra é concatenado aqui.
  
  // Mock temporário simulando a resposta rígida
  const mockEtapa0: Etapa0Schema = {
    revisao_registry_id: "rev-01",
    documentos: [],
    disciplinas: ["Arquitetura", "Estrutura"],
    ambientes: [],
    areas: [],
    materiais: [],
    sistemas: [],
    lacunas: ["Falta detalhamento das esquadrias no memorial."],
    conflitos: [],
    alertas: [],
    evidencias: [],
    pendencias_hitl: ["Definir FCK final: Memorial diz 30MPa, Projeto diz 35MPa."],
  };

  return {
    status: "ETAPA_0_EXTRAIDA",
    etapa0: mockEtapa0,
    hitl: {
      required: true,
      pendingFields: mockEtapa0.pendencias_hitl || [],
    },
  };
}

/**
 * NÓ 3: Validação de Contrato (Código Determinístico, não IA)
 * Garante que o LLM não enviou lixo. Se enviou, barra a esteira.
 */
function validateEtapa0Node(state: OrcamentistaState): Partial<OrcamentistaState> {
  console.log('[LangGraph] Node: validate_etapa0 - Checando qualidade da extração...');
  
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!state.etapa0) errors.push("ETAPA 0 ausente. LLM falhou em gerar o JSON.");
  if ((state.etapa0?.documentos?.length ?? 0) === 0) {
    errors.push("Nenhum documento foi inventariado pelo modelo.");
  }
  if ((state.etapa0?.evidencias?.length ?? 0) === 0) {
    warnings.push("Extração gerada sem evidências rastreáveis (baixa confiabilidade).");
  }

  const temErro = errors.length > 0;

  return {
    status: temErro ? "ERRO_ETAPA_0" : "ETAPA_0_EM_REVISAO_HITL",
    diagnostico: { 
      ...state.diagnostico,
      errors, 
      warnings 
    },
    hitl: {
      required: true,
      pendingFields: state.etapa0?.pendencias_hitl || [],
    },
  };
}

/**
 * NÓ 4: O Freio de Mão (Human-In-The-Loop)
 * O LangGraph suspende a execução (Durable Execution) e aguarda input da UI.
 */
function humanReviewInterruptNode(state: OrcamentistaState): Partial<OrcamentistaState> {
  console.log('[LangGraph] Node: human_review_interrupt - Pausando esteira para aprovação humana.');
  
  // Lança o interrupt oficial do LangGraph
  // O processo "dorme", o backend é liberado, e o sistema só retoma quando a UI 
  // enviar o comando de "resume" com os dados validados/corrigidos pelo orçamentista.
  /*
  return interrupt({
    type: "ETAPA_0_REVIEW",
    workspaceId: state.workspaceId,
    etapa0: state.etapa0,
    diagnostico: state.diagnostico,
    pendingFields: state.hitl?.pendingFields ?? [],
  });
  */
  
  return { status: "ETAPA_0_EM_REVISAO_HITL" };
}

// ─── 3. CONSTRUÇÃO DO GRAFO ───────────────────────────────────────────────────

export function buildEtapa0Graph() {
  return {
    async invoke(initialState: OrcamentistaState): Promise<OrcamentistaState> {
      const afterPrepare = { ...initialState, ...(await prepareSourcesNode(initialState)) };
      const afterExtract = { ...afterPrepare, ...(await extractEtapa0Node(afterPrepare)) };
      const afterValidate = { ...afterExtract, ...validateEtapa0Node(afterExtract) };
      return { ...afterValidate, ...humanReviewInterruptNode(afterValidate) };
    },
  };
}
