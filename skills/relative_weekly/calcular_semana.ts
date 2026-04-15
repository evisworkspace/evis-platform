import { calcularSemanaRelativa } from '../../src/lib/dateUtils';

/**
 * Retorna a semana relativa formatada (ex: "S8")
 * @param dataObra Data de início da obra (YYYY-MM-DD)
 * @param dataRef Data de referência (YYYY-MM-DD)
 */
export function getSemanaRelativaFormatada(dataObra: string, dataRef: string): string {
  const dObra = new Date(dataObra + 'T00:00:00');
  const dRef = new Date(dataRef + 'T00:00:00');
  const semana = calcularSemanaRelativa(dRef, dObra);
  return `S${semana}`;
}
