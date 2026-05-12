import type {
  CreateDivergenceInput,
  CreateReaderVerifierComparisonInput,
  CreateVerifierRunInput,
  PersistenceResult
} from './contracts';
import type {
  OrcamentistaPersistenceRepository,
  PersistedRow
} from './repository';

export type ComparisonStageInput = Omit<
  CreateReaderVerifierComparisonInput,
  'verifier_run_id'
> & {
  verifier_run_id?: string;
};

export type DivergenceStageInput = Omit<
  CreateDivergenceInput,
  'comparison_id' | 'verifier_run_id'
> & {
  comparison_id?: string;
  verifier_run_id?: string;
};

export type PersistVerifierStageInput = {
  verifierRun: CreateVerifierRunInput;
  comparison: ComparisonStageInput;
  divergences?: DivergenceStageInput[];
};

export type PersistVerifierStageData = {
  verifierRun: PersistedRow;
  comparison: PersistedRow;
  divergences: PersistedRow[];
  lineage: {
    verifier_run_id: string;
    comparison_id: string;
    divergence_ids: string[];
  };
};

export async function persistVerifierStage(
  repository: OrcamentistaPersistenceRepository,
  input: PersistVerifierStageInput
): Promise<PersistenceResult<PersistVerifierStageData>> {
  const verifierRunResult = await repository.createVerifierRun(input.verifierRun);
  if (verifierRunResult.status !== 'success') return verifierRunResult;

  const comparisonResult = await repository.createReaderVerifierComparison({
    ...input.comparison,
    verifier_run_id: verifierRunResult.data.id
  });
  if (comparisonResult.status !== 'success') return comparisonResult;

  const divergences: PersistedRow[] = [];
  for (const divergence of input.divergences ?? []) {
    const divergenceResult = await repository.createReaderVerifierDivergence({
      ...divergence,
      comparison_id: divergence.comparison_id ?? comparisonResult.data.id,
      verifier_run_id: divergence.verifier_run_id ?? verifierRunResult.data.id
    });
    if (divergenceResult.status !== 'success') return divergenceResult;
    divergences.push(divergenceResult.data);
  }

  return {
    status: 'success',
    data: {
      verifierRun: verifierRunResult.data,
      comparison: comparisonResult.data,
      divergences,
      lineage: {
        verifier_run_id: verifierRunResult.data.id,
        comparison_id: comparisonResult.data.id,
        divergence_ids: divergences.map((divergence) => divergence.id)
      }
    },
    message: 'Verifier stage persisted.'
  };
}
