import { customAlphabet } from "nanoid";

// Lowercase alphanumeric, no ambiguous characters. 10 chars gives a collision-
// resistant ID space while staying short enough for human-readable PID URLs.
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";
const nanoid = customAlphabet(ALPHABET, 10);

/**
 * Generates a short, collision-resistant identifier.
 * Useful for public-facing IDs like PIDs (e.g., "ps_8f9a2b1c0d").
 *
 * @param prefix An optional string to prepend to the ID (e.g., "ps")
 */
export function generatePID(prefix?: string): string {
  const randomPart = nanoid();
  return prefix ? `${prefix}_${randomPart}` : randomPart;
}
