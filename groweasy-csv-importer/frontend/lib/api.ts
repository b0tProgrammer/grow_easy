import type { ImportResult, JobProgress } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

interface StartImportResponse {
  success: boolean;
  jobId: string;
  totalRows: number;
  error?: string;
}

/** Kicks off the backend import job for a given CSV file. */
export async function startImport(file: File): Promise<StartImportResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/api/import`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to start import.');
  }
  return data;
}

/**
 * Subscribes to live progress for a job via Server-Sent Events, falling
 * back to polling if EventSource isn't available/fails. Resolves with the
 * final ImportResult once the job completes.
 */
export function subscribeToImport(
  jobId: string,
  onProgress: (progress: JobProgress) => void
): Promise<ImportResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let source: EventSource | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      source?.close();
      if (pollTimer) clearInterval(pollTimer);
    };

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    };

    const startPolling = () => {
      pollTimer = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/import/${jobId}`);
          const data = await res.json();
          if (data.progress) onProgress(data.progress);
          if (data.status === 'done') finish(() => resolve(data.result));
          if (data.status === 'error') finish(() => reject(new Error(data.error)));
        } catch (err) {
          finish(() => reject(err as Error));
        }
      }, 1500);
    };

    try {
      source = new EventSource(`${API_BASE}/api/import/${jobId}/events`);
      source.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'progress') onProgress(payload.progress);
        if (payload.type === 'done') finish(() => resolve(payload.result));
        if (payload.type === 'error') finish(() => reject(new Error(payload.error)));
      };
      source.onerror = () => {
        // SSE dropped (e.g. proxy buffering) — fall back to polling instead
        // of failing the whole import.
        source?.close();
        if (!settled) startPolling();
      };
    } catch {
      startPolling();
    }
  });
}
