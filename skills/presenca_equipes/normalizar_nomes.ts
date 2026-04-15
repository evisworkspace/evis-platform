export function normalizarNome(nome: string): string {
  const baixado = nome.toLowerCase().trim();
  // Exemplo de normalização simples
  return baixado.replace(/^(seu|dona|sr|sra)\s+/, "").split(" ")[0];
}
