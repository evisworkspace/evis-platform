import {
  OrcamentistaPrimaryPageReading,
  OrcamentistaReaderVerificationResult,
} from '../../types';
import { PDF_READER_THRESHOLDS } from './pdfReaderContract';

/**
 * Função de simulação que "verifica" a leitura primária (IA 2).
 * Nenhuma IA real é chamada aqui. Injeta algumas divergências propositalmente
 * para simular o funcionamento do contrato.
 */
export async function simulateVerification(
  primaryReading: OrcamentistaPrimaryPageReading
): Promise<OrcamentistaReaderVerificationResult> {
  // Simula latência de rede/IA
  await new Promise(resolve => setTimeout(resolve, 600));

  // Em um cenário real, o Verifier (IA 2) analisaria a imagem novamente 
  // e compararia com as conclusões do primaryReading.
  // Aqui, vamos mockar um cenário de quase concordância, com uma divergência.

  const result: OrcamentistaReaderVerificationResult = {
    file_id: primaryReading.file_id,
    page_number: primaryReading.page_number,
    agreement_score: 0.88, // Abaixo do threshold (0.9) de propósito
    disagreements: [],
    requires_reanalysis: false,
    requires_hitl: false,
    blocks_consolidation: false,
  };

  // Vamos fingir que o Verifier encontrou uma divergência na leitura inferida
  result.disagreements.push({
    field: 'inferred_items.element',
    primary_value: 'Argamassa ACIII',
    verifier_value: 'Argamassa ACII',
    reason: 'Uso interno para porcelanato comum geralmente requer ACII, ACIII é para grandes formatos ou áreas externas.',
    severity: 'medium',
  });

  // Verifica as regras de contrato para definir os flags booleanos
  if (result.agreement_score < PDF_READER_THRESHOLDS.MIN_AGREEMENT_SCORE) {
    result.requires_hitl = true;
  }

  // Se houvesse divergência 'critical' ou 'high', bloquearíamos
  if (result.disagreements.some(d => d.severity === 'critical' || d.severity === 'high')) {
    result.blocks_consolidation = true;
    result.requires_hitl = true;
  }

  return result;
}
