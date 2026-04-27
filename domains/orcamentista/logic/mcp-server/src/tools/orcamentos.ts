import { supabase } from '../supabase.js';

/**
 * Cria um novo orçamento/obra no Supabase
 */
export async function orcamentoCriar(params: {
  nome: string;
  cliente: string;
  endereco?: string;
  tipo_obra: string;
  area_total?: number;
  regime_tributario?: string;
  observacoes?: string;
}) {
  const { data, error } = await supabase
    .from('obras')
    .insert([{
      nome: params.nome,
      cliente: params.cliente,
      endereco: params.endereco || null,
      tipo_obra: params.tipo_obra,
      area_total: params.area_total || null,
      status: 'Planejada',
      observacoes: params.observacoes || null,
    }])
    .select('id, nome, cliente, status')
    .single();

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    message: `Orçamento "${data.nome}" criado com sucesso`,
    obra_id: data.id,
    data
  };
}

/**
 * Adiciona um serviço ao orçamento
 */
export async function orcamentoAdicionarServico(params: {
  obra_id: string;
  codigo_servico: string;
  categoria: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario_direto: number;
  sinapi_codigo?: string;
  equipe_id?: string;
  observacoes?: string;
}) {
  const valor_total_direto = params.quantidade * params.valor_unitario_direto;

  const { data, error } = await supabase
    .from('servicos')
    .insert([{
      obra_id: params.obra_id,
      codigo_servico: params.codigo_servico,
      categoria: params.categoria,
      descricao: params.descricao,
      unidade: params.unidade,
      quantidade: params.quantidade,
      valor_unitario_direto: params.valor_unitario_direto,
      valor_total_direto,
      sinapi_codigo: params.sinapi_codigo || null,
      equipe_id: params.equipe_id || null,
      status: 'Planejado',
      observacoes: params.observacoes || null,
    }])
    .select('id, codigo_servico, descricao, valor_total_direto')
    .single();

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    message: `Serviço "${data.descricao}" adicionado`,
    servico_id: data.id,
    valor_total_direto: `R$ ${valor_total_direto.toFixed(2)}`,
    data
  };
}

/**
 * Busca um orçamento pelo ID ou nome
 */
export async function orcamentoBuscar(identificador: string) {
  // Tenta por ID primeiro
  let query = supabase
    .from('obras')
    .select('id, nome, cliente, status, tipo_obra, area_total, valor_custos_diretos, bdi_percentual, valor_total_com_bdi')
    .limit(5);

  // Se parece UUID, busca por ID
  if (identificador.includes('-') && identificador.length > 10) {
    query = query.eq('id', identificador);
  } else {
    query = query.ilike('nome', `%${identificador}%`);
  }

  const { data, error } = await query;
  if (error) return { success: false, error: error.message };
  if (!data || data.length === 0) return { success: false, error: 'Nenhum orçamento encontrado' };

  return { success: true, total: data.length, data };
}

/**
 * Lista os serviços de um orçamento
 */
export async function orcamentoListarServicos(obra_id: string) {
  const { data, error } = await supabase
    .from('servicos')
    .select('codigo_servico, categoria, descricao, unidade, quantidade, valor_unitario_direto, valor_total_direto, sinapi_codigo, status')
    .eq('obra_id', obra_id)
    .order('codigo_servico');

  if (error) return { success: false, error: error.message };

  const total = (data || []).reduce((acc, s) => acc + (s.valor_total_direto || 0), 0);

  return {
    success: true,
    total_servicos: data?.length || 0,
    subtotal_direto: `R$ ${total.toFixed(2)}`,
    data: data || []
  };
}

/**
 * Atualiza o BDI do orçamento (após usuário definir)
 */
export async function orcamentoAtualizarBdi(params: {
  obra_id: string;
  bdi_percentual: number;
  regime_tributario: string;
  bdi_detalhamento: {
    administracao: number;
    seguro: number;
    risco: number;
    despesas_financeiras: number;
    lucro: number;
    impostos: number;
  };
}) {
  // Buscar total de custos diretos
  const { data: servicos } = await supabase
    .from('servicos')
    .select('valor_total_direto')
    .eq('obra_id', params.obra_id);

  const valor_custos_diretos = (servicos || []).reduce((acc, s) => acc + (s.valor_total_direto || 0), 0);
  const bdi_valor = valor_custos_diretos * (params.bdi_percentual / 100);
  const valor_total_com_bdi = valor_custos_diretos + bdi_valor;

  const { error } = await supabase
    .from('obras')
    .update({
      bdi_percentual: params.bdi_percentual,
      bdi_valor,
      valor_custos_diretos,
      valor_total_com_bdi,
      regime_tributario: params.regime_tributario,
    })
    .eq('id', params.obra_id);

  if (error) return { success: false, error: error.message };

  return {
    success: true,
    message: 'BDI atualizado com sucesso',
    resumo: {
      custos_diretos: `R$ ${valor_custos_diretos.toFixed(2)}`,
      bdi: `${params.bdi_percentual}% = R$ ${bdi_valor.toFixed(2)}`,
      total_com_bdi: `R$ ${valor_total_com_bdi.toFixed(2)}`
    }
  };
}

/**
 * Exporta o orçamento completo em JSON (schema EVIS v2.0)
 */
export async function orcamentoExportar(obra_id: string) {
  const [obraResult, servicosResult] = await Promise.all([
    supabase.from('obras').select('*').eq('id', obra_id).single(),
    supabase.from('servicos').select('*').eq('obra_id', obra_id).order('codigo_servico'),
  ]);

  if (obraResult.error) return { success: false, error: obraResult.error.message };

  return {
    success: true,
    json: {
      obra: obraResult.data,
      servicos: servicosResult.data || [],
      metadados: {
        versao_schema: '2.0',
        data_geracao: new Date().toISOString(),
        gerado_por: 'Evis Orçamentos MCP',
        sistema_destino: 'EVIS Obra',
        status_validacao: 'gerado'
      }
    }
  };
}
