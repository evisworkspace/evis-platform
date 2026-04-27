import { runDisciplineBaseline } from './run_discipline_baseline';

await runDisciplineBaseline({
  specialistId: 'discipline_specialist_hidraulica_sanitaria',
  directoryName: 'hidraulica_sanitaria',
  label: 'hidráulica/sanitária',
  markdownTitle: 'Baseline Hidráulica e Sanitária',
  outputPrefix: 'baseline_hidraulica',
});
