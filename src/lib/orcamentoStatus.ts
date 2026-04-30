import { OrcamentoStatus } from '../types';

export const ORCAMENTO_STATUS_LABELS: Record<OrcamentoStatus, string> = {
  rascunho: 'Rascunho',
  aprovado: 'Aprovado',
  importado: 'Importado',
};

export function normalizarOrcamentoStatus(status?: string | null): OrcamentoStatus {
  if (status === 'aprovado' || status === 'importado') {
    return status;
  }

  return 'rascunho';
}

export function isOrcamentoCongelado(status?: string | null): boolean {
  return normalizarOrcamentoStatus(status) !== 'rascunho';
}

export function getOrcamentoStatusBadgeClass(status?: string | null): string {
  const normalized = normalizarOrcamentoStatus(status);

  if (normalized === 'importado') {
    return 'bg-brand-green/10 text-brand-green border border-brand-green/30';
  }

  if (normalized === 'aprovado') {
    return 'bg-brand-blue/10 text-brand-blue border border-brand-blue/30';
  }

  return 'bg-brand-amber/10 text-brand-amber border border-brand-amber/30';
}
