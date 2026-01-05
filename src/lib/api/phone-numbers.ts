/**
 * Phone Numbers API
 * Re-export from api-client for consistency
 */

export { phoneNumbersApi } from '../api-client';

// Legacy named exports for backward compatibility
import { phoneNumbersApi } from '../api-client';

export async function getAllPhoneNumbers() {
  return phoneNumbersApi.getAll();
}

export async function getPhoneNumber(id: string) {
  return phoneNumbersApi.getById(id);
}
