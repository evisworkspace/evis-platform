import { runDisciplineBaseline } from './run_discipline_baseline';

await runDisciplineBaseline({
  specialistId: 'discipline_specialist_civil_execucao',
  directoryName: 'civil_execucao',
  label: 'civil/execução',
  markdownTitle: 'Baseline Civil e Execução',
  outputPrefix: 'baseline_civil',
});
