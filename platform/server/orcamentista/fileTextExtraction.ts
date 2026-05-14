export type FileReadStatus =
  | 'text_extracted'
  | 'text_empty'
  | 'pdf_parser_unavailable'
  | 'unsupported_file_type';

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
    .replace(/^\uFEFF/, '')
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

export function extractTextEvidenceFromFile(
  input: FileTextExtractionInput
): FileTextExtractionResult {
  const mimeType = normalizeMimeType(input.mimeType);
  const extension = getFileExtension(input.fileName);
  const maxExtractedChars = input.maxExtractedChars ?? DEFAULT_MAX_EXTRACTED_CHARS;
  const maxEvidences = input.maxEvidences ?? DEFAULT_MAX_EVIDENCES;
  const maxEvidenceChars = input.maxEvidenceChars ?? DEFAULT_MAX_EVIDENCE_CHARS;

  if (isPdfFile(mimeType, extension)) {
    return {
      read_status: 'pdf_parser_unavailable',
      extracted_chars: 0,
      evidences: [],
      warning: 'PDF baixado, mas parser PDF não está habilitado nesta sprint.',
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
