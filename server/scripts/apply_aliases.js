import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

const envFilePath = fs.existsSync('../.env') ? '../.env' : '.env';
dotenv.config({ path: envFilePath });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log('--- Iniciando gravação de aliases no Supabase ---');

  const { data: servicos, error: errS } = await supabase.from('servicos').select('id, nome, categoria');
  if (errS) {
    console.error('Erro buscando serviços:', errS.message);
  } else if (servicos) {
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
      
      const { error: updErr } = await supabase
        .from('servicos')
        .update({ aliases })
        .eq('id', s.id);
        
      if (updErr) {
        console.error(`Erro atualizando serviço ${s.id}:`, updErr.message);
      } else {
        console.log(`Serviço '${s.nome}' atualizado com aliases:`, aliases);
      }
    }
  }

  const { data: equipes, error: errE } = await supabase.from('equipes_cadastro').select('id, nome, funcao');
  if (errE) {
    console.error('Erro buscando equipes:', errE.message);
  } else if (equipes) {
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
      
      if (lnome.includes('limpeza')) {
        aliases.push('pessoal da limpeza');
      }

      const { error: updErr } = await supabase
        .from('equipes_cadastro')
        .update({ aliases })
        .eq('id', e.id);
      
      if (updErr) {
        console.error(`Erro atualizando equipe ${e.id}:`, updErr.message);
      } else {
        console.log(`Equipe '${e.nome}' atualizada com aliases:`, aliases);
      }
    }
  }
  
  console.log('--- Gravação concluída ---');
}

run().catch(console.error);
