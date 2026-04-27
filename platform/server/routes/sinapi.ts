import { Router, Request, Response } from 'express';
import { buscarReferencias, formatCurrency, parseLimit, supabase } from '../lib/referenciasSearch';

const router = Router();

/**
 * GET /api/sinapi/search?termo=demolição&limite=10
 * Rota legada compatível.
 * Agora usa a mesma busca agregada de referências:
 * 1. Catálogo residencial EVIS
 * 2. SINAPI oficial como fallback
 */
router.get('/search', async (req: Request, res: Response) => {
  const { termo, limite = '8' } = req.query;

  if (!termo) {
    return res.status(400).json({ success: false, error: 'Parâmetro "termo" é obrigatório' });
  }

  try {
    const resultado = await buscarReferencias(String(termo).trim(), parseLimit(limite));
    return res.json({
      ...resultado,
      aviso: 'Rota legada: prefira /api/referencias/search para novas integrações.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao consultar referências',
    });
  }
});

/**
 * GET /api/sinapi/:codigo
 * Busca composição específica pelo código
 */
router.get('/:codigo', async (req: Request, res: Response) => {
  const { codigo } = req.params;

  const { data, error } = await supabase
    .from('sinapi_composicoes')
    .select('*')
    .eq('codigo', codigo)
    .single();

  if (error || !data) {
    return res.status(404).json({ success: false, error: `SINAPI ${codigo} não encontrado` });
  }

  res.json({
    success: true,
    data: {
      codigo: data.codigo,
      descricao: data.descricao,
      unidade: data.unidade,
      custo_referencia: formatCurrency(data.valor_unitario),
      composicao: data.composicao || null,
    }
  });
});

export default router;
