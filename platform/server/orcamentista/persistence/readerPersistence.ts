import type {
  CreateReaderOutputInput,
  CreateReaderRunInput,
  CreateSafetyEvaluationInput,
  PersistenceResult,
  RegisterOpportunityFileInput
} from './contracts';
import type {
  OrcamentistaPersistenceRepository,
  PersistedOpportunityFile,
  PersistedRow
} from './repository';

export type ReaderOutputStageInput = Omit<
  CreateReaderOutputInput,
  'reader_run_id' | 'opportunity_file_id'
> & {
  reader_run_id?: string;
  opportunity_file_id?: string | null;
};

export type SafetyEvaluationStageInput = Omit<
  CreateSafetyEvaluationInput,
  'reader_run_id' | 'reader_output_id' | 'opportunity_file_id'
> & {
  reader_run_id?: string;
  reader_output_id?: string;
  opportunity_file_id?: string | null;
};

export type PersistReaderStageInput = {
  opportunityFile?: RegisterOpportunityFileInput;
  readerRun: CreateReaderRunInput;
  readerOutput: ReaderOutputStageInput;
  safetyEvaluation: SafetyEvaluationStageInput;
};

export type PersistReaderStageData = {
  opportunityFile?: PersistedOpportunityFile;
  readerRun: PersistedRow;
  readerOutput: PersistedRow;
  safetyEvaluation: PersistedRow;
  lineage: {
    opportunity_file_id: string;
    reader_run_id: string;
    reader_output_id: string;
    safety_evaluation_id: string;
  };
};

export async function persistReaderStage(
  repository: OrcamentistaPersistenceRepository,
  input: PersistReaderStageInput
): Promise<PersistenceResult<PersistReaderStageData>> {
  let opportunityFile: PersistedOpportunityFile | undefined;
  let opportunityFileId = input.readerRun.opportunity_file_id;

  if (input.opportunityFile) {
    const opportunityFileResult = await repository.createOpportunityFile(input.opportunityFile);
    if (opportunityFileResult.status !== 'success') return opportunityFileResult;

    opportunityFile = opportunityFileResult.data;
    opportunityFileId = opportunityFile.id;
  }

  const readerRunResult = await repository.createReaderRun({
    ...input.readerRun,
    opportunity_file_id: opportunityFileId
  });
  if (readerRunResult.status !== 'success') return readerRunResult;

  const readerOutputResult = await repository.createReaderOutput({
    ...input.readerOutput,
    reader_run_id: readerRunResult.data.id,
    opportunity_file_id: input.readerOutput.opportunity_file_id ?? opportunityFileId
  });
  if (readerOutputResult.status !== 'success') return readerOutputResult;

  const safetyEvaluationResult = await repository.createSafetyEvaluation({
    ...input.safetyEvaluation,
    reader_run_id: readerRunResult.data.id,
    reader_output_id: readerOutputResult.data.id,
    opportunity_file_id: input.safetyEvaluation.opportunity_file_id ?? opportunityFileId
  });
  if (safetyEvaluationResult.status !== 'success') return safetyEvaluationResult;

  return {
    status: 'success',
    data: {
      opportunityFile,
      readerRun: readerRunResult.data,
      readerOutput: readerOutputResult.data,
      safetyEvaluation: safetyEvaluationResult.data,
      lineage: {
        opportunity_file_id: opportunityFileId,
        reader_run_id: readerRunResult.data.id,
        reader_output_id: readerOutputResult.data.id,
        safety_evaluation_id: safetyEvaluationResult.data.id
      }
    },
    message: 'Reader stage persisted.'
  };
}
