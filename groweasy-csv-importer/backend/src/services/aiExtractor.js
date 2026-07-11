const { buildSystemPrompt, buildUserPrompt } = require('./promptBuilder');
const { sanitizeRecord, hasContactInfo } = require('../utils/validators');

const providers = {
  anthropic: require('./providers/anthropic'),
  openai: require('./providers/openai'),
  gemini: require('./providers/gemini'),
};

function getProvider() {
  const name = (process.env.AI_PROVIDER || 'anthropic').toLowerCase();
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown AI_PROVIDER "${name}". Expected one of: ${Object.keys(providers).join(', ')}`);
  }
  return provider;
}


function extractJson(text) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fenced ? fenced[1] : trimmed;
}


async function extractBatch(indexedRows, headers) {
  const provider = getProvider();
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(indexedRows, headers);

  const rawText = await provider.callModel(systemPrompt, userPrompt);

  let parsed;
  try {
    parsed = JSON.parse(extractJson(rawText));
  } catch (err) {
    throw new Error(`AI response was not valid JSON: ${err.message}`);
  }

  if (!parsed || !Array.isArray(parsed.results)) {
    throw new Error('AI response did not contain a "results" array.');
  }

  const byIndex = new Map(indexedRows.map(({ index, row }) => [index, row]));
  const imported = [];
  const skipped = [];

  for (const entry of parsed.results) {
    const originalIndex = entry.original_index;
    if (!byIndex.has(originalIndex)) continue; // ignore hallucinated indices

    if (entry.skipped) {
      skipped.push({
        original_index: originalIndex,
        source_row: byIndex.get(originalIndex),
        reason: entry.skip_reason || 'Skipped by AI (no reason given).',
      });
      continue;
    }

    const data = sanitizeRecord(entry.data);

 
    if (!hasContactInfo(data)) {
      skipped.push({
        original_index: originalIndex,
        source_row: byIndex.get(originalIndex),
        reason: 'No email or mobile number found (enforced server-side).',
      });
      continue;
    }

    imported.push({ original_index: originalIndex, data });
  }

  
  const covered = new Set(parsed.results.map((r) => r.original_index));
  for (const { index, row } of indexedRows) {
    if (!covered.has(index)) {
      skipped.push({
        original_index: index,
        source_row: row,
        reason: 'AI did not return a result for this row.',
      });
    }
  }

  return { imported, skipped };
}

module.exports = { extractBatch };
