

const CRM_STATUS_VALUES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
];

const DATA_SOURCE_VALUES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
];

const CRM_FIELDS = [
  'created_at',
  'name',
  'email',
  'country_code',
  'mobile_without_country_code',
  'company',
  'city',
  'state',
  'country',
  'lead_owner',
  'crm_status',
  'crm_note',
  'data_source',
  'possession_time',
  'description',
];

const FIELD_DESCRIPTIONS = {
  created_at: 'Lead creation date/time. Must be parseable by JavaScript `new Date(...)`. Prefer "YYYY-MM-DD HH:mm:ss".',
  name: 'Full name of the lead.',
  email: 'Primary email address (first one found, if several exist).',
  country_code: 'Phone country code, e.g. "+91". Infer from the number/locale if not explicit; leave blank if truly unknown.',
  mobile_without_country_code: 'Mobile number WITHOUT the country code, digits only where possible.',
  company: 'Company / organization the lead is associated with.',
  city: 'City.',
  state: 'State / province.',
  country: 'Country.',
  lead_owner: 'The salesperson/agent/email assigned to this lead, if present in the source data.',
  crm_status: `One of: ${CRM_STATUS_VALUES.join(', ')}. Infer intelligently from any status/stage/remark column. If genuinely unclear, leave blank rather than guessing.`,
  crm_note: 'Free-text notes: remarks, follow-up notes, extra phone numbers/emails, or anything useful that has no other home.',
  data_source: `One of: ${DATA_SOURCE_VALUES.join(', ')}. Only set this if you are confident it matches; otherwise leave blank.`,
  possession_time: 'For real-estate leads: expected property possession time/date, if present in source data.',
  description: 'Any additional freeform description of the lead/enquiry not captured elsewhere.',
};

module.exports = {
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
  CRM_FIELDS,
  FIELD_DESCRIPTIONS,
  BATCH_SIZE: Number(process.env.BATCH_SIZE) || 20,
  MAX_CONCURRENT_BATCHES: Number(process.env.MAX_CONCURRENT_BATCHES) || 3,
  MAX_RETRIES: Number(process.env.MAX_RETRIES) || 2,
  MAX_UPLOAD_BYTES: 15 * 1024 * 1024, 
};
