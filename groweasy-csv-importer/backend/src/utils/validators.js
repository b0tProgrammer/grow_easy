const { CRM_FIELDS, CRM_STATUS_VALUES, DATA_SOURCE_VALUES } = require('../config/constants');

/**
 * Defense-in-depth: the prompt instructs the model to only use allowed enum
 * values and valid dates, but LLM output should never be trusted blindly.
 * This sanitizes a single record so a hallucinated enum value or garbage
 * date can never reach the API response.
 */
function sanitizeRecord(rawData = {}) {
  const clean = {};
  for (const field of CRM_FIELDS) {
    clean[field] = typeof rawData[field] === 'string' ? rawData[field].trim() : '';
  }

  if (clean.crm_status && !CRM_STATUS_VALUES.includes(clean.crm_status)) {
    clean.crm_status = '';
  }
  if (clean.data_source && !DATA_SOURCE_VALUES.includes(clean.data_source)) {
    clean.data_source = '';
  }
  if (clean.created_at) {
    const parsed = new Date(clean.created_at);
    if (Number.isNaN(parsed.getTime())) {
      clean.created_at = '';
    }
  }
  // CSV safety: strip characters that would break a single-row CSV record.
  for (const field of CRM_FIELDS) {
    if (clean[field]) {
      clean[field] = clean[field].replace(/\r?\n/g, '\\n');
    }
  }

  return clean;
}

/**
 * Final backend-side enforcement of the assignment's skip rule, independent
 * of whether the model got it right: a record with neither email nor
 * mobile number is never allowed through as "imported".
 */
function hasContactInfo(data) {
  return Boolean(data.email) || Boolean(data.mobile_without_country_code);
}

module.exports = { sanitizeRecord, hasContactInfo };
