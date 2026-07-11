const pLimit = require('p-limit');
const { extractBatch } = require('./aiExtractor');
const { BATCH_SIZE, MAX_CONCURRENT_BATCHES, MAX_RETRIES } = require('../config/constants');

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) out.push(array.slice(i, i + size));
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


async function runBatchWithRetry(indexedRows, headers, batchNumber, onProgress) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await extractBatch(indexedRows, headers);
      onProgress?.({ batchNumber, status: 'done', attempt });
      return result;
    } catch (err) {
      lastError = err;
      onProgress?.({ batchNumber, status: 'retrying', attempt, error: err.message });
      if (attempt < MAX_RETRIES) await sleep(500 * 2 ** attempt); // 500ms, 1s, 2s...
    }
  }

  return {
    imported: [],
    skipped: indexedRows.map(({ index, row }) => ({
      original_index: index,
      source_row: row,
      reason: `AI batch failed after ${MAX_RETRIES + 1} attempts: ${lastError.message}`,
    })),
  };
}


async function processRows(rows, headers, onProgress) {
  const indexedRows = rows.map((row, index) => ({ index, row }));
  const batches = chunk(indexedRows, BATCH_SIZE);
  const limit = pLimit(MAX_CONCURRENT_BATCHES);

  onProgress?.({ status: 'started', totalRows: rows.length, totalBatches: batches.length });

  const results = await Promise.all(
    batches.map((batch, i) => limit(() => runBatchWithRetry(batch, headers, i + 1, onProgress)))
  );

  const imported = [];
  const skipped = [];
  for (const r of results) {
    imported.push(...r.imported);
    skipped.push(...r.skipped);
  }

  
  imported.sort((a, b) => a.original_index - b.original_index);
  skipped.sort((a, b) => a.original_index - b.original_index);

  onProgress?.({ status: 'finished', totalImported: imported.length, totalSkipped: skipped.length });

  return {
    records: imported.map((r) => r.data),
    skipped: skipped.map((s) => ({ row_number: s.original_index + 1, reason: s.reason, source_row: s.source_row })),
    totalImported: imported.length,
    totalSkipped: skipped.length,
    totalRows: rows.length,
  };
}

module.exports = { processRows };
