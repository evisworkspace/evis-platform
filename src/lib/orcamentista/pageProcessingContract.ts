import { 
  OrcamentistaRenderedPage, 
  OrcamentistaPageProcessingStatus,
  OrcamentistaPageProcessingSummary
} from '../../types';

export const PAGE_PROCESSING_CONSTANTS = {
  DEFAULT_RENDER_DPI: 300,
  LOW_DPI_FALLBACK: 150,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  SUPPORTED_MIME_TYPES: ['image/png', 'image/jpeg', 'image/webp']
};

export function getPageProcessingStatusLabel(status: OrcamentistaPageProcessingStatus): string {
  const labels: Record<OrcamentistaPageProcessingStatus, string> = {
    'PENDING': 'Pendente',
    'RENDERING_IMAGE': 'Renderizando Imagem',
    'EXTRACTING_TEXT': 'Extraindo Texto',
    'COMPLETED': 'Concluído',
    'FAILED': 'Falha',
    'BLOCKED': 'Bloqueado'
  };
  return labels[status] || status;
}

export function isPageReadyForReader(page: OrcamentistaRenderedPage): boolean {
  return page.ready_for_reader === 'READY' || page.ready_for_reader === 'READY_WITH_WARNINGS';
}

export function shouldRequireOcrFuture(page: OrcamentistaRenderedPage): boolean {
  // Se não tem camada de texto e parece ser escaneada, ou se já foi marcada explicitamente
  return page.requires_ocr_future || (!page.has_text_layer && page.is_scanned);
}

export function shouldBlockReader(page: OrcamentistaRenderedPage): boolean {
  return page.render_status === 'FAILED' || 
         page.render_status === 'BLOCKED' || 
         page.ready_for_reader === 'BLOCKED';
}

export function calculatePageProcessingSummary(pages: OrcamentistaRenderedPage[]): OrcamentistaPageProcessingSummary {
  return {
    total_pages: pages.length,
    processed_pages: pages.filter(p => p.render_status === 'COMPLETED').length,
    failed_pages: pages.filter(p => p.render_status === 'FAILED').length,
    ready_for_reader: pages.filter(isPageReadyForReader).length,
    requires_ocr: pages.filter(shouldRequireOcrFuture).length,
    blocked_pages: pages.filter(shouldBlockReader).length
  };
}

export function getPageProcessingRisk(page: OrcamentistaRenderedPage): 'baixa' | 'media' | 'alta' | 'critica' {
  if (shouldBlockReader(page)) return 'critica';
  if (shouldRequireOcrFuture(page)) return 'alta';
  if (page.ready_for_reader === 'READY_WITH_WARNINGS' || page.processing_confidence < 0.7) return 'media';
  return 'baixa';
}

export function getRecommendedRenderDpi(fileType: string): number {
  const lowerType = fileType.toLowerCase();
  // Arquivos de CAD/Vetor geralmente precisam de mais resolução para não perder linhas finas
  if (lowerType.includes('pdf')) {
    return PAGE_PROCESSING_CONSTANTS.DEFAULT_RENDER_DPI; // 300
  }
  // Se já for uma imagem anexada e envelopada em PDF
  if (lowerType.includes('image')) {
    return PAGE_PROCESSING_CONSTANTS.LOW_DPI_FALLBACK; // 150
  }
  return PAGE_PROCESSING_CONSTANTS.DEFAULT_RENDER_DPI;
}
