import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SPECIALISTS_BY_ID, type SpecialistId } from './specialistCatalog';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ORCAMENTISTA_ROOT = path.resolve(__dirname, '../../orcamentista');

const cache = new Map<SpecialistId, string>();
const sourceCache = new Map<SpecialistId, string[]>();

function resolveFile(relativePath: string): string {
  return path.join(ORCAMENTISTA_ROOT, relativePath);
}

function loadFile(relativePath: string): string {
  try {
    return fs.readFileSync(resolveFile(relativePath), 'utf-8').trim();
  } catch {
    return `ARQUIVO NÃO ENCONTRADO: ${relativePath}`;
  }
}

export function getSpecialistKnowledgePrompt(specialistId: SpecialistId): string {
  const cached = cache.get(specialistId);
  if (cached) {
    return cached;
  }

  const entry = SPECIALISTS_BY_ID[specialistId];
  const knowledgePaths = entry.knowledge_paths || [];
  const sections = knowledgePaths.map((relativePath) =>
    [`## ${relativePath}`, '', loadFile(relativePath)].join('\n')
  );

  const prompt = sections.length
    ? ['# BASE DE CONHECIMENTO ESPECIFICA DO ESPECIALISTA', '', ...sections].join('\n')
    : '# BASE DE CONHECIMENTO ESPECIFICA DO ESPECIALISTA\n\nSem pacote dedicado adicional nesta rodada.';

  cache.set(specialistId, prompt);
  sourceCache.set(specialistId, knowledgePaths);
  return prompt;
}

export function getSpecialistKnowledgeSources(specialistId: SpecialistId): string[] {
  const cached = sourceCache.get(specialistId);
  if (cached) {
    return cached;
  }

  const prompt = getSpecialistKnowledgePrompt(specialistId);
  void prompt;
  return sourceCache.get(specialistId) || [];
}
