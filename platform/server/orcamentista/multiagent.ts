import { StateManager } from './stateManager';
import { Etapa0Schema } from './contracts';

// ─── Tipos exportados para compatibilidade com workspaces.ts ──────────────────

export interface OrcamentistaAttachment {
  nome: string;
  mimeType: string;
  base64?: string;
  tamanhoBytes?: number;
}

export interface QuantitativoCandidato {
  codigo_nm: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  origem: 'EXTRAIDO' | 'CALCULADO' | 'INFERIDO' | 'ESTIMADO';
  confianca: number;
  fonte_documental?: string;
}

export interface ComposicaoCustoCandidata {
  codigo_nm: string;
  descricao: string;
  custo_unitario: number;
  unidade: string;
  fonte: string;
  pendencias_consulta: string[];
}

export interface SpecialistConflict {
  tipo: string;
  descricao: string;
  disciplinas_afetadas: string[];
  severidade: 'BLOQUEANTE' | 'ALERTA' | 'INFORMATIVO';
}

export interface MultiAgentAnalysis {
  status: string;
  scoreConsistencia: number;
  etapa0?: Etapa0Schema;
  markdown?: string;
  [key: string]: any;
}

// ─── ORQUESTRADOR PRINCIPAL ───────────────────────────────────────────────────

export async function runMultiAgentProjectAnalysis(input: {
  mensagem: string;
  anexos: any[];
  workspaceId: string;
  onProgress: (msg: string) => void;
}): Promise<MultiAgentAnalysis> {

  const state = new StateManager(
    input.workspaceId,
    process.env.ORCAMENTOS_ROOT || 'domains/orcamentista/vault'
  );

  try {
    // 1. REGISTRY — Preparação do Cockpit (Grounding / Cache Reuse no futuro)
    input.onProgress('🔄 EVIS Engine: Iniciando Cockpit da Obra...');
    state.saveFragment('registry', {
      timestamp: new Date().toISOString(),
      files: input.anexos.map((a: any) => a.nome),
    });

    // Removidas as chamadas fakes do Planner e Quantitativos (Entrega 1 - Desmame).
    // O sistema agora aguarda a execução da Etapa 0 via Contrato Rigoroso.
    
    input.onProgress('⏸️ Sistema em Pausa (HITL): Aguardando Extração Factual da ETAPA 0...');

    return {
      status: 'AGUARDANDO_ETAPA_0',
      scoreConsistencia: 0, // Removido o score fake
      markdown: `**Modo Cockpit Ativado.**\nO motor automático foi desligado para garantir **Honestidade Operacional**.\n\nPróximo passo: Extrair a **ETAPA 0** baseada no novo Contrato (Schema).`,
    };

  } catch (err) {
    console.error('[MultiAgent] Erro na orquestração:', err);
    throw err;
  }
}
