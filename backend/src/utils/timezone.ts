/**
 * Timezone Utility
 * Converts UTC timestamps to Asia/Jakarta timezone
 */

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000; // UTC+7

/**
 * Convert Unix timestamp (seconds) to Jakarta timezone Date
 * WhatsApp sends Unix timestamps in UTC
 */
export function unixToJakarta(unixTimestamp: number): Date {
  // Unix timestamp is in seconds, convert to milliseconds
  const utcMs = unixTimestamp * 1000;
  // Add Jakarta offset (UTC+7)
  return new Date(utcMs + JAKARTA_OFFSET_MS);
}

/**
 * Convert UTC Date to Jakarta timezone Date
 */
export function utcToJakarta(utcDate: Date): Date {
  return new Date(utcDate.getTime() + JAKARTA_OFFSET_MS);
}

/**
 * Get current time in Jakarta timezone
 */
export function nowJakarta(): Date {
  return new Date(Date.now() + JAKARTA_OFFSET_MS);
}
