const MOCHI_QUESTION_MARK_KEYS = new Set([
  "archived",
  "trashed",
  "review-reverse",
  "show-sides",
]);

export function toMochiApiInput(input: Record<string, unknown>): Record<string, unknown> {
  const apiInput: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    const apiKey = MOCHI_QUESTION_MARK_KEYS.has(key) ? `${key}?` : key;
    apiInput[apiKey] = value;
  }

  return apiInput;
}
