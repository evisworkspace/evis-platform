import {
  OrcamentistaAgentDispatchBlocker,
  OrcamentistaAgentDispatchInput,
  OrcamentistaAgentDispatchJob,
  OrcamentistaDomainAgentOutput,
  OrcamentistaHitlIssueSeverity,
} from '../../types';
import { getAgent } from './agentRegistry';
import { mockOrcamentistaHitlIssues } from './hitlMock';

const mockNow = '2026-05-05T12:00:00.000Z';

function agentName(agentId: string) {
  return getAgent(agentId)?.nome ?? agentId;
}

function agentDiscipline(agentId: string) {
  return getAgent(agentId)?.disciplina ?? 'nao_classificado';
}

function hitlIdsForAgent(agentId: string) {
  return mockOrcamentistaHitlIssues
    .filter((issue) => issue.agent_id === agentId)
    .map((issue) => issue.id);
}

function buildBlocker({
  id,
  reason,
  severity,
  sourceType,
  sourceId,
  blocksDispatch = true,
  blocksPreview = false,
  blocksConsolidation = true,
}: {
  id: string;
  reason: string;
  severity: OrcamentistaHitlIssueSeverity;
  sourceType: OrcamentistaAgentDispatchBlocker['source_type'];
  sourceId: string;
  blocksDispatch?: boolean;
  blocksPreview?: boolean;
  blocksConsolidation?: boolean;
}): OrcamentistaAgentDispatchBlocker {
  return {
    id,
    reason,
    severity,
    source_type: sourceType,
    source_id: sourceId,
    blocks_dispatch: blocksDispatch,
    blocks_preview: blocksPreview,
    blocks_consolidation: blocksConsolidation,
  };
}

function inputSummary(input: Partial<OrcamentistaAgentDispatchInput>): OrcamentistaAgentDispatchInput {
  return {
    source_page_ids: input.source_page_ids ?? [],
    source_reader_run_ids: input.source_reader_run_ids ?? [],
    source_hitl_issue_ids: input.source_hitl_issue_ids ?? [],
    source_references: input.source_references ?? [],
    evidence_summary: input.evidence_summary ?? 'Entrada mockada sem evidencia liberada suficiente.',
    constraints: [
      'Output de agente e previa tecnica.',
      'Nenhum servico sugerido e item oficial.',
      ...(input.constraints ?? []),
    ],
  };
}

function buildOutput(output: OrcamentistaDomainAgentOutput): OrcamentistaDomainAgentOutput {
  return output;
}

function buildJob({
  id,
  agentId,
  status,
  sourcePageIds,
  sourceReaderRunIds,
  input,
  blockers = [],
  output,
  startedAt,
  finishedAt,
}: {
  id: string;
  agentId: string;
  status: OrcamentistaAgentDispatchJob['status'];
  sourcePageIds: string[];
  sourceReaderRunIds: string[];
  input: OrcamentistaAgentDispatchInput;
  blockers?: OrcamentistaAgentDispatchBlocker[];
  output?: OrcamentistaDomainAgentOutput;
  startedAt?: string;
  finishedAt?: string;
}): OrcamentistaAgentDispatchJob {
  const sourceHitlIssueIds = input.source_hitl_issue_ids;

  return {
    id,
    agent_id: agentId,
    agent_name: agentName(agentId),
    discipline: agentDiscipline(agentId),
    status,
    source_page_ids: sourcePageIds,
    source_reader_run_ids: sourceReaderRunIds,
    source_hitl_issue_ids: sourceHitlIssueIds,
    allowed_to_run: blockers.every((blocker) => !blocker.blocks_dispatch) && status !== 'blocked',
    blockers,
    input_summary: input,
    started_at: startedAt,
    finished_at: finishedAt,
    output,
  };
}

export const mockAgentDispatchJobs: OrcamentistaAgentDispatchJob[] = [
  buildJob({
    id: 'dispatch-civil-001',
    agentId: 'civil_arquitetonico',
    status: 'completed',
    sourcePageIds: ['rendered-page-md03'],
    sourceReaderRunIds: ['reader-memorial-001'],
    input: inputSummary({
      source_page_ids: ['rendered-page-md03'],
      source_reader_run_ids: ['reader-memorial-001'],
      source_hitl_issue_ids: [],
      source_references: ['Memorial Descritivo.pdf · MD-03 · pisos e acabamentos'],
      evidence_summary:
        'Memorial confirma porcelanato em areas sociais; quantitativo permanece dependente de cruzamento futuro.',
      constraints: ['Acabamento identificado nao pode virar quantitativo oficial sem area validada.'],
    }),
    startedAt: mockNow,
    finishedAt: mockNow,
    output: buildOutput({
      id: 'output-civil-001',
      dispatch_job_id: 'dispatch-civil-001',
      agent_id: 'civil_arquitetonico',
      status: 'completed',
      confidence_score: 0.86,
      findings: [
        {
          id: 'finding-civil-piso-001',
          title: 'Acabamento civil identificado',
          description: 'Memorial indica porcelanato 90x90 em sala e circulacao.',
          discipline: 'civil',
          source_references: ['Memorial Descritivo.pdf · MD-03'],
          confidence_score: 0.88,
        },
      ],
      suggested_services: [
        {
          id: 'svc-civil-piso-001',
          description: 'Assentamento de porcelanato 90x90',
          unit: 'm2',
          quantity_basis: 'Escopo tecnico identificado; quantidade nao oficial e dependente de area validada.',
          confidence_score: 0.8,
          source_references: ['Memorial Descritivo.pdf · MD-03'],
          is_official: false,
        },
      ],
      risks: [],
      hitl_requests: [],
      missing_information: ['Area de aplicacao ainda depende de cruzamento com planta baixa.'],
      blocks_preview: false,
      blocks_consolidation: true,
      source_references: ['Memorial Descritivo.pdf · MD-03'],
    }),
  }),
  buildJob({
    id: 'dispatch-eletrica-001',
    agentId: 'eletrica_dados_automacao',
    status: 'completed',
    sourcePageIds: ['rendered-page-e01'],
    sourceReaderRunIds: ['reader-elec-001'],
    input: inputSummary({
      source_page_ids: ['rendered-page-e01'],
      source_reader_run_ids: ['reader-elec-001'],
      source_hitl_issue_ids: [],
      source_references: ['Planta Elétrica.pdf · E-01', 'Planta Elétrica.pdf · E-04'],
      evidence_summary:
        'Reader/Verifier liberou pontos eletricos e QD-01 com alta concordancia; metragem segue inferida.',
      constraints: ['Metragem de eletrodutos nao pode virar quantidade oficial.'],
    }),
    startedAt: mockNow,
    finishedAt: mockNow,
    output: buildOutput({
      id: 'output-eletrica-001',
      dispatch_job_id: 'dispatch-eletrica-001',
      agent_id: 'eletrica_dados_automacao',
      status: 'completed_with_warnings',
      confidence_score: 0.82,
      findings: [
        {
          id: 'finding-elec-pontos-001',
          title: 'Pontos eletricos identificados',
          description: 'Quadro de pontos indica tomadas TUG e QD-01.',
          discipline: 'eletrica',
          source_references: ['Planta Elétrica.pdf · E-01'],
          confidence_score: 0.9,
        },
      ],
      suggested_services: [
        {
          id: 'svc-elec-tomadas-001',
          description: 'Instalacao de pontos de tomada',
          unit: 'ponto',
          quantity_basis: '18 pontos identificados pelo Reader, ainda nao oficiais.',
          confidence_score: 0.78,
          source_references: ['Planta Elétrica.pdf · E-01'],
          is_official: false,
        },
      ],
      risks: [
        {
          id: 'risk-elec-metragem-001',
          description: 'Metragem de eletrodutos inferida sem rota validada.',
          severity: 'media',
          impact: 'Pode alterar quantitativo e custo futuro.',
          blocks_preview: false,
          blocks_consolidation: true,
        },
      ],
      hitl_requests: [
        {
          id: 'hitl-request-elec-cargas-001',
          title: 'Validar demanda eletrica',
          reason: 'Tabela de cargas nao informa demanda total consolidada.',
          severity: 'media',
          source_references: ['Planta Elétrica.pdf · E-04'],
        },
      ],
      missing_information: ['Demanda total consolidada e rotas de eletrodutos.'],
      blocks_preview: false,
      blocks_consolidation: true,
      source_references: ['Planta Elétrica.pdf · E-01', 'Planta Elétrica.pdf · E-04'],
    }),
  }),
  buildJob({
    id: 'dispatch-estrutural-001',
    agentId: 'estrutural',
    status: 'blocked',
    sourcePageIds: ['rendered-page-a03'],
    sourceReaderRunIds: ['reader-arch-001'],
    input: inputSummary({
      source_page_ids: ['rendered-page-a03'],
      source_reader_run_ids: ['reader-arch-001'],
      source_hitl_issue_ids: hitlIdsForAgent('estrutural'),
      source_references: ['Projeto Arquitetônico.pdf · A-03 · marca DEM-01'],
      evidence_summary: 'Demolicao indicada, mas interferencia estrutural nao foi descartada.',
      constraints: ['Divergencia critica permanece bloqueada ate decisao humana.'],
    }),
    blockers: [
      buildBlocker({
        id: 'blocker-estrutural-hitl-demolicao',
        reason: 'HITL critico: demolicao sem validacao estrutural.',
        severity: 'critica',
        sourceType: 'hitl',
        sourceId: 'hitl-arch-demolicao-001',
        blocksPreview: true,
      }),
      buildBlocker({
        id: 'blocker-estrutural-disciplina-ausente',
        reason: 'Projeto estrutural ausente no inventario mockado.',
        severity: 'alta',
        sourceType: 'discipline_gap',
        sourceId: 'hitl-disciplina-estrutura-001',
        blocksPreview: true,
      }),
    ],
  }),
  buildJob({
    id: 'dispatch-hidrossanitario-001',
    agentId: 'hidrossanitario',
    status: 'released',
    sourcePageIds: [],
    sourceReaderRunIds: [],
    input: inputSummary({
      evidence_summary:
        'Agente cadastrado para fase futura; nenhum documento hidrossanitario foi identificado neste mock.',
      constraints: ['Execucao futura depende de documento ou evidencia compativel.'],
    }),
    blockers: [
      buildBlocker({
        id: 'blocker-hidro-sem-fonte',
        reason: 'Sem pagina/fonte relacionada; liberado apenas como slot tecnico futuro.',
        severity: 'baixa',
        sourceType: 'dependency',
        sourceId: 'future-hidrossanitario-source',
        blocksDispatch: false,
        blocksPreview: false,
        blocksConsolidation: false,
      }),
    ],
  }),
  buildJob({
    id: 'dispatch-ppci-001',
    agentId: 'ppci_incendio',
    status: 'blocked',
    sourcePageIds: [],
    sourceReaderRunIds: [],
    input: inputSummary({
      source_hitl_issue_ids: hitlIdsForAgent('ppci_incendio'),
      source_references: ['Inventario mockado · disciplina PPCI ausente'],
      evidence_summary: 'PPCI nao foi recebido nem classificado no inventario documental.',
      constraints: ['Disciplina obrigatoria ausente bloqueia dispatch e consolidacao relacionada.'],
    }),
    blockers: [
      buildBlocker({
        id: 'blocker-ppci-disciplina-ausente',
        reason: 'PPCI pendente por disciplina ausente.',
        severity: 'critica',
        sourceType: 'discipline_gap',
        sourceId: 'hitl-ppci-pendente-001',
        blocksPreview: true,
      }),
    ],
  }),
  buildJob({
    id: 'dispatch-acabamentos-001',
    agentId: 'acabamentos',
    status: 'completed',
    sourcePageIds: ['rendered-page-md03'],
    sourceReaderRunIds: ['reader-memorial-001'],
    input: inputSummary({
      source_page_ids: ['rendered-page-md03'],
      source_reader_run_ids: ['reader-memorial-001'],
      source_references: ['Memorial Descritivo.pdf · MD-03'],
      evidence_summary: 'Memorial liberado para analise de acabamentos como previa tecnica.',
      constraints: ['Rodape permanece inferido e nao e fato.'],
    }),
    startedAt: mockNow,
    finishedAt: mockNow,
    output: buildOutput({
      id: 'output-acabamentos-001',
      dispatch_job_id: 'dispatch-acabamentos-001',
      agent_id: 'acabamentos',
      status: 'completed',
      confidence_score: 0.84,
      findings: [
        {
          id: 'finding-acab-porcelanato-001',
          title: 'Porcelanato especificado',
          description: 'Especificacao de porcelanato 90x90 confirmada em memorial.',
          discipline: 'acabamentos',
          source_references: ['Memorial Descritivo.pdf · MD-03'],
          confidence_score: 0.88,
        },
      ],
      suggested_services: [
        {
          id: 'svc-acab-rodape-001',
          description: 'Rodape compativel com piso especificado',
          unit: 'm',
          quantity_basis: 'Inferido; deve permanecer premissa ate validacao.',
          confidence_score: 0.61,
          source_references: ['Memorial Descritivo.pdf · MD-03'],
          is_official: false,
        },
      ],
      risks: [
        {
          id: 'risk-acab-rodape-inferido',
          description: 'Rodape inferido sem especificacao explicita.',
          severity: 'media',
          impact: 'Pode ser removido do escopo em revisao humana.',
          blocks_preview: false,
          blocks_consolidation: true,
        },
      ],
      hitl_requests: [],
      missing_information: ['Area e perimetro de aplicacao.'],
      blocks_preview: false,
      blocks_consolidation: true,
      source_references: ['Memorial Descritivo.pdf · MD-03'],
    }),
  }),
  buildJob({
    id: 'dispatch-compatibilizacao-001',
    agentId: 'compatibilizacao_tecnica',
    status: 'blocked',
    sourcePageIds: ['rendered-page-a03'],
    sourceReaderRunIds: ['reader-arch-001'],
    input: inputSummary({
      source_page_ids: ['rendered-page-a03'],
      source_reader_run_ids: ['reader-arch-001'],
      source_hitl_issue_ids: hitlIdsForAgent('compatibilizacao_tecnica'),
      source_references: ['Projeto Arquitetônico.pdf · A-03'],
      evidence_summary: 'Compatibilizacao precisa revisar divergencia de demolicao, mas HITL ainda bloqueia.',
    }),
    blockers: [
      buildBlocker({
        id: 'blocker-compat-reader-agreement',
        reason: 'Baixa concordancia Reader/Verifier em pagina critica.',
        severity: 'alta',
        sourceType: 'reader_verifier',
        sourceId: 'hitl-reader-agreement-001',
        blocksPreview: true,
      }),
    ],
  }),
  buildJob({
    id: 'dispatch-quantitativo-001',
    agentId: 'quantitativo',
    status: 'waiting',
    sourcePageIds: ['rendered-page-e01', 'rendered-page-md03'],
    sourceReaderRunIds: ['reader-elec-001', 'reader-memorial-001'],
    input: inputSummary({
      source_page_ids: ['rendered-page-e01', 'rendered-page-md03'],
      source_reader_run_ids: ['reader-elec-001', 'reader-memorial-001'],
      source_hitl_issue_ids: hitlIdsForAgent('quantitativo'),
      source_references: ['Planta Elétrica.pdf · E-01', 'Memorial Descritivo.pdf · MD-03'],
      evidence_summary: 'Aguardando outputs de dominio antes de consolidar quantitativos mockados.',
      constraints: ['Quantidade inferida sem origem suficiente permanece bloqueando consolidacao.'],
    }),
    blockers: [
      buildBlocker({
        id: 'blocker-quant-dependencias-dominio',
        reason: 'Aguardando conclusao/validacao dos agentes de dominio e desbloqueio estrutural.',
        severity: 'alta',
        sourceType: 'dependency',
        sourceId: 'dispatch-estrutural-001',
        blocksDispatch: true,
        blocksPreview: true,
      }),
    ],
  }),
  buildJob({
    id: 'dispatch-custos-001',
    agentId: 'custos',
    status: 'waiting',
    sourcePageIds: [],
    sourceReaderRunIds: [],
    input: inputSummary({
      source_hitl_issue_ids: hitlIdsForAgent('custos'),
      source_references: ['Dependencia mockada · quantitativo'],
      evidence_summary: 'Agente de custos aguarda quantitativos normalizados e fontes de preco.',
      constraints: ['Custos sem fonte nao podem alimentar preview consolidado confiavel.'],
    }),
    blockers: [
      buildBlocker({
        id: 'blocker-custos-quantitativos',
        reason: 'Aguardando agente quantitativo.',
        severity: 'alta',
        sourceType: 'dependency',
        sourceId: 'dispatch-quantitativo-001',
        blocksPreview: true,
      }),
      buildBlocker({
        id: 'blocker-custos-fonte',
        reason: 'HITL: custo sem fonte verificavel.',
        severity: 'media',
        sourceType: 'hitl',
        sourceId: 'hitl-custo-fonte-001',
        blocksDispatch: false,
        blocksPreview: false,
      }),
    ],
  }),
  buildJob({
    id: 'dispatch-auditor-001',
    agentId: 'auditor',
    status: 'waiting',
    sourcePageIds: [],
    sourceReaderRunIds: [],
    input: inputSummary({
      source_references: ['Dependencia mockada · todos os agentes'],
      evidence_summary: 'Auditoria tecnica aguarda todos os agentes especialistas e custos.',
      constraints: ['Auditoria nao pode iniciar com agentes bloqueados.'],
    }),
    blockers: [
      buildBlocker({
        id: 'blocker-auditor-todos-agentes',
        reason: 'Aguardando conclusao de agentes de dominio, quantitativo e custos.',
        severity: 'alta',
        sourceType: 'dependency',
        sourceId: 'dispatch-all-domain-agents',
        blocksPreview: true,
      }),
    ],
  }),
];
