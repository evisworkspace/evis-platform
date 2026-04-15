import { format, differenceInDays, eachDayOfInterval, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppState } from '../types';

export function calcularSemanaRelativa(data: Date, inicioObra?: Date): number {
  if (!inicioObra) return 1;
  const diff = differenceInDays(data, inicioObra);
  return Math.max(1, Math.floor(diff / 7) + 1);
}

export function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data + 'T00:00:00') : data;
  return format(d, "dd 'de' MMMM", { locale: ptBR });
}

export function gerarIntervalo(dataInicial: Date, dataFinal: Date): Date[] {
  return eachDayOfInterval({ start: dataInicial, end: dataFinal });
}

export function diasEntreDatas(data1: Date, data2: Date): number {
  return Math.abs(differenceInDays(data2, data1));
}

// Helper: converte uma data em string YYYY-MM-DD local sem desvio de timezone
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function getProjectStartDate(state: AppState): Date {
  let min = new Date();
  let first = true;
  state.servicos.forEach(s => {
    if (s.data_prevista) {
      const d = new Date(s.data_prevista + 'T00:00:00');
      if (first || d < min) min = d;
      first = false;
    }
  });
  return min;
}

export function getRelativeWeekString(dateStr: string, state: AppState): string {
  const start = getProjectStartDate(state);
  const current = new Date(dateStr + 'T00:00:00');
  const week = calcularSemanaRelativa(current, start);
  return `S${week}`;
}

export function getDaysOfRelativeWeek(weekStr: string, state: AppState): string[] {
  const weekNum = parseInt(weekStr.replace('S', ''), 10);
  const start = getProjectStartDate(state);
  // S1 starts at 'start'
  const weekStart = addDays(start, (weekNum - 1) * 7);
  const weekEnd = addDays(weekStart, 6);
  return gerarIntervalo(weekStart, weekEnd).map(toDateStr);
}

