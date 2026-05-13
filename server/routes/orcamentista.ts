import { Router } from 'express';
import { runControlledManualOrcamentistaAction } from '../../platform/server/orcamentista/controlledManualAction';
import { getOrcamentistaPipelineView } from '../../platform/server/orcamentista/pipelineView';
import { createStagingClientFromEnv } from '../../platform/server/orcamentista/persistence/stagingClient';

const router = Router();

// POST /api/orcamentista/manual-run
router.post('/manual-run', async (req, res) => {
  try {
    const { opportunityId, orcamentoId, opportunityFileId, mode, marker } = req.body;
    
    // Explicit server-side staging execution
    const bundle = createStagingClientFromEnv();
    
    const result = await runControlledManualOrcamentistaAction({
      opportunityId,
      orcamentoId,
      opportunityFileId,
      mode: mode || 'manual_test',
      marker: marker || 'UI_MANUAL_RUN',
      confirmStagingWrite: true,
    }, bundle);

    if (result.status !== 'success') {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error running orcamentista manual action:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// GET /api/orcamentista/pipeline-view
router.get('/pipeline-view', async (req, res) => {
  try {
    const { opportunityId } = req.query;
    if (!opportunityId || typeof opportunityId !== 'string') {
      return res.status(400).json({ error: 'opportunityId is required' });
    }

    const bundle = createStagingClientFromEnv();
    const result = await getOrcamentistaPipelineView({ opportunityId }, bundle);

    if (result.status !== 'success') {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error: any) {
    console.error('Error fetching pipeline view:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

export default router;
