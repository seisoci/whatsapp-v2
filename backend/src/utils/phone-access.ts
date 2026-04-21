import { AppDataSource } from '../config/database';
import type { User } from '../models/User';

/**
 * Returns null for super-admin (all phone numbers allowed),
 * or a Set of allowed phone_number UUIDs for regular users.
 */
export async function getUserAllowedPhoneNumberIds(user: User): Promise<Set<string> | null> {
  if (user.isSuperAdmin()) return null;

  const rows = await AppDataSource.query(
    'SELECT phone_number_id FROM user_phone_numbers WHERE user_id = $1',
    [user.id]
  );
  return new Set(rows.map((r: any) => r.phone_number_id));
}

/**
 * Returns true if the given phoneNumberId is accessible by the user.
 * Pass the result of getUserAllowedPhoneNumberIds as `allowedIds`.
 */
export function isPhoneNumberAllowed(
  allowedIds: Set<string> | null,
  phoneNumberId: string
): boolean {
  if (allowedIds === null) return true;
  return allowedIds.has(phoneNumberId);
}
