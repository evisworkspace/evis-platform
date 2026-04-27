import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { getServerEnv, loadServerEnv } from '../lib/serverEnv';
import {
  PHASE1_SPECIALISTS_BY_ID,
  type Phase1SpecialistId,
} from '../orcamentista/specialistCatalog';
import { getSpecialistKnowledgePrompt } from '../orcamentista/specialistKnowledge';

type Microcase = {
  id: string;
  disciplina: string;
  titulo: string;
  objetivo: string;
  entrada: {
    tipo: string;
    fonte: string;
    conteudo: string;
  };
  saida_esperada: {
    fatos_minimos?: string[];
    campos_obrigatorios?: Record<string, number>;
    nao_pode_fazer?: string[];
  };
  erros_proibidos: string[];
  gatilhos_hitl: string[];
  criterio_aprovacao: Record<string, boolean>;
};

type SpecialistConflict = {
  titulo: string;
  descricao: string;
  severidade: 'baixa' | 'media' | 'alta';
  evidencias: string[];
};

type QuantitativoCandidato = {
  item: string;
  unidade: string | null;
  quantidade: number | null;
  observacao: string;
};

type GenericSpecialistOutput = {
  specialist_id: string;
  specialist_nome: string;
  disciplina: string;
  escopo: string;
  achados: string[];
  conflitos: SpecialistConflict[];
  quantitativos_chave: QuantitativoCandidato[];
  itens_orcamentarios_candidatos: string[];
  premissas: string[];
  perguntas_hitl: string[];
  evidencias_criticas: string[];
  confianca: number;
};

type JudgeOutput = {
  passed: boolean;
  score: number;
  checks?: Record<string, boolean>;
  checks_positivos?: Record<string, boolean>;
  checks_negativos?: Record<string, boolean>;
  erros_detectados: string[];
  resumo: string;
};

type BaselineCaseResult = {
  microcase_id: string;
  titulo: string;
  passed: boolean;
  score: number;
  checks: Record<string, boolean>;
  positive_checks: Record<string, boolean>;
  negative_checks: Record<string, boolean>;
  supplemental_checks: Record<string, boolean>;
  erros_detectados: string[];
  resumo: string;
  output: GenericSpecialistOutput;
};

type DisciplineBaselineConfig = {
  specialistId: Phase1SpecialistId;
  directoryName: string;
  label: string;
  markdownTitle: string;
  outputPrefix: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '../..');

loadServerEnv();

function extractJsonBlock(text: string): string {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = text.indexOf('{');
  if (start === -1) {
    throw new Error('Nenhum JSON encontrado na resposta.');
  }

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  throw new Error('JSON incompleto retornado pelo modelo.');
}

function extractText(response: unknown): string {
  const candidate = (response as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  }).candidates?.[0];
  const parts = candidate?.content?.parts || [];
  return parts.map((part) => part.text || '').join('').trim();
}

function parseJson<T>(text: string): T {
  return JSON.parse(extractJsonBlock(text)) as T;
}

async function repairJson(ai: GoogleGenAI, model: string, brokenText: string, label: string) {
  const response = await ai.models.generateContent({
    model,
    config: { temperature: 0 },
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: [
              'Corrija exclusivamente a estrutura para JSON válido, sem inventar novos fatos.',
              'Retorne somente JSON válido.',
              `Origem: ${label}`,
              '',
              brokenText,
            ].join('\n'),
          },
        ],
      },
    ],
  });

  return extractText(response);
}

async function callGeminiJson<T>(ai: GoogleGenAI, model: string, prompt: string, label: string): Promise<T> {
  const response = await ai.models.generateContent({
    model,
    config: { temperature: 0.1 },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const text = extractText(response);
  if (!text) {
    throw new Error(`${label} retornou vazio.`);
  }

  try {
    return parseJson<T>(text);
  } catch {
    const repaired = await repairJson(ai, model, text, label);
    return parseJson<T>(repaired);
  }
}

async function callAnthropicJson<T>(apiKey: string, model: string, prompt: string, label: string): Promise<T> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1800,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic ${label} falhou: HTTP ${response.status} ${text}`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = (payload.content || [])
    .filter((item) => item.type === 'text' && typeof item.text === 'string')
    .map((item) => item.text || '')
    .join('')
    .trim();

  if (!text) {
    throw new Error(`Anthropic ${label} retornou vazio.`);
  }

  try {
    return parseJson<T>(text);
  } catch {
    throw new Error(`Anthropic ${label} retornou JSON inválido.`);
  }
}

function listMicrocases(microcasesDir: string): string[] {
  return fs
    .readdirSync(microcasesDir)
    .filter((file) => file.endsWith('.json'))
    .sort();
}

function readMicrocase(microcasesDir: string, fileName: string): Microcase {
  return JSON.parse(fs.readFileSync(path.join(microcasesDir, fileName), 'utf-8')) as Microcase;
}

function specialistPrompt(config: DisciplineBaselineConfig, microcase: Microcase): string {
  const specialist = PHASE1_SPECIALISTS_BY_ID[config.specialistId];
  const knowledge = getSpecialistKnowledgePrompt(config.specialistId);

  return [
    'Você está executando um microcaso ouro do EVIS Orçamentista.',
    `Atue somente como especialista de ${specialist.nome}.`,
    'Não invente fatos.',
    'Quando a base não fechar, gere conflito, lacuna ou pergunta HITL.',
    'Em quantitativos_chave, use quantidade = null quando o quantitativo estiver indefinido, aberto ou sem base suficiente.',
    'Use quantidade = 0 apenas quando houver evidência explícita de quantidade zero; nunca use 0 como placeholder de lacuna.',
    'Retorne somente JSON válido.',
    '',
    knowledge,
    '',
    `Especialista: ${specialist.id} (${specialist.nome})`,
    `Foco técnico: ${specialist.foco}`,
    `Erros críticos: ${specialist.erros_criticos.join('; ')}`,
    '',
    'Microcaso:',
    JSON.stringify(microcase, null, 2),
    '',
    'Formato obrigatório:',
    '{',
    `  "specialist_id": "${specialist.id}",`,
    `  "specialist_nome": "${specialist.nome}",`,
    `  "disciplina": "${specialist.nome}",`,
    '  "escopo": "string",',
    '  "achados": ["string"],',
    '  "conflitos": [',
    '    {',
    '      "titulo": "string",',
    '      "descricao": "string",',
    '      "severidade": "baixa|media|alta",',
    '      "evidencias": ["string"]',
    '    }',
    '  ],',
    '  "quantitativos_chave": [',
    '    {',
    '      "item": "string",',
    '      "unidade": "string|null",',
    '      "quantidade": null,',
    '      "observacao": "string"',
    '    }',
    '  ],',
    '  "itens_orcamentarios_candidatos": ["string"],',
    '  "premissas": ["string"],',
    '  "perguntas_hitl": ["string"],',
    '  "evidencias_criticas": ["string"],',
    '  "confianca": 0.0',
    '}',
  ].join('\n');
}

function splitExpectedChecks(microcase: Microcase) {
  const positiveChecks: Record<string, boolean> = {};
  const negativeChecks: Record<string, boolean> = {};

  Object.entries(microcase.criterio_aprovacao || {}).forEach(([key, expected]) => {
    if (expected) {
      positiveChecks[key] = true;
    } else {
      negativeChecks[key] = false;
    }
  });

  return { positiveChecks, negativeChecks };
}

function judgePrompt(config: DisciplineBaselineConfig, microcase: Microcase, output: GenericSpecialistOutput): string {
  const expectedChecks = splitExpectedChecks(microcase);

  return [
    'Você é o avaliador disciplinar do EVIS Orçamentista.',
    `Avalie a saída do especialista ${config.label} contra o microcaso ouro.`,
    'Use critérios estritos e conservadores.',
    'Separe checks positivos de checks negativos.',
    'Em checks_positivos, registre apenas critérios que devem estar presentes; true = passou, false = falhou.',
    'Em checks_negativos, registre apenas comportamentos ou erros que devem permanecer ausentes; false = passou, true = falhou.',
    'Retorne somente JSON válido.',
    '',
    'Microcaso:',
    JSON.stringify(microcase, null, 2),
    '',
    'Saída do especialista:',
    JSON.stringify(output, null, 2),
    '',
    'Critérios positivos esperados:',
    JSON.stringify(expectedChecks.positiveChecks, null, 2),
    '',
    'Critérios negativos esperados:',
    JSON.stringify(expectedChecks.negativeChecks, null, 2),
    '',
    'Formato obrigatório:',
    '{',
    '  "passed": true,',
    '  "score": 0,',
    '  "checks_positivos": {',
    '    "schema_valido": true',
    '  },',
    '  "checks_negativos": {',
    '    "exemplo_de_erro_ausente": false',
    '  },',
    '  "erros_detectados": ["string"],',
    '  "resumo": "string"',
    '}',
  ].join('\n');
}

function mergeChecks(...groups: Array<Record<string, boolean> | undefined>): Record<string, boolean> {
  return Object.assign({}, ...groups.filter(Boolean));
}

function normalizeJudgeOutput(microcase: Microcase, judge: JudgeOutput) {
  const expectedChecks = splitExpectedChecks(microcase);
  const explicitPositive = judge.checks_positivos || {};
  const explicitNegative = judge.checks_negativos || {};
  const legacyChecks = judge.checks || {};

  const positiveKeys = new Set([...Object.keys(expectedChecks.positiveChecks), ...Object.keys(explicitPositive)]);
  const negativeKeys = new Set([...Object.keys(expectedChecks.negativeChecks), ...Object.keys(explicitNegative)]);

  const positiveChecks: Record<string, boolean> = {};
  const negativeChecks: Record<string, boolean> = {};
  const supplementalChecks: Record<string, boolean> = {};

  positiveKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(explicitPositive, key)) {
      positiveChecks[key] = explicitPositive[key];
      return;
    }
    if (Object.prototype.hasOwnProperty.call(legacyChecks, key)) {
      positiveChecks[key] = legacyChecks[key];
    }
  });

  negativeKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(explicitNegative, key)) {
      negativeChecks[key] = explicitNegative[key];
      return;
    }
    if (Object.prototype.hasOwnProperty.call(legacyChecks, key)) {
      negativeChecks[key] = legacyChecks[key];
    }
  });

  Object.entries(legacyChecks).forEach(([key, value]) => {
    if (key in positiveChecks || key in negativeChecks) {
      return;
    }
    supplementalChecks[key] = value;
  });

  Object.entries(explicitPositive).forEach(([key, value]) => {
    if (!(key in positiveChecks)) {
      supplementalChecks[key] = value;
    }
  });

  Object.entries(explicitNegative).forEach(([key, value]) => {
    if (!(key in negativeChecks)) {
      supplementalChecks[key] = value;
    }
  });

  return {
    positiveChecks,
    negativeChecks,
    supplementalChecks,
    checks: mergeChecks(positiveChecks, negativeChecks, supplementalChecks),
  };
}

function formatCheckStatus(value: boolean, expected: boolean): string {
  return value === expected ? 'ok' : 'falhou';
}

function toMarkdown(
  title: string,
  results: BaselineCaseResult[],
  summary: { total: number; passed: number; failed: number; averageScore: number }
) {
  const lines = [
    `# ${title}`,
    '',
    `- Total: ${summary.total}`,
    `- Aprovados: ${summary.passed}`,
    `- Reprovados: ${summary.failed}`,
    `- Score médio: ${summary.averageScore.toFixed(1)}`,
    '',
    '## Resultados por microcaso',
  ];

  for (const result of results) {
    lines.push('');
    lines.push(`### ${result.microcase_id} - ${result.titulo}`);
    lines.push(`- Status: ${result.passed ? 'APROVADO' : 'REPROVADO'}`);
    lines.push(`- Score: ${result.score}`);
    lines.push(`- Resumo: ${result.resumo}`);
    if (result.erros_detectados.length) {
      lines.push('- Erros detectados:');
      result.erros_detectados.forEach((item) => lines.push(`  - ${item}`));
    }
    if (Object.keys(result.positive_checks).length) {
      lines.push('- Checks positivos:');
      Object.entries(result.positive_checks).forEach(([key, value]) => {
        lines.push(`  - ${key}: ${formatCheckStatus(value, true)}`);
      });
    }
    if (Object.keys(result.negative_checks).length) {
      lines.push('- Checks negativos:');
      Object.entries(result.negative_checks).forEach(([key, value]) => {
        lines.push(`  - ${key}: ${formatCheckStatus(value, false)}`);
      });
    }
    if (Object.keys(result.supplemental_checks).length) {
      lines.push('- Checks complementares:');
      Object.entries(result.supplemental_checks).forEach(([key, value]) => {
        lines.push(`  - ${key}: ${value ? 'ok' : 'falhou'}`);
      });
    }
  }

  return lines.join('\n');
}

export async function runDisciplineBaseline(config: DisciplineBaselineConfig) {
  const geminiApiKey = getServerEnv('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY ausente.');
  }

  const anthropicApiKey = getServerEnv('ANTHROPIC_API_KEY');
  const model = getServerEnv('ORCAMENTISTA_MULTIAGENT_MODEL') || 'gemini-2.5-flash';
  const judgeModel = getServerEnv('ORCAMENTISTA_AUDITOR_MODEL') || 'claude-sonnet-4-20250514';
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  const microcasesDir = path.join(ROOT, 'orcamentista', 'exemplos', 'microcasos', config.directoryName);
  const outputDir = path.join(microcasesDir, 'results');
  fs.mkdirSync(outputDir, { recursive: true });

  const cases = listMicrocases(microcasesDir).map((fileName) => readMicrocase(microcasesDir, fileName));
  const results: BaselineCaseResult[] = [];

  for (const microcase of cases) {
    const output = await callGeminiJson<GenericSpecialistOutput>(
      ai,
      model,
      specialistPrompt(config, microcase),
      `baseline-${microcase.id}`
    );

    const judge = anthropicApiKey
      ? await callAnthropicJson<JudgeOutput>(
          anthropicApiKey,
          judgeModel,
          judgePrompt(config, microcase, output),
          `judge-${microcase.id}`
        )
      : await callGeminiJson<JudgeOutput>(ai, model, judgePrompt(config, microcase, output), `judge-${microcase.id}`);
    const normalizedJudge = normalizeJudgeOutput(microcase, judge);

    results.push({
      microcase_id: microcase.id,
      titulo: microcase.titulo,
      passed: judge.passed,
      score: judge.score,
      checks: normalizedJudge.checks,
      positive_checks: normalizedJudge.positiveChecks,
      negative_checks: normalizedJudge.negativeChecks,
      supplemental_checks: normalizedJudge.supplementalChecks,
      erros_detectados: judge.erros_detectados,
      resumo: judge.resumo,
      output,
    });
  }

  const summary = {
    total: results.length,
    passed: results.filter((item) => item.passed).length,
    failed: results.filter((item) => !item.passed).length,
    averageScore:
      results.reduce((acc, item) => acc + item.score, 0) / Math.max(results.length, 1),
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(outputDir, `${config.outputPrefix}_${stamp}.json`);
  const mdPath = path.join(outputDir, `${config.outputPrefix}_${stamp}.md`);

  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        model,
        judge_model: anthropicApiKey ? judgeModel : model,
        summary,
        results,
      },
      null,
      2
    )
  );
  fs.writeFileSync(mdPath, toMarkdown(config.markdownTitle, results, summary));

  console.log(
    JSON.stringify(
      {
        success: true,
        json_report: jsonPath,
        markdown_report: mdPath,
        summary,
      },
      null,
      2
    )
  );
}
