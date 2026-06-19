/**
 * Generates a short, random identifier.
 * Useful for public-facing IDs like PIDs (e.g., "ps_8f9a2b").
 * 
 * @param prefix An optional string to prepend to the ID (e.g., "ps")
 */
export function generatePID(prefix?: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${randomPart}` : randomPart;
}
