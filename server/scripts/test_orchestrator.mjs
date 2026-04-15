/**
 * Teste do Orquestrador Semântico — Passo 6
 * Arquivo .mjs puro para contornar o problema do esbuild no Node 24/Windows.
 * Espelha fielmente a lógica do orchestrator.ts.
 *
 * Executar: NODE_TLS_REJECT_UNAUTHORIZED=0 node server/scripts/test_orchestrator.mjs
 */

// TLS bypass necessário no ambiente MINGW64/Windows sem CA bundle correto
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jwutiebpfauwzzltwgbb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dXRpZWJwZmF1d3p6bHR3Z2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTYzOTIsImV4cCI6MjA5MTM5MjM5Mn0.KtzdQn2j1z4ugGFIyZgFDBfO--38FTBeKLT_RXMkflU'
);

// ── CAMADA 0 — Normalização ────────────────────────────────────
function normalizarEntrada(entradas) {
  const textoOriginal = entradas.map(e => e.conteudo).join('\n\n');
  let textoNormalizado = textoOriginal
    .replace(/\btá\b/gi, 'está').replace(/\bpra\b/gi, 'para a')
    .replace(/\bpro\b/gi, 'para o').replace(/\bseu\s+(\w+)/gi, '$1')
    .replace(/\bdona\s+(\w+)/gi, '$1').replace(/\s+/g, ' ').trim();
  return { texto_original: textoOriginal, texto_normalizado: textoNormalizado, termos_resolvidos: [] };
}

// ── CAMADA 1 — Eventos ─────────────────────────────────────────
const PADROES = [
  { tipo: 'execucao_servico', re: /instalou|assentou|concluiu|terminou|iniciou|colocou|montou|veio e|pessoal da|equipe de/i, certeza: 'explicito' },
  { tipo: 'problema_obra',    re: /faltou|falta|acabou|não tem|problema|quebrou/i, certeza: 'explicito' },
  { tipo: 'pedido_cliente',   re: /cliente (pediu|solicitou|quer|passou|ligou)/i, certeza: 'explicito' },
  { tipo: 'decisao_projeto',  re: /decidiu|vai mudar|pediu para mudar|quer mudar/i, certeza: 'explicito' },
  { tipo: 'visita_obra',      re: /cliente (veio|passou|visitou)/i, certeza: 'explicito' },
  { tipo: 'chegada_material', re: /chegou|entregou|descarregou/i, certeza: 'explicito' },
];

function detectarEventos(texto) {
  const linhas = texto.split(/[.!?\n]+/).filter(l => l.trim().length > 5);
  const eventos = [];
  for (const linha of linhas) {
    for (const def of PADROES) {
      if (def.re.test(linha)) {
        if (!eventos.some(e => e.tipo === def.tipo && e.trecho_narrativa === linha.trim())) {
          eventos.push({ tipo: def.tipo, trecho_narrativa: linha.trim(), certeza: def.certeza });
          break;
        }
      }
    }
  }
  if (eventos.length === 0)
    eventos.push({ tipo: 'sem_atividade', trecho_narrativa: texto.substring(0, 80), certeza: 'inferido' });
  return eventos;
}

// ── CAMADA 2 — Domínios ────────────────────────────────────────
const EVENTO_DOMINIO = {
  execucao_servico: ['equipe', 'orcamento', 'cronograma'],
  problema_obra:    ['pendencias', 'notas'],
  pedido_cliente:   ['notas', 'pendencias'],
  decisao_projeto:  ['notas'],
  visita_obra:      ['notas'],
  chegada_material: ['notas'],
  sem_atividade:    [],
};
function classificarDominios(eventos) {
  const s = new Set();
  eventos.forEach(e => (EVENTO_DOMINIO[e.tipo] || []).forEach(d => s.add(d)));
  return [...s];
}

// ── CAMADA 3 — Resolução de entidade (Supabase real) ──────────
function extrairCandidatos(texto) {
  const candidatos = [];
  const reEquipe = /(?:pessoal da|equipe de|equipe da|time de|os da)\s+([a-záéíóúãõâêîôûç\s]+?)(?=\s+(?:veio|trabalhou|fez|instalou|assentou)|[,.!?]|$)/gi;
  const reServico = /(?:instalou|assentou|fez|colocou|montou)\s+(?:os?\s+|as?\s+)?([a-záéíóúãõâêîôûç\s]+?)(?=\s+(?:da|do|de|no|na)\s+[a-záéíóúãõâêîôûç]+|[,.!?]|$)/gi;
  const reAmbiente = /(?:da|do|no|na|em)\s+(cozinha|banheiro|sala|quarto|churrasqueira|garagem|salão)/gi;
  let m;
  while ((m = reEquipe.exec(texto)) !== null) candidatos.push({ termo: m[1].trim(), tipo: 'equipe' });
  while ((m = reServico.exec(texto)) !== null) { if (m[1].trim().length > 3) candidatos.push({ termo: m[1].trim(), tipo: 'servico' }); }
  while ((m = reAmbiente.exec(texto)) !== null) candidatos.push({ termo: m[1].trim(), tipo: 'ambiente' });
  return candidatos;
}

async function resolverEntidades(texto, obra_id) {
  const candidatos = extrairCandidatos(texto);
  const resolvidas = [];
  const vistas = new Map();

  for (const c of candidatos) {
    const termo = c.termo.toLowerCase().trim();

    if (c.tipo === 'servico') {
      const { data: exatos } = await supabase.from('servicos').select('id, nome, aliases').eq('obra_id', obra_id).ilike('nome', `%${termo}%`).limit(3);
      if (exatos?.length) {
        resolvidas.push({ texto_original: c.termo, tipo: 'servico', entidade_id: exatos[0].id, nome_oficial: exatos[0].nome, confianca: 0.90, metodo: 'exato' });
        continue;
      }
      const { data: porAlias } = await supabase.from('servicos').select('id, nome').eq('obra_id', obra_id).contains('aliases', [termo]).limit(3);
      if (porAlias?.length) {
        resolvidas.push({ texto_original: c.termo, tipo: 'servico', entidade_id: porAlias[0].id, nome_oficial: porAlias[0].nome, confianca: 0.85, metodo: 'alias' });
        continue;
      }
      resolvidas.push({ texto_original: c.termo, tipo: 'servico', entidade_id: null, nome_oficial: null, confianca: 0.0, metodo: 'nao_resolvido' });
    }

    if (c.tipo === 'equipe') {
      const { data: equipes } = await supabase.from('equipes_cadastro').select('id, nome, funcao').eq('obra_id', obra_id).or(`nome.ilike.%${termo}%,funcao.ilike.%${termo}%`).limit(3);
      if (equipes?.length) {
        resolvidas.push({ texto_original: c.termo, tipo: 'equipe', entidade_id: equipes[0].id, nome_oficial: equipes[0].nome, confianca: 0.90, metodo: 'exato' });
        continue;
      }
      const { data: porAlias } = await supabase.from('equipes_cadastro').select('id, nome').eq('obra_id', obra_id).contains('aliases', [termo]).limit(3);
      if (porAlias?.length) {
        resolvidas.push({ texto_original: c.termo, tipo: 'equipe', entidade_id: porAlias[0].id, nome_oficial: porAlias[0].nome, confianca: 0.85, metodo: 'alias' });
        continue;
      }
      resolvidas.push({ texto_original: c.termo, tipo: 'equipe', entidade_id: null, nome_oficial: null, confianca: 0.0, metodo: 'nao_resolvido' });
    }

    if (c.tipo === 'ambiente') {
      resolvidas.push({ texto_original: c.termo, tipo: 'ambiente', entidade_id: null, nome_oficial: c.termo, confianca: 0.70, metodo: 'semantico' });
    }
  }

  // Deduplicar por entidade_id
  for (const e of resolvidas) {
    const chave = e.entidade_id ?? `nr_${e.texto_original}`;
    if (!vistas.has(chave) || e.confianca > vistas.get(chave).confianca) vistas.set(chave, e);
  }
  return [...vistas.values()];
}

// ── CAMADA 4 — Ações ───────────────────────────────────────────
function extrairAcoes(eventos, entidades, texto) {
  const acoes = [];
  const equipes = entidades.filter(e => e.tipo === 'equipe');
  const servicos = entidades.filter(e => e.tipo === 'servico');

  for (const ev of eventos) {
    const t = ev.trecho_narrativa;
    if (ev.tipo === 'execucao_servico') {
      for (const eq of equipes) {
        acoes.push({ dominio: 'equipe', tipo: 'marcar_presenca', entidade_id: eq.entidade_id,
          dados: { nome_equipe: eq.nome_oficial ?? eq.texto_original }, confianca: eq.confianca,
          motivo: `Execução: "${t}"`, requer_input_gestor: eq.confianca < 0.65 });
      }
      for (const sv of servicos) {
        const pct = t.match(/(\d+)\s*%/);
        const avanco = pct ? parseInt(pct[1]) : null;
        acoes.push({ dominio: 'orcamento', tipo: avanco != null ? 'atualizar_avanco' : 'iniciar_servico',
          entidade_id: sv.entidade_id, dados: { nome_servico: sv.nome_oficial ?? sv.texto_original, avanco_novo: avanco },
          confianca: sv.confianca * (avanco != null ? 1 : 0.75), motivo: `Execução: "${t}"`,
          requer_input_gestor: sv.confianca < 0.65 || avanco === null,
          pergunta_gestor: avanco === null ? `Qual % do serviço "${sv.nome_oficial ?? sv.texto_original}"?` : undefined });
        acoes.push({ dominio: 'cronograma', tipo: avanco === 100 ? 'registrar_conclusao' : 'registrar_inicio',
          entidade_id: sv.entidade_id, dados: { nome_servico: sv.nome_oficial ?? sv.texto_original },
          confianca: sv.confianca * 0.90, motivo: 'Impacto de execução', requer_input_gestor: sv.confianca < 0.65 });
      }
      if (servicos.length === 0) {
        acoes.push({ dominio: 'orcamento', tipo: 'iniciar_servico', entidade_id: null,
          dados: { trecho_original: t }, confianca: 0.40, motivo: 'Serviço não identificado',
          requer_input_gestor: true, pergunta_gestor: `Qual serviço foi executado? ("${t.substring(0,80)}")` });
      }
    }
    if (ev.tipo === 'problema_obra') {
      const isMaterial = /faltou|falta|acabou|não tem/i.test(t);
      acoes.push({ dominio: 'pendencias', tipo: 'criar_pendencia', entidade_id: null,
        dados: { descricao: t, prioridade: isMaterial ? 'media' : 'alta', categoria: isMaterial ? 'material' : 'problema' },
        confianca: 0.90, motivo: 'Problema detectado', requer_input_gestor: false });
      acoes.push({ dominio: 'notas', tipo: 'criar_nota', entidade_id: null,
        dados: { tipo: 'alerta', texto: t }, confianca: 0.85, motivo: 'Registro de ocorrência', requer_input_gestor: false });
    }
    if (ev.tipo === 'pedido_cliente' || ev.tipo === 'visita_obra') {
      acoes.push({ dominio: 'notas', tipo: 'criar_nota', entidade_id: null,
        dados: { tipo: 'decisao', texto: t }, confianca: 0.90, motivo: 'Pedido do cliente', requer_input_gestor: false });
      acoes.push({ dominio: 'pendencias', tipo: 'criar_pendencia', entidade_id: null,
        dados: { descricao: t, prioridade: 'media', categoria: 'solicitacao_cliente' },
        confianca: 0.85, motivo: 'Pedido gera pendência', requer_input_gestor: false });
    }
    if (ev.tipo === 'decisao_projeto') {
      acoes.push({ dominio: 'notas', tipo: 'criar_nota', entidade_id: null,
        dados: { tipo: 'decisao', texto: t }, confianca: 0.90, motivo: 'Decisão registrada', requer_input_gestor: false });
    }
  }
  return acoes;
}

// ── CAMADA 5 — Filtro ──────────────────────────────────────────
function filtrarAcoes(acoes) {
  const mapa = new Map();
  for (const a of acoes) {
    const k = `${a.dominio}|${a.tipo}|${a.entidade_id ?? 'null'}`;
    if (!mapa.has(k) || a.confianca > mapa.get(k).confianca) mapa.set(k, a);
  }
  return [...mapa.values()].filter(a => a.confianca > 0.30);
}

// ── CAMADA 6 — Impactos ────────────────────────────────────────
function calcularImpactos(acoes) {
  const impactos = [];
  const doms = new Set(acoes.map(a => a.dominio));
  if (doms.has('orcamento')) impactos.push({ origem: 'orcamento', afeta: ['cronograma'], tipo_impacto: 'requer_calculo' });
  if (doms.has('equipe') && doms.has('orcamento')) impactos.push({ origem: 'equipe', afeta: ['orcamento'], tipo_impacto: 'automatico' });
  return impactos;
}

// ── CAMADA 7 — Dispatch ────────────────────────────────────────
const DOMINIO_AGENTE = { equipe: 'equipe_agent', orcamento: 'orcamento_agent', cronograma: 'cronograma_agent',
  notas: 'notas_agent', pendencias: 'pendencias_agent', fotos: 'fotos_agent', financeiro: 'notas_agent' };
function montarDispatch(acoes, contexto) {
  const mapa = new Map();
  for (const a of acoes) {
    const ag = DOMINIO_AGENTE[a.dominio];
    if (!mapa.has(ag)) mapa.set(ag, []);
    mapa.get(ag).push(a);
  }
  return [...mapa.entries()].map(([agent, acoesAg]) => ({
    agent, payload: { acoes: acoesAg, contexto_obra: contexto, data_referencia: contexto.data_referencia }
  }));
}

// ── CAMADA 8 — HITL ────────────────────────────────────────────
function montarHITL(acoes, dominios, entidades, dispatch) {
  const confiancas = acoes.map(a => a.confianca);
  const media = confiancas.length ? confiancas.reduce((s, c) => s + c, 0) / confiancas.length : 0;
  const equipes = entidades.filter(e => e.tipo === 'equipe' && e.nome_oficial).map(e => e.nome_oficial);
  const servicos = entidades.filter(e => e.tipo === 'servico' && e.nome_oficial).map(e => e.nome_oficial);
  const resumo = [
    equipes.length ? `Equipes: ${equipes.join(', ')}` : null,
    servicos.length ? `Serviços: ${servicos.join(', ')}` : null,
    `${acoes.filter(a => a.dominio === 'pendencias').length} pendência(s)`,
    `${acoes.filter(a => a.dominio === 'notas').length} nota(s)`,
  ].filter(Boolean).join(' | ');
  return { resumo, acoes_propostas: acoes, dominios_afetados: dominios, entidades_resolvidas: entidades,
    dispatch, threshold_confirmacao: 0.85, threshold_aviso: 0.65, confianca_geral: Math.round(media * 100) / 100 };
}

// ── MAIN ───────────────────────────────────────────────────────
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   TESTE ORQUESTRADOR SEMÂNTICO — PASSO 6            ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const { data: obras, error } = await supabase.from('obras').select('id, nome').limit(1);
  if (error || !obras?.length) { console.error('[ERRO] Obra não encontrada:', error?.message); return; }

  const obra_id = obras[0].id;
  console.log(`[Obra] ${obras[0].nome} (${obra_id})\n`);

  const contexto = { obra_id, data_referencia: new Date().toISOString().split('T')[0], status_atual: { semana_relativa: 'S12' } };

  const narrativaTeste = `
    Hoje o pessoal da marcenaria veio e instalou os móveis da cozinha.
    A bancada da churrasqueira também foi assentada.
    Faltou rejunte, vou pedir amanhã.
    Cliente passou e pediu para mudar a torneira da pia.
  `;

  const entradas = [{ tipo: 'texto', conteudo: narrativaTeste }];

  // ── CAMADAS ──────────────────────────────────────────────────
  console.log('[C0] Normalizando entrada...');
  const normalizacao = normalizarEntrada(entradas);

  console.log('[C1] Detectando eventos...');
  const eventos = detectarEventos(normalizacao.texto_normalizado);
  console.log(`     → ${eventos.length} evento(s): ${eventos.map(e => e.tipo).join(', ')}`);

  console.log('[C2] Classificando domínios...');
  const dominios = classificarDominios(eventos);
  console.log(`     → ${dominios.join(', ')}`);

  console.log('[C3] Resolvendo entidades no Supabase...');
  const entidades_resolvidas = await resolverEntidades(normalizacao.texto_normalizado, obra_id);
  console.log(`     → ${entidades_resolvidas.length} entidade(s):`);
  entidades_resolvidas.forEach(e =>
    console.log(`       [${e.metodo.padEnd(14)}] confiança=${e.confianca.toFixed(2)} | ${e.tipo.padEnd(8)} | "${e.texto_original}" → ${e.nome_oficial ?? 'NÃO RESOLVIDO'}`)
  );

  console.log('[C4] Extraindo ações...');
  const acoesRaw = extrairAcoes(eventos, entidades_resolvidas, normalizacao.texto_normalizado);

  console.log('[C5] Filtrando...');
  const acoes = filtrarAcoes(acoesRaw);
  console.log(`     → ${acoes.length} ação(ões) após filtro`);

  console.log('[C6] Calculando impactos...');
  const impactos = calcularImpactos(acoes);
  console.log(`     → ${impactos.length} impacto(s)`);

  console.log('[C7] Montando dispatch...');
  const dispatch = montarDispatch(acoes, contexto);
  console.log(`     → ${dispatch.length} agente(s): ${dispatch.map(d => d.agent).join(', ')}`);

  console.log('[C8] Gerando saída HITL...\n');
  const hitl = montarHITL(acoes, dominios, entidades_resolvidas, dispatch);

  // ── RESULTADO FINAL ───────────────────────────────────────────
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   RESULTADO: ProcessamentoOrquestrador               ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const resultado = {
    obra_id, data_referencia: contexto.data_referencia, entradas_dia: entradas.length,
    normalizacao: { texto_normalizado: normalizacao.texto_normalizado.trim().substring(0, 120) + '...' },
    eventos, dominios, entidades_resolvidas, acoes, impactos, dispatch, hitl
  };

  console.dir(resultado, { depth: null, colors: true });

  // ── RESUMO LEGÍVEL ────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   RESUMO HITL                                        ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`\n  Resumo  : ${hitl.resumo}`);
  console.log(`  Confiança geral: ${hitl.confianca_geral}`);
  console.log(`\n  Ações por status:`);
  for (const a of hitl.acoes_propostas) {
    const status = a.confianca >= 0.85 ? '✅' : a.confianca >= 0.65 ? '⚠️ ' : '❓ ';
    console.log(`    ${status} [${a.dominio.padEnd(11)}] ${a.tipo.padEnd(20)} conf=${a.confianca.toFixed(2)} ${a.requer_input_gestor ? '← PERGUNTA: ' + (a.pergunta_gestor ?? '') : ''}`);
  }
  console.log('\n  NENHUMA PERSISTÊNCIA FOI FEITA. Aguardando confirmação HITL.\n');
}

main().catch(console.error);
