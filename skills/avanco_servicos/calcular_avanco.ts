export function calcularAvanco(atual: number, relato: number): number {
  if (relato > 100) return 100;
  if (relato < 0) return 0;
  return relato;
}
