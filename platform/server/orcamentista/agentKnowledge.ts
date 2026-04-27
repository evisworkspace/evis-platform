import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export type MultiAgentRole =
  | 'reader'
  | 'planner'
  | 'specialist_quantitativos'
  | 'specialist_composicao'
  | 'auditor'
  | 'auditor_arbiter';

export interface KnowledgePacket {
  prompt: string;
  sources: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ORCAMENTISTA_ROOT = path.resolve(__dirname, '../../orcamentista');

const SHARED_FILES = ['SKILL_ORQUESTRADOR.md', 'docs/REGRAS_DE_NEGOCIO.md'];

const ROLE_CHARTERS: Record<MultiAgentRole, string> = {
  reader: [
    'Você é o leitor técnico multimodal do Orçamentista EVIS.',
    '- Sua prioridade é identificar disciplina, tipo de documento, revisão, dados-chave e evidências.',
    '- Você deve distinguir fato visível, hipótese operacional e lacuna de informação.',
    '- Quando a prancha ou memorial estiver incompleto, registre limites da leitura em vez de preencher com chute.',
    '- Sua saída serve como matéria-prima dos demais agentes; seja conservador e auditável.',
  ].join('\n'),
  planner: [
    'Você é o planejador do fluxo técnico do orçamento.',
    '- Sua função é mapear as disciplinas do projeto e distribuir a analise para os especialistas corretos.',
    '- No MVP, voce pode definir um foco inicial de aprofundamento, mas nunca deve tratar isso como cobertura completa do projeto.',
    '- Você deve respeitar a fronteira entre Orcamentista e EVIS Obra.',
    '- O foco é preparar a próxima rodada de análise com dependências claras e sem avançar etapas sem base.',
    '- Toda estratégia deve considerar HITL obrigatório e memória oficial em workspace local.',
  ].join('\n'),
  specialist_quantitativos: [
    'Você é o especialista de quantitativos do Orçamentista EVIS.',
    '- Sua função é aprofundar a disciplina piloto para levantar medições, áreas, volumes, comprimentos e quantitativos candidatos.',
    '- Você faz parte de uma malha de especialistas por engenharia e nao deve assumir sozinho a cobertura completa da obra.',
    '- Use leitura de projeto e referências técnicas para justificar cada quantitativo com lógica de medição, fórmula ou evidência documental.',
    '- Não aplique custos nem feche orçamento; entregue base técnica auditável para a próxima camada.',
    '- Quando a prancha não permitir medição confiável, marque a lacuna explicitamente e proponha a validação HITL necessária.',
  ].join('\n'),
  specialist_composicao: [
    'Você é o especialista de composição de custos do Orçamentista EVIS.',
    '- Sua função é transformar a leitura técnica e os quantitativos candidatos em composições parciais de custo e pendências de orçamento.',
    '- Você faz parte de uma malha de especialistas por engenharia e nao deve consolidar sozinho o orcamento global da obra.',
    '- Use regras de negócio, schema EVIS e referências de serviço para mapear códigos, unidades, composições e premissas de custo.',
    '- Não invente preço definitivo sem lastro; trate toda composição sem referência sólida como candidata ou pendente de consulta.',
    '- Quando faltar quantitativo fechado, explicite o impacto disso na composição e quais confirmações humanas são necessárias.',
  ].join('\n'),
  auditor: [
    'Você é o auditor independente do Orçamentista EVIS.',
    '- Sua função é revisar consistência, cobertura, conflitos, lacunas e riscos da análise especialista.',
    '- Não reescreva tudo; aponte onde a análise ficou fraca, contraditória ou insuficiente.',
    '- Considere regras de negócio, fronteira do produto e aderência ao fluxo HITL.',
    '- Prefira reprovar a rodada para revisão a deixar um conflito relevante passar.',
  ].join('\n'),
  auditor_arbiter: [
    'Você é o árbitro final de auditoria do Orçamentista EVIS.',
    '- Só entra quando a rodada está fraca, conflituosa ou abaixo do threshold.',
    '- Sua função é arbitrar a qualidade da rodada e devolver um parecer final objetivo.',
    '- Seja mais exigente do que o auditor primário e priorize segurança operacional.',
    '- Se a rodada estiver insuficiente, marque revisao_necessaria sem hesitar.',
  ].join('\n'),
};

const ROLE_FILES: Record<MultiAgentRole, string[]> = {
  reader: ['skills/SKILL_LEITURA_PROJETO.md', 'docs/REFERENCIAS_TECNICAS.md'],
  planner: ['docs/FRONTEIRA_ORCAMENTISTA_X_EVIS_OBRA.md'],
  specialist_quantitativos: [
    'skills/SKILL_LEITURA_PROJETO.md',
    'skills/SKILL_QUANTITATIVOS.md',
    'docs/REFERENCIAS_TECNICAS.md',
    'docs/ESPECIFICACAO_CODIGO_SERVICO.md',
  ],
  specialist_composicao: [
    'skills/SKILL_COMPOSICAO_CUSTOS.md',
    'docs/REFERENCIAS_TECNICAS.md',
    'docs/ESPECIFICACAO_CODIGO_SERVICO.md',
    'docs/SCHEMA_JSON_EVIS.md',
  ],
  auditor: [
    'skills/SKILL_LEITURA_PROJETO.md',
    'skills/SKILL_QUANTITATIVOS.md',
    'skills/SKILL_COMPOSICAO_CUSTOS.md',
    'docs/REFERENCIAS_TECNICAS.md',
    'docs/ESPECIFICACAO_CODIGO_SERVICO.md',
    'docs/SCHEMA_JSON_EVIS.md',
    'docs/FRONTEIRA_ORCAMENTISTA_X_EVIS_OBRA.md',
  ],
  auditor_arbiter: [
    'skills/SKILL_LEITURA_PROJETO.md',
    'skills/SKILL_QUANTITATIVOS.md',
    'skills/SKILL_COMPOSICAO_CUSTOS.md',
    'docs/REFERENCIAS_TECNICAS.md',
    'docs/ESPECIFICACAO_CODIGO_SERVICO.md',
    'docs/SCHEMA_JSON_EVIS.md',
    'docs/FRONTEIRA_ORCAMENTISTA_X_EVIS_OBRA.md',
  ],
};

const cache = new Map<MultiAgentRole, KnowledgePacket>();

function resolveFile(relativePath: string): string {
  return path.join(ORCAMENTISTA_ROOT, relativePath);
}

function loadFile(relativePath: string): { label: string; content: string } {
  const absolutePath = resolveFile(relativePath);
  const label = relativePath.replace(/\\/g, '/');

  try {
    const content = fs.readFileSync(absolutePath, 'utf-8').trim();
    return { label, content };
  } catch {
    return {
      label,
      content: `ARQUIVO NÃO ENCONTRADO: ${label}`,
    };
  }
}

function buildPrompt(role: MultiAgentRole, files: Array<{ label: string; content: string }>): string {
  const sections = files.map(({ label, content }) =>
    [`## ${label}`, '', content].join('\n')
  );

  return [
    '# BASE DE CONHECIMENTO DO SUBAGENTE',
    '',
    ROLE_CHARTERS[role],
    '',
    'Aplique o conhecimento abaixo como regra operacional do seu papel. Quando houver conflito entre teoria e evidência do projeto, prevalece a evidência documentada e a lacuna deve ser explicitada.',
    '',
    ...sections,
  ].join('\n');
}

export function getKnowledgePacket(role: MultiAgentRole): KnowledgePacket {
  const cached = cache.get(role);
  if (cached) {
    return cached;
  }

  const relativeFiles = [...SHARED_FILES, ...ROLE_FILES[role]];
  const uniqueRelativeFiles = Array.from(new Set(relativeFiles));
  const loadedFiles = uniqueRelativeFiles.map(loadFile);

  const packet: KnowledgePacket = {
    prompt: buildPrompt(role, loadedFiles),
    sources: loadedFiles.map((file) => file.label),
  };

  cache.set(role, packet);
  return packet;
}
