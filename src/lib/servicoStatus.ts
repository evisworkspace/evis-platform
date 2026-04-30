import { ServicoStatus } from '../types';

const STATUS_ALIAS: Record<string, ServicoStatus> = {
  a_executar: 'nao_iniciado',
  aexecutar: 'nao_iniciado',
  planejado: 'nao_iniciado',
  pendente: 'nao_iniciado',
  nao_iniciado: 'nao_iniciado',
  nao_iniciada: 'nao_iniciado',
  em_andamento: 'em_andamento',
  emandamento: 'em_andamento',
  andamento: 'em_andamento',
  ativo: 'em_andamento',
  concluido: 'concluido',
  concluida: 'concluido',
  finalizado: 'concluido',
  finalizada: 'concluido',
  pausado: 'pausado',
  pausada: 'pausado',
};

export const SERVICO_STATUS_LABELS: Record<ServicoStatus, string> = {
  nao_iniciado: 'não iniciado',
  em_andamento: 'em andamento',
  concluido: 'concluído',
  pausado: 'pausado',
  bloqueado: 'bloqueado',
};

function sanitizeStatus(status?: string | null): string {
  return (status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
}

export function normalizarServicoStatus(
  status?: string | null,
  avancoAtual?: number | null
): ServicoStatus {
  const sanitized = sanitizeStatus(status);

  if (sanitized && STATUS_ALIAS[sanitized]) {
    return STATUS_ALIAS[sanitized];
  }

  const avanco = Number(avancoAtual || 0);
  if (avanco >= 100) {
    return 'concluido';
  }
  if (avanco > 0) {
    return 'em_andamento';
  }

  return 'nao_iniciado';
}
