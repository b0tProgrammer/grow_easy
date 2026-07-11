const { randomUUID } = require('crypto');

const jobs = new Map();
const JOB_TTL_MS = 15 * 60 * 1000; // 15 minutes

function createJob() {
  const id = randomUUID();
  const job = {
    id,
    status: 'processing', 
    progress: { totalBatches: 0, completedBatches: 0, totalRows: 0 },
    result: null,
    error: null,
    listeners: new Set(),
    createdAt: Date.now(),
  };
  jobs.set(id, job);
  setTimeout(() => jobs.delete(id), JOB_TTL_MS).unref?.();
  return job;
}

function getJob(id) {
  return jobs.get(id);
}

function updateProgress(job, patch) {
  job.progress = { ...job.progress, ...patch };
  emit(job, { type: 'progress', progress: job.progress });
}

function completeJob(job, result) {
  job.status = 'done';
  job.result = result;
  emit(job, { type: 'done', result });
}

function failJob(job, error) {
  job.status = 'error';
  job.error = error.message || String(error);
  emit(job, { type: 'error', error: job.error });
}

function subscribe(job, listener) {
  job.listeners.add(listener);
  return () => job.listeners.delete(listener);
}

function emit(job, payload) {
  for (const listener of job.listeners) listener(payload);
}

module.exports = { createJob, getJob, updateProgress, completeJob, failJob, subscribe };
