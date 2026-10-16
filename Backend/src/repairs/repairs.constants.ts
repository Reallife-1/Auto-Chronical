export const DEFAULT_CURRENCY = 'NGN';
export const RECEIPTS_BUCKET = 'receipts'; //Private supabase storage bucket for receipts
export const MAX_RECEIPT_BYTES = 5 * 1024 * 1024; //5 MB
export const RECEIPT_URL_TTL_SECONDS = 300;
export const REPAIR_COLUMNS =
  'id, vehicle_id, issue_id, recorded_by, work_performed, provider_name, repair_date, amount, currency, created_at, updated_at';
export const MEDIA_COLUMNS =
  'id, repair_id, storage_bucket, storage_path, mime_type, file_size_bytes, created_at';
