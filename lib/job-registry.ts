export type JobHandler<Payload = any> = (payload: Payload) => Promise<any>;

const jobRegistry: Record<string, JobHandler> = {};

export function registerJob(name: string, handler: JobHandler) {
  if (jobRegistry[name]) {
    throw new Error(`Job "${name}" is already registered`);
  }
  jobRegistry[name] = handler;
}

export function getJobHandler(name: string): JobHandler | undefined {
  return jobRegistry[name];
}

export function listJobs(): string[] {
  return Object.keys(jobRegistry);
}
