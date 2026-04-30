import { Etapa0Schema } from './contracts';

export const ETAPA0_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    revisao_registry_id: { type: 'STRING' },
    documentos: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          nome: { type: 'STRING' },
          tipo: { type: 'STRING' },
          hash_conteudo: { type: 'STRING' },
        },
        required: ['nome', 'tipo', 'hash_conteudo'],
      },
    },
    disciplinas: { type: 'ARRAY', items: { type: 'STRING' } },
    ambientes: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          nome: { type: 'STRING' },
          metragem_estimada: { type: 'NUMBER' },
          padrao_acabamento: { type: 'STRING' },
        },
        required: ['nome'],
      },
    },
    areas: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          tipo: { type: 'STRING', enum: ['terreno', 'construida', 'permeavel', 'outra'] },
          valor_m2: { type: 'NUMBER' },
        },
        required: ['tipo', 'valor_m2'],
      },
    },
    materiais: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          categoria: { type: 'STRING' },
          especificacao: { type: 'STRING' },
        },
        required: ['categoria', 'especificacao'],
      },
    },
    sistemas: { type: 'ARRAY', items: { type: 'STRING' } },
    lacunas: { type: 'ARRAY', items: { type: 'STRING' } },
    conflitos: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          descricao: { type: 'STRING' },
          severidade: { type: 'STRING', enum: ['baixa', 'media', 'alta'] },
          impacto_financeiro_estimado: { type: 'BOOLEAN' },
        },
        required: ['descricao', 'severidade', 'impacto_financeiro_estimado'],
      },
    },
    alertas: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          mensagem: { type: 'STRING' },
          tipo: { type: 'STRING', enum: ['tecnico', 'normativo', 'economico'] },
        },
        required: ['mensagem', 'tipo'],
      },
    },
    evidencias: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          dado_extraido: { type: 'STRING' },
          fonte_referencia: { type: 'STRING' },
        },
        required: ['dado_extraido', 'fonte_referencia'],
      },
    },
    pendencias_hitl: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: [
    'revisao_registry_id',
    'documentos',
    'disciplinas',
    'ambientes',
    'areas',
    'materiais',
    'sistemas',
    'lacunas',
    'conflitos',
    'alertas',
    'evidencias',
    'pendencias_hitl',
  ],
};

export const ETAPA0_EXTRACTION_INSTRUCTION = `Voce e o extrator factual da ETAPA 0 do Orcamentista EVIS.

Leia os documentos anexados no contexto multimodal e retorne SOMENTE JSON valido no schema solicitado.

Regras obrigatorias:
- Nao invente ambientes, areas, materiais, sistemas ou quantitativos.
- Se um dado nao estiver explicito, deixe fora do campo factual e registre a lacuna em "lacunas" ou "pendencias_hitl".
- Para cada dado tecnico relevante, inclua evidencia com nome do arquivo, folha/prancha/pagina quando possivel e trecho curto.
- Classifique documentos por disciplina quando houver indicacao no nome ou no conteudo.
- Registre conflitos quando duas fontes se contradizem; nao escolha um lado sem evidencia.
- Use "pendencias_hitl" para perguntas objetivas que precisam de validacao humana antes da Etapa 1.
- Use "revisao_registry_id" como identificador curto da rodada, baseado nos documentos lidos.`;

export interface Etapa0Validation {
  status: 'ERRO_ETAPA_0' | 'ETAPA_0_EM_REVISAO_HITL';
  errors: string[];
  warnings: string[];
}

export function validateEtapa0(etapa0: Partial<Etapa0Schema> | null | undefined): Etapa0Validation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!etapa0 || typeof etapa0 !== 'object') {
    return {
      status: 'ERRO_ETAPA_0',
      errors: ['ETAPA 0 ausente ou invalida.'],
      warnings,
    };
  }

  if (!Array.isArray(etapa0.documentos) || etapa0.documentos.length === 0) {
    errors.push('Nenhum documento foi inventariado.');
  }

  if (!Array.isArray(etapa0.disciplinas) || etapa0.disciplinas.length === 0) {
    warnings.push('Nenhuma disciplina tecnica foi identificada.');
  }

  if (!Array.isArray(etapa0.evidencias) || etapa0.evidencias.length === 0) {
    warnings.push('Extracao sem evidencias rastreaveis.');
  }

  if (Array.isArray(etapa0.areas)) {
    const invalidAreas = etapa0.areas.filter((area) => !Number.isFinite(area.valor_m2));
    if (invalidAreas.length) {
      errors.push(`${invalidAreas.length} area(s) com valor_m2 invalido.`);
    }
  }

  return {
    status: errors.length ? 'ERRO_ETAPA_0' : 'ETAPA_0_EM_REVISAO_HITL',
    errors,
    warnings,
  };
}

export function formatEtapa0Markdown(etapa0: Etapa0Schema, validation: Etapa0Validation): string {
  const list = (items: string[]) => (items.length ? items.map((item) => `- ${item}`).join('\n') : '- Nenhum item registrado.');
  const documentos = etapa0.documentos.map((doc) => `- ${doc.nome} (${doc.tipo}) - hash: ${doc.hash_conteudo}`).join('\n');
  const ambientes = etapa0.ambientes
    .map((ambiente) => {
      const area = typeof ambiente.metragem_estimada === 'number' ? ` - ${ambiente.metragem_estimada} m2` : '';
      const padrao = ambiente.padrao_acabamento ? ` - ${ambiente.padrao_acabamento}` : '';
      return `- ${ambiente.nome}${area}${padrao}`;
    })
    .join('\n');
  const areas = etapa0.areas.map((area) => `- ${area.tipo}: ${area.valor_m2} m2`).join('\n');
  const materiais = etapa0.materiais.map((item) => `- ${item.categoria}: ${item.especificacao}`).join('\n');
  const conflitos = etapa0.conflitos
    .map((conflito) => `- ${conflito.descricao} | severidade: ${conflito.severidade} | impacto financeiro: ${conflito.impacto_financeiro_estimado ? 'sim' : 'nao'}`)
    .join('\n');
  const alertas = etapa0.alertas
    .map((alerta) => `- ${alerta.mensagem} | tipo: ${alerta.tipo}`)
    .join('\n');
  const evidencias = etapa0.evidencias
    .map((ev) => `- ${ev.dado_extraido} | fonte: ${ev.fonte_referencia}`)
    .join('\n');

  return [
    '# ETAPA 0 - Extracao factual',
    '',
    `**Status:** ${validation.status}`,
    `**Revisao registry:** ${etapa0.revisao_registry_id}`,
    '',
    '## Documentos inventariados',
    documentos || '- Nenhum documento registrado.',
    '',
    '## Disciplinas identificadas',
    list(etapa0.disciplinas),
    '',
    '## Ambientes',
    ambientes || '- Nenhum ambiente registrado.',
    '',
    '## Areas',
    areas || '- Nenhuma area registrada.',
    '',
    '## Materiais',
    materiais || '- Nenhum material registrado.',
    '',
    '## Sistemas',
    list(etapa0.sistemas),
    '',
    '## Evidencias',
    evidencias || '- Nenhuma evidencia registrada.',
    '',
    '## Lacunas',
    list(etapa0.lacunas),
    '',
    '## Conflitos',
    conflitos || '- Nenhum conflito registrado.',
    '',
    '## Alertas',
    alertas || '- Nenhum alerta registrado.',
    '',
    '## Pendencias HITL',
    list(etapa0.pendencias_hitl),
    '',
    '## Diagnostico do contrato',
    validation.errors.length ? list(validation.errors) : '- Sem erros bloqueantes.',
    validation.warnings.length ? '\n### Alertas\n' + list(validation.warnings) : '',
    '',
  ].join('\n');
}
