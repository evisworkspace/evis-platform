import { pathToFileURL } from 'node:url';
import { getOrcamentistaPipelineView } from './pipelineView';

type CliOptions = {
  opportunityId?: string;
  help: boolean;
};

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printUsage();
    return;
  }

  if (!options.opportunityId) {
    throw new Error('--opportunity-id is required.');
  }

  const result = await getOrcamentistaPipelineView({ opportunityId: options.opportunityId });
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
    ...result.data
  }, null, 2));
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = { help: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }

    if (arg === '--opportunity-id' && next) {
      options.opportunityId = next;
      index += 1;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  return options;
}

function printUsage(): void {
  console.log([
    'Usage:',
    '  npx tsx platform/server/orcamentista/pipelineViewCli.ts --opportunity-id <uuid>',
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
    console.error(error instanceof Error ? error.message : 'Pipeline view failed.');
    process.exitCode = 1;
  });
}
