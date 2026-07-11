'use client';

import { useCallback, useState } from 'react';
import Papa from 'papaparse';
import Stepper from '@/components/Stepper';
import UploadZone from '@/components/UploadZone';
import PreviewTable from '@/components/PreviewTable';
import ProcessingPanel from '@/components/ProcessingPanel';
import ResultTable from '@/components/ResultTable';
import { startImport, subscribeToImport } from '@/lib/api';
import type { ImportResult, JobProgress, Step } from '@/lib/types';

export default function Home() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileAccepted = useCallback((f: File) => {
    setError(null);
    setFile(f);
    Papa.parse(f, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (res) => {
        const fields = res.meta.fields || [];
        const parsedRows = (res.data as Record<string, string>[]).filter((r) =>
          Object.values(r).some((v) => String(v || '').trim() !== '')
        );
        if (parsedRows.length === 0) {
          setError('This CSV has no usable rows.');
          return;
        }
        setHeaders(fields);
        setRows(parsedRows);
        setStep('preview');
      },
      error: (err) => setError(`Could not parse CSV: ${err.message}`),
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!file) return;
    setError(null);
    setStep('processing');
    setProgress({ totalBatches: 0, completedBatches: 0, totalRows: rows.length });
    try {
      const { jobId } = await startImport(file);
      const finalResult = await subscribeToImport(jobId, setProgress);
      setResult(finalResult);
      setStep('result');
    } catch (err) {
      setError((err as Error).message);
      setStep('preview');
    }
  }, [file, rows.length]);

  const handleReset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setRows([]);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return (
    <main className="min-h-screen px-6 py-14">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 text-center">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-signal mb-3">GrowEasy · CRM Importer</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-ink">
            Any CSV shape in. Clean CRM leads out.
          </h1>
          <p className="text-muted mt-3 max-w-xl mx-auto text-sm">
            Facebook exports, Google Ads, spreadsheets, real-estate CRM dumps — upload it as-is.
            AI maps the columns for you.
          </p>
        </header>

        <div className="mb-12">
          <Stepper current={step} />
        </div>

        <section className="border border-line bg-surface/60 backdrop-blur rounded-xl p-6 md:p-10">
          {step === 'upload' && <UploadZone onFileAccepted={handleFileAccepted} error={error} />}

          {step === 'preview' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-mono text-sm text-ink">{file?.name}</h2>
                  <p className="text-xs text-muted mt-0.5">{rows.length.toLocaleString()} rows detected — nothing sent to AI yet.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleReset} className="px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wide border border-line text-muted hover:text-ink hover:border-muted transition-colors">
                    Choose different file
                  </button>
                  <button onClick={handleConfirm} className="px-5 py-2 rounded-md text-xs font-mono uppercase tracking-wide bg-signal text-base font-semibold hover:opacity-90 transition-opacity">
                    Confirm &amp; map to CRM
                  </button>
                </div>
              </div>
              <PreviewTable headers={headers} rows={rows} />
              {error && <p className="mt-3 text-sm text-danger font-mono">{error}</p>}
            </div>
          )}

          {step === 'processing' && <ProcessingPanel progress={progress} />}

          {step === 'result' && result && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-mono text-sm text-ink">Import complete</h2>
                <button onClick={handleReset} className="px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wide border border-line text-muted hover:text-ink hover:border-muted transition-colors">
                  Import another file
                </button>
              </div>
              <ResultTable result={result} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
