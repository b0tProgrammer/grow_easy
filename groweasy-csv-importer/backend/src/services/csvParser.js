const Papa = require('papaparse');

function parseCsv(csvString) {
  const result = Papa.parse(csvString, {
    header: true,
    skipEmptyLines: 'greedy',
    dynamicTyping: false,
    transformHeader: (h) => h.trim(),
    transform: (value) => (typeof value === 'string' ? value.trim() : value),
  });

  if (result.errors && result.errors.length) {
  
    const fatal = result.errors.filter((e) => e.type === 'Delimiter' || e.type === 'Quotes');
    if (fatal.length && result.data.length === 0) {
      throw new Error(`CSV could not be parsed: ${fatal[0].message}`);
    }
  }

  const headers = result.meta.fields || [];
  const rows = result.data.filter((row) =>
    Object.values(row).some((v) => v !== null && v !== undefined && String(v).trim() !== '')
  );

  if (rows.length === 0) {
    throw new Error('No usable rows found in the uploaded CSV.');
  }

  return { rows, headers, errors: result.errors || [] };
}

module.exports = { parseCsv };
