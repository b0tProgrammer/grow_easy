export const CRM_FIELDS = [
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
] as const;

export type CrmField = (typeof CRM_FIELDS)[number];
export type CrmRecord = Record<CrmField, string>;

export interface SkippedRecord {
  row_number: number;
  reason: string;
  source_row: Record<string, string>;
}

export interface ImportResult {
  records: CrmRecord[];
  skipped: SkippedRecord[];
  totalImported: number;
  totalSkipped: number;
  totalRows: number;
}

export interface JobProgress {
  totalBatches: number;
  completedBatches: number;
  totalRows: number;
}

export type Step = 'upload' | 'preview' | 'processing' | 'result';
