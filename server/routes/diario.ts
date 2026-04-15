import { Router } from 'express';
import { orchestratorProcess } from '../agents/orchestrator';
import { getStatusObraHoje, supabase } from '../tools/supabaseTools';

const router = Router();

router.post('/processar-diario', async (req, res) => {
  const { transcricao, obra_id, data_referencia } = req.body;

  if (!transcricao || !obra_id || !data_referencia) {
    return res.status(400).json({ success: false, error: 'Parâmetros ausentes' });
  }

  try {
    // 1. Buscar contexto atual da obra no Supabase
    const status_atual = await getStatusObraHoje(obra_id, data_referencia);

    // 2. Chamar Orquestrador
    const resultado = await orchestratorProcess(transcricao, {
      obra_id,
      data_referencia,
      status_atual
    });
    
    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Erro ao processar diário:', error);
    res.status(500).json({ success: false, error: 'Erro interno ao processar diário' });
  }
});

router.post('/rascunho', async (req, res) => {
  const { transcricao, telegram_user } = req.body;

  if (!transcricao) {
    return res.status(400).json({ success: false, error: 'Transcrição ausente' });
  }

  try {
    // 1. Identificar a obra ativa (pegamos a primeira para o setup inicial de 1 obra)
    const { data: obras } = await supabase.from('obras').select('id').limit(1);
    
    if (!obras || obras.length === 0) {
      return res.status(404).json({ success: false, error: 'Nenhuma obra encontrada' });
    }

    const obra_id = obras[0].id;

    // 2. Salvar na tabela de notas como um rascunho para revisão
    const { error } = await supabase.from('notas').insert([
      {
        obra_id,
        conteudo: `[TELEGRAM: ${telegram_user || 'Usuário'}] ${transcricao}`,
        categoria: 'Nota', // Categoria padrão
        data: new Date().toISOString().split('T')[0]
      }
    ]);

    if (error) throw error;

    res.json({ success: true, message: 'Rascunho salvo com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar rascunho:', error);
    res.status(500).json({ success: false, error: 'Erro ao salvar rascunho' });
  }
});

export default router;

