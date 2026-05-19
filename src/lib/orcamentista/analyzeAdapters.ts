import type { AnalyzeData } from '../../hooks/useAnalyzeOpportunity';
import type {
  OrcamentistaAiPreview,
  OrcamentistaPreviewService,
  OrcamentistaPreviewRisk,
  OrcamentistaPreviewHitl,
  OrcamentistaPipelineStep,
  OrcamentistaHitlIssue,
  OrcamentistaHitlIssueSeverity,
} from '../../types';

// ──────────────────────────────────────────────
// analyzeAdapters — Sprint Wire-up Noturno
//
// Funções puras que adaptam o shape REAL retornado pelo backend
// (`AnalyzeData` via POST /api/orcamentista/opportunities/:id/analyze)
// para os shapes esperados pelos painéis visuais que originalmente
// consumiam mocks (`OrcamentistaAiPreview`, pipeline steps, HITL issues).
//
// Princípios:
// - Honestos: quando não há dado real, retorna vazio com `origem: 'preview_ia_real'`
//   ao invés de fabricar.
// - Sem fabricar quantidade/preço — preserva o que veio do backend.
// - Severidades inferidas conservadoramente.
// ──────────────────────────────────────────────

const DEFAULT_PREMISSAS_REAIS: string[] = [
  'Análise baseada exclusivamente no conteúdo dos arquivos enviados pela oportunidade.',
  'Nenhuma quantidade ou preço foi inferido na ausência de evidência textual.',
  'IA backend opera em modo conservador — itens só aparecem com base extraída.',
];

const DEFAULT_PREMISSAS_VAZIAS: string[] = [
  'Nenhum arquivo foi analisado ainda nesta oportunidade.',
  'Use o botão "Analisar arquivos selecionados" acima para gerar dados reais.',
];

const DEFAULT_EXCLUSOES: string[] = [
  'Itens que não tenham evidência textual nos arquivos.',
  'Estimativas fabricadas sem fonte documental.',
];

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function inferSeverityFromPendencia(text: string): OrcamentistaHitlIssueSeverity {
  const lower = text.toLowerCase();
  if (lower.includes('crítica') || lower.includes('critica') || lower.includes('bloqueia')) {
    return 'critica';
  }
  if (lower.includes('alta') || lower.includes('importante') || lower.includes('necessári')) {
    return 'alta';
  }
  if (lower.includes('média') || lower.includes('media') || lower.includes('considerar')) {
    return 'media';
  }
  return 'baixa';
}

function inferDisciplinaFromText(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('estrutur') || lower.includes('fundaç')) return 'estrutural';
  if (lower.includes('elétric') || lower.includes('eletric')) return 'eletrica';
  if (lower.includes('hidr') || lower.includes('águ') || lower.includes('agua')) return 'hidrossanitario';
  if (lower.includes('ppci') || lower.includes('incêndi') || lower.includes('incendio')) return 'ppci';
  if (lower.includes('acabament') || lower.includes('revestiment')) return 'acabamentos';
  if (lower.includes('civil') || lower.includes('arquitet')) return 'civil';
  return undefined;
}

// ──────────────────────────────────────────────
// Adaptador: AnalyzeData → OrcamentistaAiPreview
//
// Preenche a estrutura esperada pelo OrcamentistaAiPreviewPanel
// usando dados REAIS do backend quando disponíveis.
//
// Observações:
// - O type-literal `origem: 'preview_ia_mock'` é mantido por
//   compatibilidade — o aviso e o conteúdo deixam claro que é real.
// - Quando IA não está conectada, mostra mensagem honesta.
// ──────────────────────────────────────────────
export function analyzeDataToAiPreview(data: AnalyzeData | null): OrcamentistaAiPreview {
  if (!data) {
    return {
      origem: 'preview_ia_mock',
      aviso: 'PRÉVIA NÃO GERADA — Selecione arquivos e clique em "Analisar" acima para popular este painel com dados reais.',
      confianca: 0,
      quantitativos_estimados: 'Sem análise executada.',
      custos_estimados: 0,
      premissas: DEFAULT_PREMISSAS_VAZIAS,
      exclusoes: DEFAULT_EXCLUSOES,
      servicos_sugeridos: [],
      riscos: [],
      pendencias_hitl: [],
    };
  }

  const servicos_sugeridos: OrcamentistaPreviewService[] = data.items.map((item) => ({
    codigo: item.codigo ?? undefined,
    descricao: item.descricao,
    unidade: item.unidade,
    quantidade_estimada: item.quantidade,
    custo_estimado: item.valor_total,
    categoria: item.categoria ?? undefined,
    confianca: item.confianca ?? 0,
    origem: 'preview_ia_mock', // type-locked; aviso esclarece a origem real
    observacoes: item.observacoes ?? undefined,
  }));

  const riscos: OrcamentistaPreviewRisk[] = data.warnings.map((warning, idx) => ({
    id: `warning-${idx}`,
    descricao: warning,
    severidade: inferSeverityFromPendencia(warning),
    impacto: 'Avaliar impacto no escopo durante revisão HITL.',
    disciplina: inferDisciplinaFromText(warning),
  }));

  const pendencias_hitl: OrcamentistaPreviewHitl[] = data.pendencias_hitl.map((pendencia, idx) => ({
    id: `pendencia-${idx}`,
    titulo: pendencia.length > 80 ? `${pendencia.slice(0, 77)}...` : pendencia,
    motivo: pendencia,
    disciplina: inferDisciplinaFromText(pendencia),
    severidade: inferSeverityFromPendencia(pendencia),
    status: 'pendente',
  }));

  const custoTotalReal = data.items.reduce((acc, item) => acc + item.valor_total, 0);

  const previewSourceLabel =
    data.preview_source === 'ai_extracted'
      ? 'IA backend analisou o conteúdo dos arquivos reais.'
      : data.preview_source === 'file_text_extracted'
      ? 'Texto extraído localmente dos arquivos — IA ainda não conectada.'
      : data.preview_source === 'file_access_only'
      ? 'Apenas acesso aos arquivos confirmado — sem extração de texto.'
      : 'Apenas metadados dos arquivos — IA backend não conectada.';

  const aviso =
    data.preview_source === 'ai_extracted'
      ? 'PRÉVIA IA REAL — Dados extraídos pelo backend de IA. Ainda assim, requer validação HITL antes de ir ao orçamento oficial.'
      : `PRÉVIA HONESTA — ${previewSourceLabel} Nenhum item foi fabricado.`;

  const confiancaMedia =
    servicos_sugeridos.length > 0
      ? servicos_sugeridos.reduce((acc, s) => acc + s.confianca, 0) / servicos_sugeridos.length
      : 0;

  return {
    origem: 'preview_ia_mock',
    aviso,
    confianca: confiancaMedia,
    quantitativos_estimados:
      data.items.length > 0
        ? `${data.items.length} item(ns) candidato(s) extraído(s) com base nas evidências dos arquivos.`
        : 'Nenhum quantitativo extraído automaticamente — análise não fabricou itens.',
    custos_estimados: custoTotalReal,
    premissas: DEFAULT_PREMISSAS_REAIS,
    exclusoes: DEFAULT_EXCLUSOES,
    servicos_sugeridos,
    riscos,
    pendencias_hitl,
  };
}

// ──────────────────────────────────────────────
// Adaptador: AnalyzeData → OrcamentistaPipelineStep[]
//
// Deriva o pipeline visual a partir do estado do analyze.
// Mantém os mesmos 10 step ids do mock para compatibilidade visual,
// mas atualiza status/progresso conforme o que aconteceu de verdade.
// ──────────────────────────────────────────────
export function analyzeDataToPipelineSteps(data: AnalyzeData | null): OrcamentistaPipelineStep[] {
  const hasFiles = (data?.source_files.length ?? 0) > 0;
  const hasEvidences = (data?.evidences.length ?? 0) > 0;
  const hasItems = (data?.items.length ?? 0) > 0;
  const hasPendencias = (data?.pendencias_hitl.length ?? 0) > 0;
  const aiExtracted = data?.preview_source === 'ai_extracted';

  return [
    {
      id: 'briefing_inventario',
      nome: 'Briefing e Inventário',
      descricao: 'Coleta de contexto da oportunidade e inventário dos arquivos disponíveis.',
      status: hasFiles ? 'concluido' : 'pendente',
      progresso: hasFiles ? 100 : 0,
      agentes: ['reader_multimodal', 'classificador_documentos'],
    },
    {
      id: 'leitura_macro_projeto',
      nome: 'Leitura Macro do Projeto',
      descricao: 'Extração de dados macro a partir dos arquivos analisados.',
      status: hasEvidences ? 'concluido' : hasFiles ? 'em_execucao' : 'pendente',
      progresso: hasEvidences ? 100 : hasFiles ? 40 : 0,
      agentes: ['reader_multimodal'],
    },
    {
      id: 'planejamento_tecnico',
      nome: 'Planejamento Técnico',
      descricao: 'Definição das disciplinas e roteiro de execução.',
      status: hasEvidences ? 'concluido' : 'pendente',
      progresso: hasEvidences ? 100 : 0,
      agentes: ['planner_tecnico'],
    },
    {
      id: 'agentes_dominio',
      nome: 'Agentes de Domínio',
      descricao: 'Execução paralela dos agentes técnicos por disciplina.',
      status: aiExtracted ? 'concluido' : data ? 'aguardando_hitl' : 'pendente',
      progresso: aiExtracted ? 100 : data ? 30 : 0,
      agentes: [
        'civil_arquitetonico',
        'estrutural',
        'eletrica_dados_automacao',
        'hidrossanitario',
        'impermeabilizacao',
        'ppci_incendio',
        'acabamentos',
      ],
    },
    {
      id: 'quantitativos',
      nome: 'Quantitativos',
      descricao: 'Consolidação e normalização de quantitativos.',
      status: hasItems ? 'concluido' : 'pendente',
      progresso: hasItems ? 100 : 0,
      agentes: ['quantitativo'],
    },
    {
      id: 'composicao_custos',
      nome: 'Composição de Custos',
      descricao: 'Aplicação de preços de referência e cálculo de custos.',
      status: hasItems ? 'em_execucao' : 'pendente',
      progresso: hasItems ? 60 : 0,
      agentes: ['custos'],
    },
    {
      id: 'auditoria_cruzada',
      nome: 'Auditoria Cruzada',
      descricao: 'Verificação de consistência entre disciplinas.',
      status: 'pendente',
      progresso: 0,
      agentes: ['auditor'],
    },
    {
      id: 'hitl',
      nome: 'Revisão HITL',
      descricao: 'Validação humana obrigatória dos pontos críticos.',
      status: hasPendencias ? 'em_execucao' : data ? 'concluido' : 'pendente',
      progresso: hasPendencias ? 50 : data ? 100 : 0,
      agentes: ['hitl_review'],
    },
    {
      id: 'preview_orcamento',
      nome: 'Prévia do Orçamento',
      descricao: 'Geração da prévia consolidada para revisão humana.',
      status: hasItems ? 'concluido' : 'pendente',
      progresso: hasItems ? 100 : 0,
      agentes: ['consolidador_preview'],
    },
    {
      id: 'pronto_para_consolidacao',
      nome: 'Pronto para Consolidação',
      descricao: 'Prévia validada e pronta para consolidação manual.',
      status: data?.safety.canWriteConsolidationToBudget ? 'concluido' : 'bloqueado',
      progresso: 0,
      agentes: [],
    },
  ];
}

// ──────────────────────────────────────────────
// Adaptador: AnalyzeData.pendencias_hitl → OrcamentistaHitlIssue[]
//
// Converte as pendências (strings simples) do backend para o shape
// rico esperado pelo OrcamentistaHitlPanel. Os IDs são derivados
// determinísticamente para que decisões locais não se misturem
// entre re-renders.
// ──────────────────────────────────────────────
export function analyzeDataToHitlIssues(data: AnalyzeData | null): OrcamentistaHitlIssue[] {
  if (!data) return [];

  return data.pendencias_hitl.map((pendencia, idx) => {
    const severity = inferSeverityFromPendencia(pendencia);
    const discipline = inferDisciplinaFromText(pendencia);
    const isBlocking = severity === 'critica' || severity === 'alta';

    return {
      id: `analyze-${data.snapshot.id}-pendencia-${idx}`,
      source_type: 'agent_preview',
      source_id: data.snapshot.id,
      agent_id: discipline ? `agente_${discipline}` : undefined,
      issue_type: discipline === 'ppci' ? 'ppci_pendente' : 'risco_tecnico',
      severity,
      title: pendencia.length > 80 ? `${pendencia.slice(0, 77)}...` : pendencia,
      description: pendencia,
      evidence_summary: `Pendência identificada na análise dos arquivos. Snapshot ${data.snapshot.id}.`,
      recommended_action:
        severity === 'critica'
          ? 'Bloquear avanço até resolução documental.'
          : severity === 'alta'
          ? 'Solicitar evidência adicional antes da consolidação.'
          : 'Registrar premissa e seguir com ressalva.',
      status: 'pendente',
      blocks_consolidation: isBlocking,
      blocks_dispatch: severity === 'critica',
    };
  });
}
