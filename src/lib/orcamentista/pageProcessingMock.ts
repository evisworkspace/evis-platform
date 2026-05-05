import { 
  OrcamentistaPageProcessingJob, 
  OrcamentistaRenderedPage 
} from '../../types';
import { calculatePageProcessingSummary } from './pageProcessingContract';

// Mock de Job de Processamento para um documento simulado
export const MOCK_PAGE_PROCESSING_JOB: OrcamentistaPageProcessingJob = {
  id: 'job-proc-8899',
  document_id: 'doc-mock-001',
  opportunity_id: 'opp-123',
  orcamento_id: null,
  status: 'COMPLETED',
  total_pages: 5,
  processed_pages: 5,
  failed_pages: 0,
  started_at: new Date(Date.now() - 60000).toISOString(),
  finished_at: new Date().toISOString(),
};

// Mock de Páginas Renderizadas com diferentes cenários contratuais
export const MOCK_RENDERED_PAGES: OrcamentistaRenderedPage[] = [
  {
    id: 'pg-rnd-01',
    document_id: 'doc-mock-001',
    file_id: 'file-mock-001',
    page_number: 1,
    page_label: 'Capa',
    render_status: 'COMPLETED',
    has_text_layer: true,
    is_scanned: false,
    width: 2480,
    height: 3508,
    dpi: 300,
    processing_confidence: 0.99,
    ready_for_reader: 'READY',
    requires_ocr_future: false,
    created_at: new Date().toISOString(),
    image_ref: {
      asset_type: 'image/webp',
      storage_ref: 'mock://storage/pg-1-render.webp',
      mime_type: 'image/webp',
      size_bytes: 450000,
      generated_by: 'evis-pdf-renderer-mock',
      generated_at: new Date().toISOString()
    },
    text_ref: {
      asset_type: 'text/plain',
      storage_ref: 'mock://storage/pg-1-text.txt',
      mime_type: 'text/plain',
      size_bytes: 1200,
      generated_by: 'evis-pdf-text-extractor-mock',
      generated_at: new Date().toISOString()
    }
  },
  {
    id: 'pg-rnd-02',
    document_id: 'doc-mock-001',
    file_id: 'file-mock-001',
    page_number: 2,
    page_label: 'Planta Baixa Térreo',
    render_status: 'COMPLETED',
    has_text_layer: false, // Cenário: PDF vetorizado mas sem texto selecionável puro
    is_scanned: false,
    width: 4960, // A3
    height: 3508,
    dpi: 300,
    processing_confidence: 0.85,
    ready_for_reader: 'READY_WITH_WARNINGS',
    requires_ocr_future: true, // Avisando o sistema que precisará de OCR
    created_at: new Date().toISOString(),
    image_ref: {
      asset_type: 'image/webp',
      storage_ref: 'mock://storage/pg-2-render.webp',
      mime_type: 'image/webp',
      size_bytes: 1200000,
      generated_by: 'evis-pdf-renderer-mock',
      generated_at: new Date().toISOString()
    }
  },
  {
    id: 'pg-rnd-03',
    document_id: 'doc-mock-001',
    file_id: 'file-mock-001',
    page_number: 3,
    page_label: 'Detalhes Construtivos Antigos',
    render_status: 'COMPLETED',
    has_text_layer: false,
    is_scanned: true, // Cenário: Claramente escaneado
    width: 2480,
    height: 3508,
    dpi: 150, // Baixa resolução
    processing_confidence: 0.40,
    ready_for_reader: 'REQUIRES_OCR',
    requires_ocr_future: true,
    created_at: new Date().toISOString(),
    image_ref: {
      asset_type: 'image/webp',
      storage_ref: 'mock://storage/pg-3-render.webp',
      mime_type: 'image/webp',
      size_bytes: 3000000, // Imagem pesada (ruído de scan)
      generated_by: 'evis-pdf-renderer-mock',
      generated_at: new Date().toISOString()
    }
  },
  {
    id: 'pg-rnd-04',
    document_id: 'doc-mock-001',
    file_id: 'file-mock-001',
    page_number: 4,
    page_label: 'Página Corrompida',
    render_status: 'FAILED',
    has_text_layer: false,
    is_scanned: false,
    processing_confidence: 0,
    ready_for_reader: 'BLOCKED',
    requires_ocr_future: false,
    created_at: new Date().toISOString(),
    errors: [
      {
        code: 'ERR_RENDER_OOM',
        message: 'Out of memory while rasterizing vector layer',
        severity: 'critical'
      }
    ]
  },
  {
    id: 'pg-rnd-05',
    document_id: 'doc-mock-001',
    file_id: 'file-mock-001',
    page_number: 5,
    page_label: 'Memorial Descritivo',
    render_status: 'COMPLETED',
    has_text_layer: true,
    is_scanned: false,
    width: 2480,
    height: 3508,
    dpi: 300,
    processing_confidence: 0.99,
    ready_for_reader: 'READY',
    requires_ocr_future: false,
    created_at: new Date().toISOString(),
    image_ref: {
      asset_type: 'image/webp',
      storage_ref: 'mock://storage/pg-5-render.webp',
      mime_type: 'image/webp',
      size_bytes: 200000,
      generated_by: 'evis-pdf-renderer-mock',
      generated_at: new Date().toISOString()
    },
    text_ref: {
      asset_type: 'text/plain',
      storage_ref: 'mock://storage/pg-5-text.txt',
      mime_type: 'text/plain',
      size_bytes: 8500,
      generated_by: 'evis-pdf-text-extractor-mock',
      generated_at: new Date().toISOString()
    }
  }
];

// Preenche o summary do Job usando a função de utilitário
MOCK_PAGE_PROCESSING_JOB.summary = calculatePageProcessingSummary(MOCK_RENDERED_PAGES);

export function getMockRenderedPages(documentId: string): OrcamentistaRenderedPage[] {
  // Retorna os mocks, ajustando o document_id se necessário para não quebrar a UI
  return MOCK_RENDERED_PAGES.map(p => ({ ...p, document_id: documentId }));
}
