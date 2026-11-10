/**
 * Mochi's API uses Clojure-style boolean keys with a trailing `?` (e.g. `archived?`).
 * MCP clients reject tool parameter names containing `?` (names must match
 * /^[a-zA-Z0-9_.-]{1,64}$/), so tool input schemas expose these keys without the
 * `?`, and handlers convert them back before calling the API.
 */
const MOCHI_QUESTION_KEYS = ["archived", "trashed", "review-reverse", "show-sides"] as const;

type MochiQuestionKey = (typeof MOCHI_QUESTION_KEYS)[number];

export type ToMochiKeys<T> = {
  [K in keyof T as K extends MochiQuestionKey ? `${K}?` : K]: T[K];
};

export function toMochiKeys<T extends Record<string, unknown>>(params: T): ToMochiKeys<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    const isQuestionKey = (MOCHI_QUESTION_KEYS as readonly string[]).includes(key);
    result[isQuestionKey ? `${key}?` : key] = value;
  }
  return result as ToMochiKeys<T>;
}
