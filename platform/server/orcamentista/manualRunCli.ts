import { pathToFileURL } from 'node:url';
import { runControlledManualOrcamentistaAction } from './controlledManualAction';
import type { OrcamentistaManualRunInput } from './orcamentistaManualRun';

type CliOptions = OrcamentistaManualRunInput & {
  confirmStagingWrite: boolean;
  help: boolean;
};

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  if (!options.confirmStagingWrite) {
    throw new Error('Refusing to run without --confirm-staging-write.');
  }

  const result = await runControlledManualOrcamentistaAction(options);

  if (result.status !== 'success') {
    console.log(JSON.stringify({
      status: result.status,
      message: result.message
    }, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({
    status: result.status,
    action: result.data.action,
    projectRef: result.data.projectRef,
    marker: result.data.marker,
    opportunityId: result.data.opportunityId,
    orcamentoId: result.data.orcamentoId,
    opportunityFileId: result.data.opportunityFileId,
    readerRunId: result.data.readerRunId,
    verifierRunId: result.data.verifierRunId,
    hitlIssueId: result.data.hitlIssueId,
    finalContextSnapshotId: result.data.finalContextSnapshotId,
    pipelineSummary: result.data.pipelineSummary,
    latestContextStatus: result.data.latestContextStatus,
    canWriteConsolidationToBudget: result.data.canWriteConsolidationToBudget,
    touchedTables: result.data.touchedTables,
    touchedBudgetItemsTable: result.data.touchedBudgetItemsTable
  }, null, 2));
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    mode: 'manual_test',
    confirmStagingWrite: false,
    help: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--confirm-staging-write') {
      options.confirmStagingWrite = true;
      continue;
    }

    if (arg === '--mode' && isManualRunMode(next)) {
      options.mode = next;
      index += 1;
      continue;
    }

    if (arg === '--opportunity-id' && next) {
      options.opportunityId = next;
      index += 1;
      continue;
    }

    if (arg === '--orcamento-id' && next) {
      options.orcamentoId = next;
      index += 1;
      continue;
    }

    if (arg === '--opportunity-file-id' && next) {
      options.opportunityFileId = next;
      index += 1;
      continue;
    }

    if (arg === '--marker' && next) {
      options.marker = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return options;
}

function isManualRunMode(value: string | undefined): value is CliOptions['mode'] {
  return value === 'manual_test' || value === 'existing';
}

function printUsage(): void {
  console.log([
    'Usage:',
    '  npx tsx platform/server/orcamentista/manualRunCli.ts --mode manual_test --confirm-staging-write',
    '',
    'Existing anchors:',
    '  npx tsx platform/server/orcamentista/manualRunCli.ts --mode existing --opportunity-id <uuid> --orcamento-id <uuid> --confirm-staging-write',
    '',
    'Required environment variables in the current shell session:',
    '  EVIS_STAGING_PROJECT_REF',
    '  EVIS_BLOCKED_PRODUCTION_PROJECT_REF',
    '  EVIS_STAGING_SUPABASE_URL',
    '  EVIS_STAGING_SUPABASE_SERVICE_ROLE_KEY'
  ].join('\n'));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Manual run failed.');
    process.exitCode = 1;
  });
}
