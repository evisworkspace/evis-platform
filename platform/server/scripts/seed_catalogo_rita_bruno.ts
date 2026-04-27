import { createClient } from '@supabase/supabase-js';
import { getServerEnv, loadServerEnv } from '../lib/serverEnv';

loadServerEnv();

const supabaseUrl = getServerEnv('SUPABASE_URL', ['VITE_SUPABASE_URL']) || '';
const supabaseKey =
  getServerEnv('SUPABASE_SERVICE_ROLE_KEY', ['SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY']) || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase não configurado para seed.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

type CatalogSeed = {
  slug: string;
  codigo_evis: string;
  nome: string;
  descricao: string;
  categoria: string;
  unidade_referencia: string;
  origem_principal: 'composicao_propria' | 'fornecedor';
  aliases: string[];
  disciplina: string;
  classificacao_item: string;
  mat_unitario: number;
  mo_unitario: number;
  total_unitario: number;
  fonte_preco: 'manual' | 'fornecedor';
};

const obraReferencia = 'ORC_2026-001_Rita_e_Bruno_Quatro_Barras';
const competencia = '2026-04-01';
const uf = 'PR';
const cidade = 'Quatro Barras';
const fonteNome = 'Catalogo Berti - Rita e Bruno';

const items: CatalogSeed[] = [
  {
    slug: 'evis-hidr-001-ponto-agua-fria-residencial',
    codigo_evis: 'EVIS-HIDR-001',
    nome: 'Ponto água fria residencial',
    descricao: 'Execução completa de ponto hidráulico de água fria em residência unifamiliar.',
    categoria: 'Hidráulica',
    unidade_referencia: 'un',
    origem_principal: 'composicao_propria',
    aliases: ['ponto agua fria', 'hidraulica residencial', 'agua fria residencial', 'ponto hidraulico'],
    disciplina: 'hidraulica_sanitaria',
    classificacao_item: 'item_global',
    mat_unitario: 125,
    mo_unitario: 70,
    total_unitario: 195,
    fonte_preco: 'manual',
  },
  {
    slug: 'evis-hidr-002-ponto-agua-quente-residencial',
    codigo_evis: 'EVIS-HIDR-002',
    nome: 'Ponto água quente residencial',
    descricao: 'Execução completa de ponto hidráulico de água quente em residência unifamiliar.',
    categoria: 'Hidráulica',
    unidade_referencia: 'un',
    origem_principal: 'composicao_propria',
    aliases: ['ponto agua quente', 'hidraulica residencial', 'agua quente residencial', 'ponto hidraulico'],
    disciplina: 'hidraulica_sanitaria',
    classificacao_item: 'item_global',
    mat_unitario: 140,
    mo_unitario: 70,
    total_unitario: 210,
    fonte_preco: 'manual',
  },
  {
    slug: 'evis-hidr-003-ponto-esgoto-residencial',
    codigo_evis: 'EVIS-HIDR-003',
    nome: 'Ponto esgoto residencial',
    descricao: 'Execução completa de ponto de esgoto sanitário em residência unifamiliar.',
    categoria: 'Hidráulica',
    unidade_referencia: 'un',
    origem_principal: 'composicao_propria',
    aliases: ['ponto esgoto', 'esgoto residencial', 'hidraulica esgoto', 'ponto sanitario'],
    disciplina: 'hidraulica_sanitaria',
    classificacao_item: 'item_global',
    mat_unitario: 105,
    mo_unitario: 70,
    total_unitario: 175,
    fonte_preco: 'manual',
  },
  {
    slug: 'evis-elet-001-ponto-tomada-tug-20a',
    codigo_evis: 'EVIS-ELET-001',
    nome: 'Ponto tomada TUG 20A',
    descricao: 'Execução completa de ponto elétrico para tomada de uso geral 20A.',
    categoria: 'Elétrica',
    unidade_referencia: 'un',
    origem_principal: 'composicao_propria',
    aliases: ['tomada tug', 'ponto tomada 20a', 'ponto eletrico residencial', 'tomada uso geral'],
    disciplina: 'eletrica',
    classificacao_item: 'item_global',
    mat_unitario: 55,
    mo_unitario: 80,
    total_unitario: 135,
    fonte_preco: 'manual',
  },
  {
    slug: 'evis-elet-002-ponto-tomada-tue-220v',
    codigo_evis: 'EVIS-ELET-002',
    nome: 'Ponto tomada TUE 220V',
    descricao: 'Execução completa de ponto elétrico para tomada de uso específico em 220V.',
    categoria: 'Elétrica',
    unidade_referencia: 'un',
    origem_principal: 'composicao_propria',
    aliases: ['tomada tue', 'ponto 220v', 'tomada uso especifico', 'ponto eletrico 220v'],
    disciplina: 'eletrica',
    classificacao_item: 'item_global',
    mat_unitario: 82,
    mo_unitario: 90,
    total_unitario: 172,
    fonte_preco: 'manual',
  },
  {
    slug: 'evis-elet-003-ponto-iluminacao-residencial',
    codigo_evis: 'EVIS-ELET-003',
    nome: 'Ponto iluminação residencial',
    descricao: 'Execução completa de ponto elétrico de iluminação residencial.',
    categoria: 'Elétrica',
    unidade_referencia: 'un',
    origem_principal: 'composicao_propria',
    aliases: ['ponto iluminacao', 'ponto de luz', 'iluminacao residencial', 'ponto eletrico iluminacao'],
    disciplina: 'eletrica',
    classificacao_item: 'item_global',
    mat_unitario: 75,
    mo_unitario: 80,
    total_unitario: 155,
    fonte_preco: 'manual',
  },
  {
    slug: 'evis-acab-001-piso-laminado-quickstep-vision',
    codigo_evis: 'EVIS-ACAB-001',
    nome: 'Piso laminado QuickStep Vision',
    descricao:
      'Fornecimento e instalação de piso laminado QuickStep Vision, conforme padrão validado na obra de referência.',
    categoria: 'Pisos',
    unidade_referencia: 'm²',
    origem_principal: 'fornecedor',
    aliases: ['quickstep vision', 'piso laminado', 'laminado premium', 'piso acabamento'],
    disciplina: 'civil_execucao',
    classificacao_item: 'item_global',
    mat_unitario: 92.83,
    mo_unitario: 35,
    total_unitario: 127.83,
    fonte_preco: 'fornecedor',
  },
  {
    slug: 'evis-acab-002-textura-projetada-massa-acrilica',
    codigo_evis: 'EVIS-ACAB-002',
    nome: 'Textura projetada massa acrílica',
    descricao:
      'Execução de textura projetada com massa acrílica em fachada ou áreas especificadas.',
    categoria: 'Pintura',
    unidade_referencia: 'm²',
    origem_principal: 'composicao_propria',
    aliases: ['textura projetada', 'massa acrilica', 'textura fachada', 'acabamento textura'],
    disciplina: 'civil_execucao',
    classificacao_item: 'item_global',
    mat_unitario: 108.7,
    mo_unitario: 35,
    total_unitario: 143.7,
    fonte_preco: 'manual',
  },
];

async function upsertCatalog() {
  const payload = items.map((item) => ({
    slug: item.slug,
    nome: item.nome,
    descricao: item.descricao,
    categoria: item.categoria,
    unidade_referencia: item.unidade_referencia,
    tipo_obra: 'residencial',
    status_catalogo: 'aprovado',
    origem_principal: item.origem_principal,
    aliases: item.aliases,
    metadados: {
      codigo_evis: item.codigo_evis,
      seed: 'rita_bruno_validado',
      obra_referencia: obraReferencia,
      origem_validacao: 'orcamento_real',
      disciplina: item.disciplina,
      classificacao_item: item.classificacao_item,
      memoria_preco: {
        mat_unitario: item.mat_unitario,
        mo_unitario: item.mo_unitario,
        total_unitario: item.total_unitario,
      },
    },
  }));

  const { error } = await supabase.from('catalogo_servicos_evis').upsert(payload, {
    onConflict: 'slug',
  });

  if (error) {
    throw new Error(`Falha ao gravar catalogo_servicos_evis: ${error.message}`);
  }
}

async function seedReferences() {
  const { data: catalogRows, error } = await supabase
    .from('catalogo_servicos_evis')
    .select('id, slug')
    .in(
      'slug',
      items.map((item) => item.slug)
    );

  if (error || !catalogRows) {
    throw new Error(`Falha ao carregar catalogo para referencias: ${error?.message || 'sem dados'}`);
  }

  const bySlug = new Map(catalogRows.map((row) => [row.slug, row.id]));

  for (const item of items) {
    const catalogId = bySlug.get(item.slug);
    if (!catalogId) {
      throw new Error(`Catalogo nao encontrado para slug ${item.slug}`);
    }

    const referencePayload = {
      catalogo_servico_id: catalogId,
      fonte: item.origem_principal,
      tabela_origem: 'catalogo_berti',
      codigo_origem: item.codigo_evis,
      descricao_origem: item.nome,
      unidade_origem: item.unidade_referencia,
      observacoes: `Preco validado no projeto Rita e Bruno.`,
      confianca: 95,
      principal: true,
      competencia_ref: competencia,
      uf,
      cidade,
    };

    const { data: existingRef, error: refCheckError } = await supabase
      .from('servicos_referencia_origem')
      .select('id')
      .eq('catalogo_servico_id', catalogId)
      .eq('codigo_origem', item.codigo_evis)
      .eq('principal', true)
      .maybeSingle();

    if (refCheckError) {
      throw new Error(`Falha ao checar referencia ${item.codigo_evis}: ${refCheckError.message}`);
    }

    if (!existingRef) {
      const { error: refInsertError } = await supabase
        .from('servicos_referencia_origem')
        .insert(referencePayload);

      if (refInsertError) {
        throw new Error(`Falha ao inserir referencia ${item.codigo_evis}: ${refInsertError.message}`);
      }
    }

    const { data: existingPrice, error: priceCheckError } = await supabase
      .from('precos_referencia_historico')
      .select('id')
      .eq('catalogo_servico_id', catalogId)
      .eq('competencia', competencia)
      .eq('valor_unitario', item.total_unitario)
      .eq('unidade', item.unidade_referencia)
      .maybeSingle();

    if (priceCheckError) {
      throw new Error(`Falha ao checar preco ${item.codigo_evis}: ${priceCheckError.message}`);
    }

    if (!existingPrice) {
      const { error: priceInsertError } = await supabase
        .from('precos_referencia_historico')
        .insert({
          catalogo_servico_id: catalogId,
          tipo_preco: item.fonte_preco,
          valor_unitario: item.total_unitario,
          unidade: item.unidade_referencia,
          competencia,
          valid_from: competencia,
          uf,
          cidade,
          fonte_nome: fonteNome,
          observacoes: `Seed validado do projeto Rita e Bruno. Memoria: ${JSON.stringify({
            mat_unitario: item.mat_unitario,
            mo_unitario: item.mo_unitario,
            total_unitario: item.total_unitario,
          })}`,
          confianca: 95,
        });

      if (priceInsertError) {
        throw new Error(`Falha ao inserir preco ${item.codigo_evis}: ${priceInsertError.message}`);
      }
    }
  }
}

async function main() {
  await upsertCatalog();
  await seedReferences();

  console.log(
    JSON.stringify(
      {
        success: true,
        total_items: items.length,
        slugs: items.map((item) => item.slug),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
