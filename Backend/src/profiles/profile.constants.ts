export const DISTANCE_UNITS = ['km', 'mi'] as const;
export type DistanceUnit = (typeof DISTANCE_UNITS)[number];

/** Columns returned to the client. Never select more than this. */
export const PROFILE_COLUMNS =
  'id, first_name, last_name, email, phone, username, avatar_url, account_type, preferred_currency, locale, timezone, distance_unit, created_at';

/** True if `tz` is a real IANA timezone such as "Africa/Lagos". */
export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
