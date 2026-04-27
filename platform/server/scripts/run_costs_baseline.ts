import { runDisciplineBaseline } from './run_discipline_baseline';

await runDisciplineBaseline({
  specialistId: 'discipline_specialist_custos_orcamentacao',
  directoryName: 'custos_orcamentacao',
  label: 'custos/orçamentação',
  markdownTitle: 'Baseline Custos e Orçamentação',
  outputPrefix: 'baseline_custos',
});
