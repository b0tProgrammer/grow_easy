'use client';

interface Props {
  headers: string[];
  rows: Record<string, string>[];
  maxRows?: number;
}


export default function PreviewTable({ headers, rows, maxRows = 200 }: Props) {
  const visible = rows.slice(0, maxRows);

  return (
    <div>
      <div className="data-table-wrap max-h-[420px]">
        <table className="data-table">
          <thead>
            <tr>
              <th>#</th>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                {headers.map((h) => (
                  <td key={h}>{row[h] || <span className="text-muted">—</span>}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && (
        <p className="text-xs text-muted font-mono mt-2">
          Showing first {maxRows.toLocaleString()} of {rows.length.toLocaleString()} rows. All rows will be sent for mapping.
        </p>
      )}
    </div>
  );
}
