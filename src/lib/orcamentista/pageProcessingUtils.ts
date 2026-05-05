import { 
  OrcamentistaRenderedPage, 
  OrcamentistaPageProcessingStatus 
} from '../../types';
import { isPageReadyForReader, shouldBlockReader, shouldRequireOcrFuture } from './pageProcessingContract';

export function groupPagesByStatus(pages: OrcamentistaRenderedPage[]): Record<OrcamentistaPageProcessingStatus, OrcamentistaRenderedPage[]> {
  const grouped = {} as Record<OrcamentistaPageProcessingStatus, OrcamentistaRenderedPage[]>;
  
  // Inicializa todos os status com array vazio para evitar undefined
  const allStatuses: OrcamentistaPageProcessingStatus[] = [
    'PENDING', 'RENDERING_IMAGE', 'EXTRACTING_TEXT', 'COMPLETED', 'FAILED', 'BLOCKED'
  ];
  allStatuses.forEach(s => grouped[s] = []);

  pages.forEach(p => {
    if (!grouped[p.render_status]) {
      grouped[p.render_status] = [];
    }
    grouped[p.render_status].push(p);
  });

  return grouped;
}

export function getReadyPages(pages: OrcamentistaRenderedPage[]): OrcamentistaRenderedPage[] {
  return pages.filter(p => p.render_status === 'COMPLETED');
}

export function getBlockedPages(pages: OrcamentistaRenderedPage[]): OrcamentistaRenderedPage[] {
  return pages.filter(shouldBlockReader);
}

export function getPagesRequiringOcr(pages: OrcamentistaRenderedPage[]): OrcamentistaRenderedPage[] {
  return pages.filter(shouldRequireOcrFuture);
}

export function getPagesReadyForReader(pages: OrcamentistaRenderedPage[]): OrcamentistaRenderedPage[] {
  return pages.filter(isPageReadyForReader);
}

export function summarizePageAssets(pages: OrcamentistaRenderedPage[]): {
  total_images: number;
  total_texts: number;
  total_image_bytes: number;
  total_text_bytes: number;
} {
  return pages.reduce((acc, page) => {
    if (page.image_ref) {
      acc.total_images += 1;
      acc.total_image_bytes += page.image_ref.size_bytes;
    }
    if (page.text_ref) {
      acc.total_texts += 1;
      acc.total_text_bytes += page.text_ref.size_bytes;
    }
    return acc;
  }, {
    total_images: 0,
    total_texts: 0,
    total_image_bytes: 0,
    total_text_bytes: 0
  });
}
