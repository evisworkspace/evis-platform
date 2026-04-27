import { runDisciplineBaseline } from './run_discipline_baseline';

await runDisciplineBaseline({
  specialistId: 'discipline_specialist_estrutural',
  directoryName: 'estrutural',
  label: 'estrutural',
  markdownTitle: 'Baseline Estrutural',
  outputPrefix: 'baseline_estrutural',
});
