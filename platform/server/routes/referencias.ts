import { Router, Request, Response } from 'express';
import { buscarReferencias, parseLimit } from '../lib/referenciasSearch';

const router = Router();

/**
 * GET /api/referencias/search?termo=reboco&limite=10
 * Busca agregada:
 * 1. Catalogo residencial EVIS
 * 2. SINAPI oficial como fallback
 */
router.get('/search', async (req: Request, res: Response) => {
  const { termo, limite = '8' } = req.query;

  if (!termo) {
    return res.status(400).json({ success: false, error: 'Parâmetro "termo" é obrigatório' });
  }

  try {
    const resultado = await buscarReferencias(String(termo).trim(), parseLimit(limite));
    return res.json(resultado);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Falha ao consultar referências',
    });
  }
});

export default router;
