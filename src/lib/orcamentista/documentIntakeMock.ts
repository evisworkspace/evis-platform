import {
  OpportunityFile,
  OrcamentistaDocumentDisciplineSummary,
  OrcamentistaDocumentIntakeFile,
  OrcamentistaDocumentInventoryPage,
  OrcamentistaDocumentProcessingStatus,
  OrcamentistaDocumentUploadStatus,
} from '../../types';
import { getReadinessStatus, ORCAMENTISTA_EXPECTED_DISCIPLINES } from './documentInventory';

type MockDocumentTemplate = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadStatus: OrcamentistaDocumentUploadStatus;
  processingStatus: OrcamentistaDocumentProcessingStatus;
  totalPages: number;
  pages: OrcamentistaDocumentInventoryPage[];
  initialRisk: 'baixo' | 'medio' | 'alto' | 'critico';
  riskNotes: string[];
};

const MOCK_TIMESTAMP = '2026-05-05T12:00:00.000Z';

const mockTemplates: MockDocumentTemplate[] = [
  {
    id: 'doc-intake-arq',
    fileName: 'Projeto Arquitetônico.pdf',
    fileType: 'application/pdf',
    fileSize: 18_450_000,
    uploadStatus: 'received',
    processingStatus: 'inventory_mocked',
    totalPages: 6,
    initialRisk: 'medio',
    riskNotes: [
      'Inventário simulado encontrou páginas arquitetônicas, mas uma prancha exige HITL por baixa confiança.',
      'Arquivo recebido ainda não foi lido por Reader nem verificado por Verifier.',
    ],
    pages: [
      {
        page_number: 1,
        page_label: 'A-01 Planta térreo',
        page_type: 'PLANTA_BAIXA',
        discipline: 'ARQUITETURA',
        confidence: 0.96,
        status: 'READER_PENDING',
        requires_reader: true,
        requires_verifier: false,
        requires_hitl: false,
        blocks_consolidation: false,
      },
      {
        page_number: 2,
        page_label: 'A-02 Planta superior',
        page_type: 'PLANTA_BAIXA',
        discipline: 'ARQUITETURA',
        confidence: 0.94,
        status: 'READER_PENDING',
        requires_reader: true,
        requires_verifier: false,
        requires_hitl: false,
        blocks_consolidation: false,
      },
      {
        page_number: 3,
        page_label: 'A-03 Cortes AA/BB',
        page_type: 'CORTE',
        discipline: 'ARQUITETURA',
        confidence: 0.88,
        status: 'VERIFIER_PENDING',
        requires_reader: true,
        requires_verifier: true,
        requires_hitl: false,
        blocks_consolidation: false,
      },
      {
        page_number: 4,
        page_label: 'A-04 Fachadas',
        page_type: 'FACHADA',
        discipline: 'ARQUITETURA',
        confidence: 0.91,
        status: 'READER_PENDING',
        requires_reader: true,
        requires_verifier: false,
        requires_hitl: false,
        blocks_consolidation: false,
      },
      {
        page_number: 5,
        page_label: 'A-05 Quadro de esquadrias',
        page_type: 'DETALHE',
        discipline: 'ARQUITETURA',
        confidence: 0.79,
        status: 'HITL_REQUIRED',
        requires_reader: true,
        requires_verifier: true,
        requires_hitl: true,
        blocks_consolidation: false,
      },
      {
        page_number: 6,
        page_label: 'A-06 Detalhes construtivos',
        page_type: 'DETALHE',
        discipline: 'ARQUITETURA',
        confidence: 0.9,
        status: 'READER_PENDING',
        requires_reader: true,
        requires_verifier: false,
        requires_hitl: false,
        blocks_consolidation: false,
      },
    ],
  },
  {
    id: 'doc-intake-memorial',
    fileName: 'Memorial Descritivo.pdf',
    fileType: 'application/pdf',
    fileSize: 4_980_000,
    uploadStatus: 'received',
    processingStatus: 'inventory_mocked',
    totalPages: 8,
    initialRisk: 'alto',
    riskNotes: [
      'Memorial menciona acabamentos e hidráulica, mas não substitui quantitativo oficial.',
      'Uma página crítica permanece bloqueada para consolidação até revisão humana futura.',
    ],
    pages: [
      {
        page_number: 1,
        page_label: 'MD-01 Escopo geral',
        page_type: 'MEMORIAL',
        discipline: 'ARQUITETURA',
        confidence: 0.93,
        status: 'READER_PENDING',
        requires_reader: true,
        requires_verifier: false,
        requires_hitl: false,
        blocks_consolidation: false,
      },
      {
        page_number: 2,
        page_label: 'MD-02 Alvenarias e revestimentos',
        page_type: 'ESPECIFICACAO',
        discipline: 'ARQUITETURA',
        confidence: 0.9,
        status: 'READER_PENDING',
        requires_reader: true,
        requires_verifier: false,
        requires_hitl: false,
        blocks_consolidation: false,
      },
      {
        page_number: 3,
        page_label: 'MD-03 Pisos e acabamentos',
        page_type: 'ESPECIFICACAO',
        discipline: 'ARQUITETURA',
        confidence: 0.87,
        status: 'VERIFIER_PENDING',
        requires_reader: true,
        requires_verifier: true,
        requires_hitl: false,
        blocks_consolidation: false,
      },
      {
        page_number: 4,
        page_label: 'MD-04 Louças e metais',
        page_type: 'ESPECIFICACAO',
        discipline: 'HIDRAULICA',
        confidence: 0.86,
        status: 'VERIFIER_PENDING',
        requires_reader: true,
        requires_verifier: true,
        requires_hitl: false,
        blocks_consolidation: false,
      },
      {
        page_number: 5,
        page_label: 'MD-05 Instalações gerais',
        page_type: 'MEMORIAL',
        discipline: 'HIDRAULICA',
        confidence: 0.81,
        status: 'HITL_REQUIRED',
        requires_reader: true,
        requires_verifier: true,
        requires_hitl: true,
        blocks_consolidation: false,
      },
      {
        page_number: 6,
        page_label: 'MD-06 Responsabilidades excluídas',
        page_type: 'ESPECIFICACAO',
        discipline: 'ARQUITETURA',
        confidence: 0.92,
        status: 'READER_PENDING',
        requires_reader: true,
        requires_verifier: false,
        requires_hitl: false,
        blocks_consolidation: false,
      },
      {
        page_number: 7,
        page_label: 'MD-07 Premissas incompletas',
        page_type: 'DESCONHECIDO',
        discipline: 'DESCONHECIDA',
        confidence: 0.58,
        status: 'BLOCKED',
        requires_reader: true,
        requires_verifier: true,
        requires_hitl: true,
        blocks_consolidation: true,
      },
      {
        page_number: 8,
        page_label: 'MD-08 Anexos técnicos',
        page_type: 'MEMORIAL',
        discipline: 'ARQUITETURA',
        confidence: 0.84,
        status: 'VERIFIER_PENDING',
        requires_reader: true,
        requires_verifier: true,
        requires_hitl: false,
        blocks_consolidation: false,
      },
    ],
  },
  {
    id: 'doc-intake-eletrica',
    fileName: 'Planta Elétrica.pdf',
    fileType: 'application/pdf',
    fileSize: 9_620_000,
    uploadStatus: 'partial',
    processingStatus: 'inventory_mocked',
    totalPages: 4,
    initialRisk: 'alto',
    riskNotes: [
      'Registro parcial simula arquivo recebido com revisão pendente.',
      'Quadro de cargas exige Verifier e HITL antes de qualquer despacho para agentes.',
    ],
    pages: [
      {
        page_number: 1,
        page_label: 'E-01 Pontos elétricos térreo',
        page_type: 'PLANTA_BAIXA',
        discipline: 'ELETRICA',
        confidence: 0.86,
        status: 'VERIFIER_PENDING',
        requires_reader: true,
        requires_verifier: true,
        requires_hitl: false,
        blocks_consolidation: false,
      },
      {
        page_number: 2,
        page_label: 'E-02 Pontos elétricos superior',
        page_type: 'PLANTA_BAIXA',
        discipline: 'ELETRICA',
        confidence: 0.83,
        status: 'VERIFIER_PENDING',
        requires_reader: true,
        requires_verifier: true,
        requires_hitl: false,
        blocks_consolidation: false,
      },
      {
        page_number: 3,
        page_label: 'E-03 Quadro de cargas',
        page_type: 'QUANTITATIVO',
        discipline: 'ELETRICA',
        confidence: 0.69,
        status: 'HITL_REQUIRED',
        requires_reader: true,
        requires_verifier: true,
        requires_hitl: true,
        blocks_consolidation: false,
      },
      {
        page_number: 4,
        page_label: 'E-04 Diagrama unifilar',
        page_type: 'DETALHE',
        discipline: 'ELETRICA',
        confidence: 0.78,
        status: 'HITL_REQUIRED',
        requires_reader: true,
        requires_verifier: true,
        requires_hitl: true,
        blocks_consolidation: false,
      },
    ],
  },
];

function buildDisciplineSummaries(
  pages: OrcamentistaDocumentInventoryPage[]
): OrcamentistaDocumentDisciplineSummary[] {
  const detected = pages
    .filter((page) => page.discipline !== 'DESCONHECIDA')
    .reduce<Record<string, OrcamentistaDocumentInventoryPage[]>>((acc, page) => {
      acc[page.discipline] = [...(acc[page.discipline] ?? []), page];
      return acc;
    }, {});

  const detectedSummaries = Object.entries(detected).map(([discipline, disciplinePages]) => {
    const avgConfidence =
      disciplinePages.reduce((acc, page) => acc + page.confidence, 0) / disciplinePages.length;

    return {
      discipline,
      detected: true,
      pages_count: disciplinePages.length,
      confidence: Number(avgConfidence.toFixed(2)),
      status: avgConfidence < 0.85 ? 'partial' : 'detected',
    } satisfies OrcamentistaDocumentDisciplineSummary;
  });

  const missingSummaries = ORCAMENTISTA_EXPECTED_DISCIPLINES.filter(
    (discipline) => !detected[discipline]
  ).map((discipline) => ({
    discipline,
    detected: false,
    pages_count: 0,
    confidence: 0,
    status: 'missing',
  } satisfies OrcamentistaDocumentDisciplineSummary));

  return [...detectedSummaries, ...missingSummaries];
}

function buildDocumentFromTemplate({
  template,
  opportunityId,
  orcamentoId,
  source,
  overrideFile,
}: {
  template: MockDocumentTemplate;
  opportunityId: string;
  orcamentoId: string | null;
  source: OrcamentistaDocumentIntakeFile['source'];
  overrideFile?: OpportunityFile;
}): OrcamentistaDocumentIntakeFile {
  const id = overrideFile?.id ?? template.id;
  const createdAt = overrideFile?.created_at ?? MOCK_TIMESTAMP;
  const updatedAt = overrideFile?.created_at ?? MOCK_TIMESTAMP;
  const detectedDisciplines = buildDisciplineSummaries(template.pages);
  const missingDisciplines = detectedDisciplines
    .filter((discipline) => !discipline.detected)
    .map((discipline) => discipline.discipline);

  const baseDocument: OrcamentistaDocumentIntakeFile = {
    id,
    opportunity_id: opportunityId,
    orcamento_id: orcamentoId,
    file_name: overrideFile?.nome ?? template.fileName,
    file_type: overrideFile?.mime_type ?? template.fileType,
    file_size: overrideFile?.tamanho_bytes ?? template.fileSize,
    source,
    upload_status: overrideFile ? 'received' : template.uploadStatus,
    processing_status: template.processingStatus,
    total_pages: template.totalPages,
    detected_disciplines: detectedDisciplines,
    missing_disciplines: missingDisciplines,
    readiness_status: 'not_ready',
    inventory: {
      id: `inventory-${id}`,
      document_id: id,
      opportunity_id: opportunityId,
      orcamento_id: orcamentoId,
      total_pages: template.totalPages,
      detected_disciplines: detectedDisciplines,
      missing_disciplines: missingDisciplines,
      pages: template.pages,
      readiness_status: 'not_ready',
      initial_risk: template.initialRisk,
      risk_notes: template.riskNotes,
      created_at: createdAt,
      updated_at: updatedAt,
    },
    created_at: createdAt,
    updated_at: updatedAt,
  };

  const readiness = getReadinessStatus(baseDocument);

  return {
    ...baseDocument,
    readiness_status: readiness,
    inventory: {
      ...baseDocument.inventory,
      readiness_status: readiness,
    },
  };
}

export function buildMockDocumentIntakeFiles({
  opportunityId,
  orcamentoId,
  opportunityFiles = [],
}: {
  opportunityId: string;
  orcamentoId: string | null;
  opportunityFiles?: OpportunityFile[];
}): OrcamentistaDocumentIntakeFile[] {
  if (opportunityFiles.length > 0) {
    return opportunityFiles.map((file, index) =>
      buildDocumentFromTemplate({
        template: mockTemplates[index % mockTemplates.length],
        opportunityId,
        orcamentoId,
        source: 'opportunity_files_readonly',
        overrideFile: file,
      })
    );
  }

  return mockTemplates.map((template) =>
    buildDocumentFromTemplate({
      template,
      opportunityId,
      orcamentoId,
      source: 'mock_local',
    })
  );
}

export const mockDocumentIntakeFiles = buildMockDocumentIntakeFiles({
  opportunityId: 'mock-opportunity',
  orcamentoId: 'mock-orcamento',
});
