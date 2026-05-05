import {
  OrcamentistaDocument,
  OrcamentistaPageClassification,
  OrcamentistaPageRender,
  OrcamentistaPrimaryPageReading,
} from '../../types';

// ── Mock de Inventário ──────────────────────────────────────────────────────

export const mockPdfDocument: OrcamentistaDocument = {
  file_id: 'doc_mock_123',
  file_name: 'projeto_arquitetura_executivo.pdf',
  total_pages: 5,
  uploaded_at: new Date().toISOString(),
  status: 'processed',
};

// ── Mock de Renderização Determinística (Páginas) ───────────────────────────

export const mockPageRenders: OrcamentistaPageRender[] = [
  { file_id: 'doc_mock_123', page_number: 1, image_url: '/mock/page_1.png', width: 1920, height: 1080 },
  { file_id: 'doc_mock_123', page_number: 2, image_url: '/mock/page_2.png', width: 1920, height: 1080 },
];

// ── Mock de Classificação de Páginas ────────────────────────────────────────

export const mockClassifications: OrcamentistaPageClassification[] = [
  {
    file_id: 'doc_mock_123',
    page_number: 1,
    page_type: 'PLANTA_BAIXA',
    discipline: 'ARQUITETURA',
    confidence: 0.98,
  },
  {
    file_id: 'doc_mock_123',
    page_number: 2,
    page_type: 'CORTE',
    discipline: 'ARQUITETURA',
    confidence: 0.95,
  },
];

// ── Mock de Leitura Primária (IA 1) ─────────────────────────────────────────

export const mockPrimaryReadings: OrcamentistaPrimaryPageReading[] = [
  {
    file_id: 'doc_mock_123',
    page_number: 1,
    classification: mockClassifications[0],
    identified_items: [
      {
        element: 'Piso Porcelanato 60x60',
        quantity: '45m²',
        evidence_type: 'TEXT_EXPLICIT',
        source_reference: 'Quadro de acabamentos - Sala',
      },
      {
        element: 'Porta de Madeira 80x210',
        quantity: '2un',
        evidence_type: 'DRAWING_ANNOTATION',
        source_reference: 'P1 (Planta)',
      },
    ],
    inferred_items: [
      {
        element: 'Rodapé de Porcelanato',
        reasoning: 'Inferido a partir da presença de piso porcelanato na sala.',
      },
      {
        element: 'Argamassa ACIII',
        reasoning: 'Necessária para assentamento do porcelanato especificado.',
      },
    ],
    missing_information: ['Marca/Fabricante do Porcelanato'],
    reading_confidence: 0.92,
  },
];

/**
 * Função de simulação que "lê" uma página mockada.
 * Nenhuma IA real é chamada aqui.
 */
export async function simulatePrimaryReading(
  fileId: string,
  pageNumber: number
): Promise<OrcamentistaPrimaryPageReading | null> {
  // Simula latência de rede/IA
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const reading = mockPrimaryReadings.find(
    r => r.file_id === fileId && r.page_number === pageNumber
  );
  
  return reading || null;
}
