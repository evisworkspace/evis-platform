import { runDisciplineBaseline } from './run_discipline_baseline';

await runDisciplineBaseline({
  specialistId: 'discipline_specialist_eletrica',
  directoryName: 'eletrica',
  label: 'elétrica',
  markdownTitle: 'Baseline Elétrica',
  outputPrefix: 'baseline_eletrica',
});
