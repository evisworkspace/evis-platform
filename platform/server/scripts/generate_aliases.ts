import { supabase } from '../tools/supabaseTools';

async function run() {
  console.log('-- Passo 1: Adicionar a coluna aliases');
  console.log(`
ALTER TABLE public.servicos
  ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';

ALTER TABLE public.equipes_cadastro
  ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';
  `);

  console.log('-- Passo 2: Popular aliases para serviços');
  const { data: servicos } = await supabase.from('servicos').select('id, nome, categoria');
  if (servicos) {
    for (const s of servicos) {
      let aliases = [s.nome.toLowerCase()];
      const lnome = s.nome.toLowerCase();

      if (lnome.includes('reboco') || lnome.includes('massa')) {
        aliases.push('reboco externo', 'masso', 'revestimento');
      }
      if (lnome.includes('gesso')) {
        aliases.push('acabamento em gesso', 'forro de gesso', 'gesso liso');
      }
      if (lnome.includes('elétrica')) {
        aliases.push('fiação', 'instalação elétrica', 'eletricidade');
      }
      if (lnome.includes('hidráulica') || lnome.includes('tubulação')) {
        aliases.push('encanamento', 'tubulação');
      }
      if (lnome.includes('pintura')) {
        aliases.push('tinta', 'pintar', 'acabamento de pintura');
      }
      
      const aliasStr = aliases.map(a => `'${a}'`).join(', ');
      console.log(`UPDATE public.servicos SET aliases = ARRAY[${aliasStr}] WHERE id = '${s.id}';`);
    }
  }

  console.log('\n-- Passo 2: Popular aliases para equipes');
  const { data: equipes } = await supabase.from('equipes_cadastro').select('id, nome, funcao');
  if (equipes) {
    for (const e of equipes) {
      let aliases = [e.nome.toLowerCase()];
      const lnome = e.nome.toLowerCase();
      const lfuncao = (e.funcao || '').toLowerCase();

      if (lfuncao.includes('eletric')) {
        aliases.push('pessoal da elétrica', 'os da elétrica', 'eletricistas');
      }
      if (lfuncao.includes('pedreir')) {
        aliases.push('pedreiros', 'pessoal da obra', 'equipe de pedreiros');
      }
      if (lfuncao.includes('pintor')) {
        aliases.push('pintores', 'pessoal da pintura', 'os pintores');
      }
      if (lfuncao.includes('encanador') || lfuncao.includes('hidráulica')) {
        aliases.push('encanadores', 'pessoal da hidráulica');
      }
      if (lfuncao.includes('marcenar')) {
        aliases.push('pessoal da marcenaria', 'marceneiros', 'o marceneiro');
      }

      const aliasStr = aliases.map(a => `'${a}'`).join(', ');
      console.log(`UPDATE public.equipes_cadastro SET aliases = ARRAY[${aliasStr}] WHERE id = '${e.id}';`);
    }
  }
}

run().catch(console.error);
