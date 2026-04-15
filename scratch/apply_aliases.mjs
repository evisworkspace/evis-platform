/**
 * Aplica aliases semânticos ricos diretamente no Supabase via anon key.
 * RLS permite UPDATE — confirmado em teste anterior.
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://jwutiebpfauwzzltwgbb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dXRpZWJwZmF1d3p6bHR3Z2JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTYzOTIsImV4cCI6MjA5MTM5MjM5Mn0.KtzdQn2j1z4ugGFIyZgFDBfO--38FTBeKLT_RXMkflU'
);

// ── ALIAS GERADOR SERVIÇOS ─────────────────────────────────────
function aliasesServico(nome, cat) {
  const n = nome.toLowerCase();
  const c = (cat || '').toLowerCase();
  const s = new Set();

  // Ar-condicionado
  if (c.includes('ar-condicionado') || c.includes('ar condicionado')) {
    s.add('ar condicionado'); s.add('ac'); s.add('climatização'); s.add('ar');
    if (n.includes('infra')) { s.add('infra do ar'); s.add('infra ac'); s.add('drenos ac'); s.add('tubulação do ar'); }
    if (n.includes('equipamento') || n.includes('cassete')) { s.add('instalação do ar'); s.add('cassete'); s.add('fancoil'); s.add('colocar ar'); s.add('instalar ar'); }
    if (n.includes('desmontagem') || n.includes('duto')) { s.add('duto'); s.add('desmontagem'); s.add('desmontar duto'); }
    if (n.includes('acabamento')) { s.add('acabamento do ar'); s.add('acabamentos ac'); }
    if (n.includes('frigori') || n.includes('câmara')) { s.add('câmara fria'); s.add('rede frigorífica'); s.add('frigorífico'); }
  }

  // Elétrica
  if (c.includes('elétric') || n.includes('elétric') || n.includes('eletric')) {
    s.add('elétrica'); s.add('instalação elétrica');
    if (n.includes('infra')) { s.add('infra elétrica'); s.add('fiação'); s.add('eletrocalha'); s.add('eletroduto'); s.add('tubulação elétrica'); }
    if (n.includes('acabamento')) { s.add('acabamento elétrico'); s.add('tomadas'); s.add('interruptores'); s.add('luminárias'); s.add('pontos elétricos'); }
    if (n.includes('quadro')) { s.add('quadro elétrico'); s.add('qd'); s.add('disjuntor'); s.add('painel elétrico'); }
  }

  // Drywall / Forro
  if (c.includes('drywall') || c.includes('forro') || n.includes('forro')) {
    s.add('forro'); s.add('teto');
    if (n.includes('tarugamento')) { s.add('tarugamento'); s.add('tarugo'); s.add('estrutura do forro'); }
    if (n.includes('fechamento') || n.includes('placa')) { s.add('drywall'); s.add('placas do forro'); s.add('forro de gesso acartonado'); s.add('fechamento do forro'); }
    if (n.includes('madeira') || n.includes('lambri')) { s.add('forro de madeira'); s.add('lambri'); s.add('madeira no teto'); }
  }

  // PPCI / Incêndio
  if (c.includes('ppci') || c.includes('incêndio') || n.includes('ppci')) {
    s.add('ppci'); s.add('incêndio'); s.add('combate a incêndio'); s.add('sprinkler'); s.add('hidrante');
    if (n.includes('estalonamento') || n.includes('estrutura')) { s.add('estalonamento'); s.add('estrutura ppci'); s.add('suporte ppci'); }
    if (n.includes('instalação') || n.includes('ponto')) { s.add('pontos de incêndio'); s.add('instalação ppci'); s.add('detector de fumaça'); s.add('chuveiro'); }
  }

  // Demolições
  if (c.includes('demoliç') || n.includes('retirada') || n.includes('demoliç')) {
    s.add('demolição'); s.add('quebra'); s.add('retirada');
    if (n.includes('parede')) { s.add('quebrar parede'); s.add('abrir parede'); }
    if (n.includes('teto') || n.includes('forro')) { s.add('quebrar teto'); s.add('abrir teto'); }
    if (n.includes('revestimento') || n.includes('piso')) { s.add('tirar piso'); s.add('retirar cerâmica'); }
  }

  // Pintura
  if (c.includes('pintura') || n.includes('pintura') || n.includes('tinta')) {
    s.add('pintura'); s.add('tinta');
    if (n.includes('1ª') || n.includes('primeira') || n.includes('demão')) { s.add('primeira mão'); s.add('1ª mão'); s.add('primera demão'); }
    if (n.includes('final')) { s.add('pintura final'); s.add('última mão'); s.add('acabamento de pintura'); }
    if (n.includes('emassamento') || n.includes('lixamento') || n.includes('preparação')) {
      s.add('massa corrida'); s.add('lixamento'); s.add('emassamento'); s.add('preparo da parede'); s.add('preparação para pintura');
    }
  }

  // Marcenaria / Mobiliário — aliases ricos incluindo os termos da narrativa de teste
  if (c.includes('marcenar') || n.includes('marcenar') || n.includes('mobiliário') || n.includes('móv')) {
    s.add('marcenaria'); s.add('marceneiros'); s.add('móveis'); s.add('mobiliário');
    s.add('mobiliário planejado'); s.add('armários'); s.add('marceneiro'); s.add('prateleiras');
    s.add('instalar móveis'); s.add('instalar mobiliário'); s.add('móveis da cozinha');
    s.add('móveis do salão'); s.add('instalação de móveis');
    if (n.includes('salão 1')) { s.add('móveis salão 1'); s.add('mobiliário salão 1'); }
    if (n.includes('salão 2')) { s.add('móveis salão 2'); s.add('mobiliário salão 2'); }
    if (n.includes('forro') && (n.includes('madeira') || n.includes('lambri'))) {
      s.add('forro de madeira'); s.add('lambri'); s.add('revestimento de madeira');
    }
  }

  // Revestimento / Piso
  if (c.includes('revestimento') || n.includes('porcelanato') || n.includes('cerâmic') || n.includes('revestimento')) {
    s.add('piso'); s.add('revestimento');
    if (n.includes('porcelanato')) { s.add('porcelanato'); s.add('assentamento porcelanato'); s.add('colocar porcelanato'); }
    if (n.includes('cerâmic')) { s.add('cerâmica'); s.add('azulejo'); }
    if (n.includes('cozinha')) { s.add('piso da cozinha'); s.add('revestimento da cozinha'); }
  }

  // Limpeza
  if (c.includes('limpeza') || n.includes('limpeza')) {
    s.add('limpeza'); s.add('limpeza final');
    if (n.includes('pós') || n.includes('pos')) { s.add('limpeza pós-obra'); s.add('limpeza de entrega'); }
  }

  // Preliminares
  if (c.includes('preliminar') || n.includes('mobilização') || n.includes('desmobilização') || n.includes('isolamento') || n.includes('proteção')) {
    if (n.includes('desmobilização')) {
      s.add('desmobilização'); s.add('retirada de móveis'); s.add('saída'); s.add('tirar móveis');
    } else if (n.includes('mobilização de mob')) {
      s.add('mobilização de mobiliário'); s.add('colocar móveis'); s.add('entrada de móveis');
    } else if (n.includes('mobilização')) {
      s.add('mobilização'); s.add('montagem do canteiro'); s.add('início'); s.add('canteiro de obras');
      if (n.includes('andaimes')) s.add('andaimes');
    }
    if (n.includes('isolamento') || n.includes('proteção')) {
      s.add('proteção'); s.add('tapume'); s.add('isolamento'); s.add('proteção de piso');
    }
  }

  // Administração
  if (c.includes('administraç') || n.includes('vistoria') || n.includes('aprovação')) {
    s.add('vistoria'); s.add('aprovação'); s.add('entrega');
    if (n.includes('final')) { s.add('vistoria final'); s.add('entrega de obra'); }
  }

  return [...s].filter(a => a.length > 2);
}

// ── ALIAS GERADOR EQUIPES ──────────────────────────────────────
function aliasesEquipe(nome, funcao) {
  const f = (funcao || '').toLowerCase();
  const n = nome.toLowerCase();
  const s = new Set();

  // Partes significativas do nome próprio
  n.split(/\s+/).filter(p => p.length > 3 && !['para', 'como', 'pelo', 'pela'].includes(p)).forEach(p => s.add(p));

  if (f.includes('ar') || f.includes('condicionado') || f.includes('refriger') || f.includes('frigori')) {
    s.add('ar condicionado'); s.add('ac'); s.add('climatização'); s.add('refrigeração'); s.add('equipe do ar'); s.add('pessoal do ar');
    if (f.includes('frigori') || f.includes('câmara')) { s.add('câmara fria'); s.add('rede frigorífica'); }
  }
  if (f.includes('elétric') || f.includes('eletric')) {
    s.add('elétrica'); s.add('eletricistas'); s.add('pessoal da elétrica'); s.add('equipe elétrica'); s.add('os da elétrica'); s.add('time da elétrica');
    if (n.includes('lumitech')) { s.add('lumitech'); s.add('lumi'); }
  }
  if (f.includes('civil') || f.includes('estrutural') || f.includes('pedreir')) {
    s.add('pedreiros'); s.add('civil'); s.add('empreiteiro'); s.add('equipe civil'); s.add('pessoal da obra');
  }
  if (f.includes('incêndio') || f.includes('ppci')) {
    s.add('ppci'); s.add('incêndio'); s.add('pessoal do ppci'); s.add('equipe ppci'); s.add('sprinkler'); s.add('hidrante');
  }
  if (f.includes('limpeza') || n.includes('limpeza')) {
    s.add('limpeza'); s.add('equipe de limpeza'); s.add('pessoal da limpeza'); s.add('faxina'); s.add('limpadores');
  }
  if (f.includes('mobiliário') || f.includes('marcenar') || n.includes('marcenaria')) {
    s.add('marcenaria'); s.add('marceneiros'); s.add('móveis'); s.add('pessoal da marcenaria');
    s.add('equipe de marcenaria'); s.add('os da marcenaria'); s.add('time de marcenaria');
    s.add('mobiliário'); s.add('instalar móveis'); s.add('móveis da cozinha');
  }
  if (f.includes('sonoriz') || f.includes('som') || f.includes('áudio')) {
    s.add('som'); s.add('sonorização'); s.add('equipe de som'); s.add('pessoal do som'); s.add('caixas de som'); s.add('áudio');
  }

  s.delete(n);
  return [...s].filter(a => a.length > 2);
}

// ── MAIN ───────────────────────────────────────────────────────
async function main() {
  console.log('=== APLICANDO ALIASES SEMÂNTICOS ===\n');

  const { data: svcs, error: e1 } = await sb.from('servicos').select('id, nome, categoria').limit(200);
  const { data: eqs, error: e2 } = await sb.from('equipes_cadastro').select('id, nome, funcao').limit(100);
  if (e1 || e2) { console.error('Erro ao ler:', e1?.message, e2?.message); return; }
  console.log(`Serviços: ${svcs.length} | Equipes: ${eqs.length}\n`);

  let ok = 0, skip = 0, fail = 0;

  for (const s of svcs) {
    const al = aliasesServico(s.nome, s.categoria);
    if (al.length === 0) { skip++; continue; }
    const { error } = await sb.from('servicos').update({ aliases: al }).eq('id', s.id);
    if (error) { fail++; console.error(`  ERRO: ${s.nome} — ${error.message}`); }
    else { ok++; console.log(`  ✓ ${s.nome.substring(0, 45).padEnd(46)} [${al.slice(0, 3).join(', ')}...]`); }
  }

  console.log('');
  for (const e of eqs) {
    const al = aliasesEquipe(e.nome, e.funcao);
    if (al.length === 0) { skip++; continue; }
    const { error } = await sb.from('equipes_cadastro').update({ aliases: al }).eq('id', e.id);
    if (error) { fail++; console.error(`  ERRO equipe: ${e.nome} — ${error.message}`); }
    else { ok++; console.log(`  ✓ EQUIPE ${e.nome.substring(0, 38).padEnd(40)} [${al.slice(0, 3).join(', ')}...]`); }
  }

  console.log(`\n=== CONCLUÍDO: ${ok} OK | ${skip} sem alias | ${fail} erros ===`);
}

main().catch(console.error);
