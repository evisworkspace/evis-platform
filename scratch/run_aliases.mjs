/**
 * Script: Aplicar aliases no Supabase
 * Executa via Management API se tiver PAT, ou via anon key para leitura.
 *
 * Uso: node scratch/run_aliases.mjs [SUPABASE_PAT]
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jwutiebpfauwzzltwgbb.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dXRpZWJwZmF1d3p6bHR3Z2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTYzOTIsImV4cCI6MjA5MTM5MjM5Mn0.KtzdQn2j1z4ugGFIyZgFDBfO--38FTBeKLT_RXMkflU';
const PROJECT_REF = 'jwutiebpfauwzzltwgbb';
const PAT = process.argv[2] || process.env.SUPABASE_PAT || '';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// ─────────────────────────────────────────────
// PASSO 1: DDL via Management API (precisa PAT)
// ─────────────────────────────────────────────

async function runSqlViaManagementAPI(sql) {
  if (!PAT) {
    console.error('[Management API] PAT não fornecido. Pulando DDL.\n');
    return false;
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.json();
  if (!res.ok) {
    console.error('[Management API] Erro:', JSON.stringify(body, null, 2));
    return false;
  }
  console.log('[Management API] OK:', JSON.stringify(body, null, 2));
  return true;
}

// ─────────────────────────────────────────────
// PASSO 2: Leitura das tabelas via anon key
// ─────────────────────────────────────────────

async function lerServicos() {
  const { data, error } = await supabase
    .from('servicos')
    .select('id, nome, categoria, status')
    .order('categoria')
    .limit(200);

  if (error) {
    console.error('[Servicos] Erro:', error.message);
    return [];
  }
  return data || [];
}

async function lerEquipes() {
  const { data, error } = await supabase
    .from('equipes_cadastro')
    .select('id, nome, funcao, status')
    .order('funcao')
    .limit(200);

  if (error) {
    console.error('[Equipes] Erro:', error.message);
    return [];
  }
  return data || [];
}

// ─────────────────────────────────────────────
// PASSO 3: Gerar aliases automaticamente
// ─────────────────────────────────────────────

function gerarAliasesServico(nome, categoria) {
  const n = nome.toLowerCase();
  const cat = (categoria || '').toLowerCase();
  const aliases = new Set();

  // ── AR-CONDICIONADO ──────────────────────────────────────
  if (cat.includes('ar-condicionado') || cat.includes('ar condicionado')) {
    aliases.add('ar condicionado'); aliases.add('ac'); aliases.add('ar');
    aliases.add('climatização');
    if (n.includes('infraestrutura') || n.includes('infra')) {
      aliases.add('infra do ar'); aliases.add('tubulação do ar');
      aliases.add('infra ac'); aliases.add('drenos ac');
    }
    if (n.includes('equipamento') || n.includes('cassete')) {
      aliases.add('instalação do ar'); aliases.add('cassete'); aliases.add('fancoil');
      aliases.add('equipamento ac'); aliases.add('colocar ar');
    }
    if (n.includes('desmontagem') || n.includes('duto')) {
      aliases.add('desmontar duto'); aliases.add('duto'); aliases.add('desmontagem');
    }
    if (n.includes('acabamento')) {
      aliases.add('acabamento do ar'); aliases.add('acabamentos ac');
    }
    if (n.includes('rede frigorífica') || n.includes('frigori')) {
      aliases.add('câmara fria'); aliases.add('rede frigorífica'); aliases.add('frigorifico');
      aliases.add('frigorífica');
    }
  }

  // ── ELÉTRICA ─────────────────────────────────────────────
  if (cat.includes('elétric') || n.includes('elétric') || n.includes('eletric')) {
    aliases.add('elétrica'); aliases.add('instalação elétrica');
    if (n.includes('infraestrutura') || n.includes('infra')) {
      aliases.add('infra elétrica'); aliases.add('tubulação elétrica');
      aliases.add('eletrocalha'); aliases.add('eletroduto'); aliases.add('fiação');
    }
    if (n.includes('acabamento')) {
      aliases.add('acabamento elétrico'); aliases.add('tomadas'); aliases.add('interruptores');
      aliases.add('luminárias'); aliases.add('pontos elétricos');
    }
    if (n.includes('quadro')) {
      aliases.add('quadro elétrico'); aliases.add('qd'); aliases.add('disjuntor');
      aliases.add('quadro de distribuição');
    }
  }

  // ── DRYWALL / FORRO ──────────────────────────────────────
  if (cat.includes('drywall') || cat.includes('forro') || n.includes('forro') || n.includes('drywall')) {
    aliases.add('forro'); aliases.add('teto');
    if (n.includes('tarugamento')) {
      aliases.add('tarugamento'); aliases.add('tarugo'); aliases.add('estrutura do forro');
      aliases.add('aramação do forro');
    }
    if (n.includes('fechamento') || n.includes('placa')) {
      aliases.add('placas do forro'); aliases.add('forro de gesso acartonado');
      aliases.add('drywall'); aliases.add('fechamento do forro');
    }
    if (n.includes('madeira')) {
      aliases.add('forro de madeira'); aliases.add('lambri'); aliases.add('madeira no teto');
    }
  }

  // ── PPCI / INCÊNDIO ──────────────────────────────────────
  if (cat.includes('ppci') || cat.includes('incêndio') || n.includes('ppci')) {
    aliases.add('ppci'); aliases.add('incêndio'); aliases.add('combate a incêndio');
    aliases.add('sprinkler'); aliases.add('hidrante');
    if (n.includes('estalonamento') || n.includes('estrutura')) {
      aliases.add('estrutura ppci'); aliases.add('estalonamento'); aliases.add('suporte ppci');
    }
    if (n.includes('instalação') || n.includes('ponto')) {
      aliases.add('pontos de incêndio'); aliases.add('instalação ppci');
      aliases.add('detector de fumaça'); aliases.add('chuveiro');
    }
  }

  // ── DEMOLIÇÃO ────────────────────────────────────────────
  if (cat.includes('demoliç') || n.includes('retirada') || n.includes('demoliç')) {
    aliases.add('demolição'); aliases.add('quebra'); aliases.add('retirada');
    if (n.includes('parede')) aliases.add('quebrar parede'), aliases.add('abrir parede');
    if (n.includes('teto') || n.includes('forro')) aliases.add('quebrar teto'), aliases.add('abrir teto');
    if (n.includes('revestimento') || n.includes('piso')) aliases.add('tirar piso'), aliases.add('retirar cerâmica');
  }

  // ── PINTURA ──────────────────────────────────────────────
  if (cat.includes('pintura') || n.includes('pintura') || n.includes('tinta')) {
    aliases.add('pintura'); aliases.add('tinta');
    if (n.includes('1ª demão') || n.includes('primeira')) aliases.add('primeira mão'), aliases.add('1ª mão'), aliases.add('primera demão');
    if (n.includes('final')) aliases.add('pintura final'), aliases.add('última mão'), aliases.add('acabamento de pintura');
    if (n.includes('emassamento') || n.includes('lixamento') || n.includes('preparação')) {
      aliases.add('massa corrida'); aliases.add('lixamento'); aliases.add('preparo da parede');
      aliases.add('emassamento'); aliases.add('preparação para pintura');
    }
  }

  // ── MARCENARIA ───────────────────────────────────────────
  if (cat.includes('marcenar') || n.includes('marcenar') || n.includes('mobiliário') || n.includes('móv')) {
    aliases.add('marcenaria'); aliases.add('móveis');
    if (n.includes('planejado') || n.includes('mobiliário')) {
      aliases.add('mobiliário planejado'); aliases.add('mobiliário'); aliases.add('armários');
      aliases.add('prateleiras'); aliases.add('marceneiro');
    }
    if (n.includes('forro') && n.includes('madeira')) {
      aliases.add('forro de madeira'); aliases.add('lambri'); aliases.add('revestimento de madeira');
    }
  }

  // ── REVESTIMENTO / PISO ──────────────────────────────────
  if (cat.includes('revestimento') || n.includes('porcelanato') || n.includes('cerâmic') || n.includes('revestimento')) {
    aliases.add('piso'); aliases.add('revestimento');
    if (n.includes('porcelanato')) {
      aliases.add('porcelanato'); aliases.add('colocar porcelanato'); aliases.add('assentamento porcelanato');
    }
    if (n.includes('cerâmic')) aliases.add('cerâmica'), aliases.add('azulejo');
    if (n.includes('cozinha')) aliases.add('piso da cozinha'), aliases.add('revestimento da cozinha');
  }

  // ── LIMPEZA ──────────────────────────────────────────────
  if (cat.includes('limpeza') || n.includes('limpeza')) {
    aliases.add('limpeza'); aliases.add('limpeza final');
    if (n.includes('pós-obra') || n.includes('pos-obra')) {
      aliases.add('limpeza pós-obra'); aliases.add('limpeza de entrega');
    }
  }

  // ── PRELIMINARES / MOBILIZAÇÃO ───────────────────────────
  if (cat.includes('preliminar') || n.includes('mobilização') || n.includes('desmobilização')) {
    if (n.includes('desmobilização')) {
      aliases.add('desmobilização'); aliases.add('retirada de móveis'); aliases.add('saída');
    } else {
      aliases.add('mobilização'); aliases.add('montagem do canteiro'); aliases.add('início');
    }
    if (n.includes('canteiro')) aliases.add('canteiro de obras'), aliases.add('andaimes');
    if (n.includes('proteção') || n.includes('isolamento')) {
      aliases.add('proteção'); aliases.add('isolamento de obra'); aliases.add('tapume');
      aliases.add('proteção de piso');
    }
  }

  // ── ADMINISTRAÇÃO ────────────────────────────────────────
  if (cat.includes('administraç') || n.includes('vistoria') || n.includes('aprovação')) {
    aliases.add('vistoria'); aliases.add('aprovação'); aliases.add('entrega');
    if (n.includes('final')) aliases.add('vistoria final'), aliases.add('entrega de obra');
  }

  // Remover o nome original (já está no campo nome)
  aliases.delete(n);

  return Array.from(aliases).filter(a => a.length > 2);
}

function gerarAliasesEquipe(nome, funcao) {
  const f = (funcao || '').toLowerCase();
  const n = nome.toLowerCase();
  const aliases = new Set();

  // Sempre incluir partes significativas do nome próprio
  const partes = n.split(/\s+/).filter(p => p.length > 3 && !['para', 'como', 'pelo', 'pela'].includes(p));
  partes.forEach(p => aliases.add(p));

  // ── AR-CONDICIONADO ──────────────────────────────────────
  if (f.includes('ar') || f.includes('condicionado') || f.includes('refriger') || f.includes('frigori')) {
    aliases.add('ar condicionado'); aliases.add('ac'); aliases.add('climatização');
    aliases.add('refrigeração'); aliases.add('equipe do ar'); aliases.add('pessoal do ar');
    if (f.includes('frigori') || f.includes('câmara')) {
      aliases.add('câmara fria'); aliases.add('rede frigorífica'); aliases.add('frigorífico');
    }
  }

  // ── ELÉTRICA ─────────────────────────────────────────────
  if (f.includes('elétric') || f.includes('eletric')) {
    aliases.add('elétrica'); aliases.add('eletricistas');
    aliases.add('pessoal da elétrica'); aliases.add('equipe elétrica');
    aliases.add('os da elétrica'); aliases.add('time da elétrica');
    // Nome específico da empresa
    if (n.includes('lumitech')) {
      aliases.add('lumitech'); aliases.add('lumi');
    }
  }

  // ── CIVIL / ESTRUTURAL ───────────────────────────────────
  if (f.includes('civil') || f.includes('estrutural') || f.includes('pedreir') || f.includes('alvenar')) {
    aliases.add('pedreiros'); aliases.add('civil'); aliases.add('estrutural');
    aliases.add('equipe civil'); aliases.add('pessoal da obra');
    aliases.add('empreiteiro');
    // Nome específico
    if (n.includes('valdeci')) aliases.add('valdeci'), aliases.add('empreiteiro civil');
  }

  // ── INCÊNDIO / PPCI ──────────────────────────────────────
  if (f.includes('incêndio') || f.includes('ppci') || f.includes('incendio')) {
    aliases.add('ppci'); aliases.add('incêndio'); aliases.add('combate a incêndio');
    aliases.add('pessoal do ppci'); aliases.add('equipe ppci');
    aliases.add('sprinkler'); aliases.add('hidrante');
    if (n.includes('pablo')) aliases.add('pablo');
  }

  // ── LIMPEZA ──────────────────────────────────────────────
  if (f.includes('limpeza') || n.includes('limpeza')) {
    aliases.add('limpeza'); aliases.add('equipe de limpeza');
    aliases.add('pessoal da limpeza'); aliases.add('faxina'); aliases.add('limpadores');
  }

  // ── MOBILIÁRIO / MARCENARIA ──────────────────────────────
  if (f.includes('mobiliário') || f.includes('marcenar') || n.includes('marcenaria')) {
    aliases.add('marcenaria'); aliases.add('marceneiros'); aliases.add('móveis');
    aliases.add('pessoal da marcenaria'); aliases.add('equipe de marcenaria');
    aliases.add('os da marcenaria'); aliases.add('time de marcenaria');
    aliases.add('mobiliário');
  }

  // ── SONORIZAÇÃO ──────────────────────────────────────────
  if (f.includes('sonoriz') || f.includes('som') || f.includes('áudio')) {
    aliases.add('som'); aliases.add('sonorização'); aliases.add('equipe de som');
    aliases.add('pessoal do som'); aliases.add('caixas de som'); aliases.add('áudio');
    if (n.includes('roberto')) aliases.add('roberto');
  }

  aliases.delete(n);
  return Array.from(aliases).filter(a => a.length > 2);
}

// ─────────────────────────────────────────────
// PASSO 4: Gerar SQL de UPDATE
// ─────────────────────────────────────────────

function pgArray(arr) {
  return `ARRAY[${arr.map(a => `'${a.replace(/'/g, "''")}'`).join(', ')}]`;
}

function gerarSqlServicos(servicos) {
  const sqls = [];
  for (const s of servicos) {
    const aliases = gerarAliasesServico(s.nome, s.categoria);
    if (aliases.length > 0) {
      sqls.push(
        `UPDATE public.servicos SET aliases = ${pgArray(aliases)} WHERE id = '${s.id}'; -- ${s.nome}`
      );
    }
  }
  return sqls;
}

function gerarSqlEquipes(equipes) {
  const sqls = [];
  for (const e of equipes) {
    const aliases = gerarAliasesEquipe(e.nome, e.funcao);
    if (aliases.length > 0) {
      sqls.push(
        `UPDATE public.equipes_cadastro SET aliases = ${pgArray(aliases)} WHERE id = '${e.id}'; -- ${e.nome} (${e.funcao || ''})`
      );
    }
  }
  return sqls;
}

// ─────────────────────────────────────────────
// PASSO 5: Aplicar via Management API
// ─────────────────────────────────────────────

async function aplicarUpdates(sqls) {
  if (!PAT) return false;

  console.log(`\n[Management API] Aplicando ${sqls.length} UPDATEs...`);
  let ok = 0;
  let fail = 0;

  for (const sql of sqls) {
    const res = await runSqlViaManagementAPI(sql);
    if (res) ok++;
    else fail++;
  }

  console.log(`\n[Management API] Resultado: ${ok} OK, ${fail} erros`);
  return fail === 0;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log('=== ALIASES SETUP — EVIS AI ===\n');

  // 1. DDL — ADD COLUMN aliases
  const ddl1 = `ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';`;
  const ddl2 = `ALTER TABLE public.equipes_cadastro ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';`;

  console.log('[PASSO 1] Adicionando colunas aliases...');
  const ddlOk1 = await runSqlViaManagementAPI(ddl1);
  const ddlOk2 = await runSqlViaManagementAPI(ddl2);

  if (!ddlOk1 || !ddlOk2) {
    console.log('\n[AVISO] DDL não executado. Execute manualmente no Supabase SQL Editor:');
    console.log(`\n  ${ddl1}`);
    console.log(`  ${ddl2}`);
    if (!PAT) {
      console.log('\n[DICA] Para execução automática, forneça o PAT:');
      console.log('  node scratch/run_aliases.mjs <SEU_SUPABASE_PAT>');
      console.log('  Obter em: https://supabase.com/dashboard/account/tokens\n');
    }
  }

  // 2. Ler dados
  console.log('\n[PASSO 2] Lendo dados do banco...');
  const servicos = await lerServicos();
  const equipes = await lerEquipes();

  console.log(`  Servicos encontrados: ${servicos.length}`);
  console.log(`  Equipes encontradas: ${equipes.length}`);

  if (servicos.length === 0 && equipes.length === 0) {
    console.log('\n[ERRO] Não foi possível ler as tabelas. Verifique RLS ou obra_id.');
    return;
  }

  // 3. Mostrar dados encontrados
  if (servicos.length > 0) {
    console.log('\n--- SERVIÇOS NO BANCO ---');
    servicos.forEach(s => console.log(`  [${s.id?.substring(0,8)}...] ${s.nome} (${s.categoria || 'sem categoria'})`));
  }
  if (equipes.length > 0) {
    console.log('\n--- EQUIPES NO BANCO ---');
    equipes.forEach(e => console.log(`  [${e.id?.substring(0,8)}...] ${e.nome} — ${e.funcao || 'sem função'}`));
  }

  // 4. Gerar SQLs
  const sqlsServicos = gerarSqlServicos(servicos);
  const sqlsEquipes = gerarSqlEquipes(equipes);

  console.log(`\n[PASSO 3] SQLs gerados: ${sqlsServicos.length} serviços + ${sqlsEquipes.length} equipes`);

  // 5. Mostrar SQLs
  console.log('\n--- SQL COMPLETO PARA ALIASES ---\n');
  [...sqlsServicos, ...sqlsEquipes].forEach(sql => console.log(sql));

  // 6. Aplicar se tiver PAT
  if (PAT) {
    console.log('\n[PASSO 4] Aplicando UPDATEs via Management API...');
    await aplicarUpdates([...sqlsServicos, ...sqlsEquipes]);
  } else {
    console.log('\n[PASSO 4] Copie os SQLs acima e execute no Supabase SQL Editor.');
    console.log('  Ou forneça PAT para execução automática: node scratch/run_aliases.mjs <PAT>');
  }
}

main().catch(console.error);
