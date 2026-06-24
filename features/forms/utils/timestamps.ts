/** Normalize a server-serialized Date for optimistic-concurrency payloads. */
export function toIsoTimestamp(value: Date | string): string {
  return new Date(value).toISOString();
}
