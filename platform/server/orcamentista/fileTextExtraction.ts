import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);
// pdf-parse is CJS-only; createRequire bridges the ESM/CJS gap without
// needing "allowSyntheticDefaultImports" trickery.
const pdfParse: (buffer: Buffer, options?: Record<string, unknown>) => Promise<{ text: string }> =
  _require('pdf-parse');

export type FileReadStatus =
  | 'text_extracted'
  | 'text_empty'
  | 'pdf_text_extracted'
  | 'pdf_image_detected'
  | 'pdf_parser_unavailable'
  | 'unsupported_file_type'
  | 'file_content_unavailable'
  | 'file_too_large';

export type FileTextEvidence = {
  fileId: string;
  fileName: string | null;
  type: 'text_excerpt';
  content: string;
  page: null;
};

export type FileTextExtractionInput = {
  fileId: string;
  fileName: string | null;
  mimeType: string | null;
  buffer: Buffer;
  maxExtractedChars?: number;
  maxEvidences?: number;
  maxEvidenceChars?: number;
};

export type FileTextExtractionResult = {
  read_status: FileReadStatus;
  extracted_chars: number;
  evidences: FileTextEvidence[];
  warning?: string;
};

const DEFAULT_MAX_EXTRACTED_CHARS = 20_000;
const DEFAULT_MAX_EVIDENCES = 3;
const DEFAULT_MAX_EVIDENCE_CHARS = 800;

// Minimum chars to consider a PDF as having a real text layer (not a scan).
const PDF_TEXT_MIN_CHARS = 50;

const SUPPORTED_TEXT_MIME_TYPES = new Set([
  'text/plain',
  'text/csv',
  'application/csv',
  'text/markdown',
  'application/json',
]);

const SUPPORTED_TEXT_EXTENSIONS = new Set(['.txt', '.csv', '.md', '.markdown', '.json']);

function normalizeMimeType(mimeType: string | null): string {
  return (mimeType ?? '').split(';')[0].trim().toLowerCase();
}

function getFileExtension(fileName: string | null): string {
  if (!fileName) return '';
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex >= 0 ? fileName.slice(dotIndex).toLowerCase() : '';
}

function isSupportedTextFile(mimeType: string, extension: string): boolean {
  return SUPPORTED_TEXT_MIME_TYPES.has(mimeType) || SUPPORTED_TEXT_EXTENSIONS.has(extension);
}

function isPdfFile(mimeType: string, extension: string): boolean {
  return mimeType === 'application/pdf' || extension === '.pdf';
}

function normalizeText(text: string): string {
  return text
    .replace(/^﻿/, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildEvidenceChunks(params: {
  fileId: string;
  fileName: string | null;
  text: string;
  maxEvidences: number;
  maxEvidenceChars: number;
}): FileTextEvidence[] {
  const paragraphs = params.text
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const sourceChunks = paragraphs.length > 0 ? paragraphs : [params.text];
  const evidences: FileTextEvidence[] = [];

  for (const chunk of sourceChunks) {
    const content = chunk.slice(0, params.maxEvidenceChars).trim();
    if (!content) continue;

    evidences.push({
      fileId: params.fileId,
      fileName: params.fileName,
      type: 'text_excerpt',
      content,
      page: null,
    });

    if (evidences.length >= params.maxEvidences) break;
  }

  return evidences;
}

async function extractPdfText(buffer: Buffer): Promise<{ text: string; error?: string }> {
  try {
    // pdf-parse options: disable verbosity and rendering hooks
    const result = await pdfParse(buffer, { max: 0 });
    return { text: result.text ?? '' };
  } catch (err: any) {
    return { text: '', error: err?.message ?? 'pdf-parse falhou.' };
  }
}

/**
 * Extrai evidências textuais de um arquivo.
 *
 * PDF gate:
 *   - Habilitado com EVIS_ORCAMENTISTA_ENABLE_PDF_PARSE=true.
 *   - Se texto extraído < PDF_TEXT_MIN_CHARS → pdf_image_detected (scan/desenho).
 *   - Se extração falha → pdf_parser_unavailable.
 *
 * Outros tipos: txt, csv, json, md extraídos diretamente do buffer UTF-8.
 */
export async function extractTextEvidenceFromFile(
  input: FileTextExtractionInput,
): Promise<FileTextExtractionResult> {
  const mimeType = normalizeMimeType(input.mimeType);
  const extension = getFileExtension(input.fileName);
  const maxExtractedChars = input.maxExtractedChars ?? DEFAULT_MAX_EXTRACTED_CHARS;
  const maxEvidences = input.maxEvidences ?? DEFAULT_MAX_EVIDENCES;
  const maxEvidenceChars = input.maxEvidenceChars ?? DEFAULT_MAX_EVIDENCE_CHARS;

  if (isPdfFile(mimeType, extension)) {
    const pdfEnabled = process.env['EVIS_ORCAMENTISTA_ENABLE_PDF_PARSE'] === 'true';

    if (!pdfEnabled) {
      return {
        read_status: 'pdf_parser_unavailable',
        extracted_chars: 0,
        evidences: [],
        warning: 'PDF detectado. Habilite EVIS_ORCAMENTISTA_ENABLE_PDF_PARSE=true para extração local.',
      };
    }

    const { text: rawPdfText, error: pdfError } = await extractPdfText(input.buffer);

    if (pdfError) {
      return {
        read_status: 'pdf_parser_unavailable',
        extracted_chars: 0,
        evidences: [],
        warning: `pdf-parse retornou erro: ${pdfError}`,
      };
    }

    const pdfText = normalizeText(rawPdfText).slice(0, maxExtractedChars);

    if (pdfText.length < PDF_TEXT_MIN_CHARS) {
      return {
        read_status: 'pdf_image_detected',
        extracted_chars: 0,
        evidences: [],
        warning:
          'PDF sem camada de texto legível (scan ou desenho técnico). Habilite EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE para leitura multimodal.',
      };
    }

    return {
      read_status: 'pdf_text_extracted',
      extracted_chars: pdfText.length,
      evidences: buildEvidenceChunks({
        fileId: input.fileId,
        fileName: input.fileName,
        text: pdfText,
        maxEvidences,
        maxEvidenceChars,
      }),
    };
  }

  if (!isSupportedTextFile(mimeType, extension)) {
    return {
      read_status: 'unsupported_file_type',
      extracted_chars: 0,
      evidences: [],
      warning: 'Tipo de arquivo não suportado para extração local nesta sprint.',
    };
  }

  const rawText = input.buffer.toString('utf8');
  const text = normalizeText(rawText).slice(0, maxExtractedChars);

  if (!text) {
    return {
      read_status: 'text_empty',
      extracted_chars: 0,
      evidences: [],
      warning: 'Arquivo textual acessível, mas sem texto extraível.',
    };
  }

  return {
    read_status: 'text_extracted',
    extracted_chars: text.length,
    evidences: buildEvidenceChunks({
      fileId: input.fileId,
      fileName: input.fileName,
      text,
      maxEvidences,
      maxEvidenceChars,
    }),
  };
}
