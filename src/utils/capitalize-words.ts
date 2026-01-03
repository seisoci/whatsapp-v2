/**
 * Capitalizes the first letter of each word in a string (ucwords equivalent)
 * @param str - The input string to capitalize
 * @returns The string with each word capitalized
 * @example
 * capitalizeWords('from onu') // Returns: 'From Onu'
 * capitalizeWords('from isp') // Returns: 'From Isp'
 */
export function capitalizeWords(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
