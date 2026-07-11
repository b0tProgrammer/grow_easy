'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface Props {
  onFileAccepted: (file: File) => void;
  error?: string | null;
}

export default function UploadZone({ onFileAccepted, error }: Props) {
  const [rejected, setRejected] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejections: any[]) => {
      setRejected(null);
      if (rejections.length > 0) {
        setRejected('Only .csv files are accepted.');
        return;
      }
      if (accepted[0]) onFileAccepted(accepted[0]);
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'text/csv': ['.csv'] },
  });

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className={[
          'group relative cursor-pointer rounded-lg border border-dashed transition-all duration-150',
          'flex flex-col items-center justify-center gap-3 py-16 px-8 text-center',
          isDragActive ? 'border-signal bg-signal/5' : 'border-line bg-surface hover:border-muted',
        ].join(' ')}
      >
        <input {...getInputProps()} aria-label="Upload CSV file" />
        <svg
          className={['w-9 h-9 transition-colors', isDragActive ? 'text-signal' : 'text-muted'].join(' ')}
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 16V4M12 4L7 9M12 4l5 5M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <p className="font-mono text-sm text-ink">
            {isDragActive ? 'Drop the CSV file here' : 'Drag & drop a CSV, or click to browse'}
          </p>
          <p className="text-xs text-muted mt-1">
            Any column layout works — Facebook, Google Ads, CRM exports, spreadsheets.
          </p>
        </div>
        <span className="mt-2 text-[11px] font-mono uppercase tracking-wide px-3 py-1.5 rounded border border-line text-muted group-hover:text-ink group-hover:border-muted transition-colors">
          Choose file
        </span>
      </div>
      {(rejected || error) && (
        <p className="mt-3 text-sm text-danger font-mono">{rejected || error}</p>
      )}
    </div>
  );
}
