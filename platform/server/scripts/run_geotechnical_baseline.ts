import { runDisciplineBaseline } from './run_discipline_baseline';

await runDisciplineBaseline({
  specialistId: 'discipline_specialist_geotecnico_fundacoes',
  directoryName: 'geotecnico_fundacoes',
  label: 'geotécnico/fundações',
  markdownTitle: 'Baseline Geotécnico e Fundações',
  outputPrefix: 'baseline_geotecnico',
});
