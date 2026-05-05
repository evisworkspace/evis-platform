import {
  OrcamentistaAgentDispatchJob,
  OrcamentistaAgentDispatchStatus,
  OrcamentistaAgentDispatchSummary,
  OrcamentistaAgentOutputStatus,
} from '../../types';

export function getAgentDispatchStatusLabel(status: OrcamentistaAgentDispatchStatus) {
  switch (status) {
    case 'waiting':
      return 'Aguardando';
    case 'released':
      return 'Liberado';
    case 'blocked':
      return 'Bloqueado';
    case 'running_mock':
      return 'Simulando';
    case 'completed':
      return 'Concluído';
    default:
      return status;
  }
}

export function getAgentOutputStatusLabel(status: OrcamentistaAgentOutputStatus) {
  switch (status) {
    case 'not_started':
      return 'Não iniciado';
    case 'completed':
      return 'Concluído';
    case 'completed_with_warnings':
      return 'Concluído com alertas';
    case 'blocked':
      return 'Bloqueado';
    case 'waiting_dependencies':
      return 'Aguardando dependências';
    default:
      return status;
  }
}

export function groupDispatchJobsByStatus(jobs: OrcamentistaAgentDispatchJob[]) {
  return jobs.reduce<Record<OrcamentistaAgentDispatchStatus, OrcamentistaAgentDispatchJob[]>>(
    (acc, job) => {
      acc[job.status].push(job);
      return acc;
    },
    {
      waiting: [],
      released: [],
      blocked: [],
      running_mock: [],
      completed: [],
    }
  );
}

export function getBlockedDispatchJobs(jobs: OrcamentistaAgentDispatchJob[]) {
  return jobs.filter((job) => job.status === 'blocked' || job.blockers.some((blocker) => blocker.blocks_dispatch));
}

export function getRunnableDispatchJobs(jobs: OrcamentistaAgentDispatchJob[]) {
  return jobs.filter(canRunDomainAgent);
}

export function getCompletedAgentOutputs(jobs: OrcamentistaAgentDispatchJob[]) {
  return jobs
    .map((job) => job.output)
    .filter((output): output is NonNullable<OrcamentistaAgentDispatchJob['output']> => !!output)
    .filter((output) => output.status === 'completed' || output.status === 'completed_with_warnings');
}

export function canRunDomainAgent(job: OrcamentistaAgentDispatchJob) {
  return job.allowed_to_run && !job.blockers.some((blocker) => blocker.blocks_dispatch);
}

export function canGeneratePreviewFromAgentOutputs(jobs: OrcamentistaAgentDispatchJob[]) {
  const completedOutputs = getCompletedAgentOutputs(jobs);
  const hasPreviewBlocker = jobs.some(
    (job) =>
      job.blockers.some((blocker) => blocker.blocks_preview) ||
      job.output?.blocks_preview ||
      job.status === 'blocked'
  );

  return completedOutputs.length > 0 && !hasPreviewBlocker;
}

export function getAgentBlockerReasons(job: OrcamentistaAgentDispatchJob) {
  return job.blockers.map((blocker) => blocker.reason);
}

export function summarizeAgentDispatch(jobs: OrcamentistaAgentDispatchJob[]): OrcamentistaAgentDispatchSummary {
  const grouped = groupDispatchJobsByStatus(jobs);

  return {
    total_agents: jobs.length,
    released_agents: grouped.released.length + grouped.running_mock.length,
    blocked_agents: getBlockedDispatchJobs(jobs).length,
    completed_agents: grouped.completed.length,
    waiting_agents: grouped.waiting.length,
    hitl_pending_agents: jobs.filter((job) =>
      job.blockers.some((blocker) => blocker.source_type === 'hitl' && blocker.blocks_dispatch) ||
      job.source_hitl_issue_ids.length > 0
    ).length,
    preview_blocked_agents: jobs.filter(
      (job) => job.blockers.some((blocker) => blocker.blocks_preview) || !!job.output?.blocks_preview
    ).length,
    consolidation_blocked_agents: jobs.filter(
      (job) =>
        job.blockers.some((blocker) => blocker.blocks_consolidation) ||
        !!job.output?.blocks_consolidation
    ).length,
  };
}
