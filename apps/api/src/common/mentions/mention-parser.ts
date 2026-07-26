/**
 * Extracts @username tokens from raw comment text -- server-side only, never
 * trust a client-supplied mention list. Uses the same charset as
 * USERNAME_REGEX (see username-policy.ts) so a token can only match a
 * username that Stage 1's rules would actually allow.
 *
 * The trailing negative lookahead stops a longer invalid run (e.g. "@ab!cd")
 * from matching just its valid prefix. The {3,30} minimum also means an
 * email's local part shorter than 3 chars before a "." (e.g. "x@y.com") never
 * matches -- longer local parts (e.g. "user@bar.com") can still coincide with
 * a real username, which is an accepted limitation of this simple approach.
 */
const MENTION_TOKEN_REGEX = /@([a-z0-9_]{3,30})(?![a-z0-9_])/g;

export const MAX_MENTIONS_PER_COMMENT = 10;

/** Candidate @username tokens, deduped, in order of first appearance. Resolution against real users happens elsewhere. */
export function extractMentionCandidates(text: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const match of text.matchAll(MENTION_TOKEN_REGEX)) {
    const username = match[1];
    if (!seen.has(username)) {
      seen.add(username);
      ordered.push(username);
    }
  }

  return ordered;
}
