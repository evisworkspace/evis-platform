import {
  OrcamentistaDocumentIntakeFile,
  OrcamentistaDocumentInventoryPage,
  OrcamentistaDocumentReadinessStatus,
} from '../../types';
import { DISCIPLINAS_CONHECIDAS, PDF_READER_THRESHOLDS } from './pdfReaderContract';

export const ORCAMENTISTA_EXPECTED_DISCIPLINES = [
  'ARQUITETURA',
  'ESTRUTURA',
  'ELETRICA',
  'HIDRAULICA',
  'CLIMATIZACAO',
  'INCENDIO',
];

export type OrcamentistaInventorySummary = {
  totalDocuments: number;
  totalPages: number;
  detectedDisciplines: string[];
  missingDisciplines: string[];
  pagesRequiringVerification: number;
  blockedPages: number;
  hitlPages: number;
  lowConfidencePages: number;
  readerReadyDocuments: number;
  agentReadyDocuments: number;
  readinessCounts: Record<OrcamentistaDocumentReadinessStatus, number>;
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean).map((value) => value.toUpperCase())));
}

function allPages(documents: OrcamentistaDocumentIntakeFile[]): OrcamentistaDocumentInventoryPage[] {
  return documents.flatMap((document) => document.inventory.pages);
}

export function getReadinessStatus(
  document: OrcamentistaDocumentIntakeFile
): OrcamentistaDocumentReadinessStatus {
  if (document.upload_status === 'failed' || document.processing_status === 'blocked') {
    return 'blocked';
  }

  if (document.total_pages <= 0 || document.inventory.pages.length === 0) {
    return 'not_ready';
  }

  if (getBlockedPages(document).length > 0) {
    return 'blocked';
  }

  if (document.inventory.pages.some((page) => page.requires_hitl)) {
    return 'requires_hitl';
  }

  if (getPagesRequiringVerification(document).length > 0) {
    return 'requires_verification';
  }

  if (document.upload_status === 'partial' || document.missing_disciplines.length > 0) {
    return 'partial_inventory';
  }

  return 'ready_for_reader';
}

export function getMissingDisciplines(documents: OrcamentistaDocumentIntakeFile[]) {
  const expected = unique([
    ...ORCAMENTISTA_EXPECTED_DISCIPLINES,
    ...DISCIPLINAS_CONHECIDAS.filter((discipline) =>
      ORCAMENTISTA_EXPECTED_DISCIPLINES.includes(discipline)
    ),
  ]);

  const detected = unique(
    documents.flatMap((document) =>
      document.detected_disciplines
        .filter((discipline) => discipline.detected && discipline.status !== 'missing')
        .map((discipline) => discipline.discipline)
    )
  );

  return expected.filter((discipline) => !detected.includes(discipline));
}

export function getPagesRequiringVerification(document: OrcamentistaDocumentIntakeFile) {
  return document.inventory.pages.filter((page) => {
    if (page.requires_verifier || page.requires_hitl) return true;
    return page.confidence < PDF_READER_THRESHOLDS.MIN_CLASSIFICATION_CONFIDENCE;
  });
}

export function getBlockedPages(document: OrcamentistaDocumentIntakeFile) {
  return document.inventory.pages.filter(
    (page) => page.blocks_consolidation || page.status === 'BLOCKED'
  );
}

export function canRunReader(document: OrcamentistaDocumentIntakeFile) {
  if (!['received', 'partial'].includes(document.upload_status)) return false;
  if (document.processing_status === 'blocked') return false;
  if (document.total_pages <= 0 || document.inventory.pages.length === 0) return false;
  return getBlockedPages(document).length === 0;
}

export function canDispatchToAgents(document: OrcamentistaDocumentIntakeFile) {
  if (getReadinessStatus(document) !== 'ready_for_reader') return false;

  return document.inventory.pages.every(
    (page) =>
      !page.requires_reader &&
      !page.requires_verifier &&
      !page.requires_hitl &&
      !page.blocks_consolidation
  );
}

export function summarizeDocumentInventory(
  documents: OrcamentistaDocumentIntakeFile[]
): OrcamentistaInventorySummary {
  const pages = allPages(documents);
  const detectedDisciplines = unique(
    documents.flatMap((document) =>
      document.detected_disciplines
        .filter((discipline) => discipline.detected && discipline.status !== 'missing')
        .map((discipline) => discipline.discipline)
    )
  );

  const readinessCounts = documents.reduce<Record<OrcamentistaDocumentReadinessStatus, number>>(
    (acc, document) => {
      const status = getReadinessStatus(document);
      acc[status] += 1;
      return acc;
    },
    {
      not_ready: 0,
      partial_inventory: 0,
      ready_for_reader: 0,
      requires_verification: 0,
      requires_hitl: 0,
      blocked: 0,
    }
  );

  return {
    totalDocuments: documents.length,
    totalPages: documents.reduce((acc, document) => acc + document.total_pages, 0),
    detectedDisciplines,
    missingDisciplines: getMissingDisciplines(documents),
    pagesRequiringVerification: documents.reduce(
      (acc, document) => acc + getPagesRequiringVerification(document).length,
      0
    ),
    blockedPages: documents.reduce((acc, document) => acc + getBlockedPages(document).length, 0),
    hitlPages: pages.filter((page) => page.requires_hitl).length,
    lowConfidencePages: pages.filter(
      (page) => page.confidence < PDF_READER_THRESHOLDS.MIN_CLASSIFICATION_CONFIDENCE
    ).length,
    readerReadyDocuments: documents.filter(canRunReader).length,
    agentReadyDocuments: documents.filter(canDispatchToAgents).length,
    readinessCounts,
  };
}
