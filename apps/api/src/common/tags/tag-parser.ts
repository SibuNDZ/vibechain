/**
 * Parses hashtags for a video: #tag tokens found in the description, merged
 * with an explicit tags array supplied by the client. Both sources are
 * normalized to the same lowercase charset, deduped, and capped -- extras
 * past the cap are silently dropped rather than rejecting the upload/edit.
 */
const TAG_TOKEN_REGEX = /#([a-z0-9_]{2,30})/gi;
const TAG_NAME_REGEX = /^[a-z0-9_]{2,30}$/;

export const MAX_TAGS_PER_VIDEO = 10;

/** Candidate tag names scanned from free text, lowercased, deduped, in order of first appearance. */
export function extractTagCandidates(text: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const match of text.matchAll(TAG_TOKEN_REGEX)) {
    const name = match[1].toLowerCase();
    if (!seen.has(name)) {
      seen.add(name);
      ordered.push(name);
    }
  }

  return ordered;
}

/** Normalizes one explicit tag entry (with or without a leading #); returns null if it doesn't fit the charset. */
export function normalizeTagCandidate(raw: string): string | null {
  const name = raw.trim().toLowerCase().replace(/^#/, "");
  return TAG_NAME_REGEX.test(name) ? name : null;
}

/** Merges description-derived and explicit tags, deduped in order of first appearance, capped at MAX_TAGS_PER_VIDEO. */
export function mergeTagCandidates(
  description: string | null | undefined,
  explicitTags: string[] | undefined
): string[] {
  const fromDescription = description ? extractTagCandidates(description) : [];
  const fromExplicit = (explicitTags ?? [])
    .map(normalizeTagCandidate)
    .filter((t): t is string => t !== null);

  const seen = new Set<string>();
  const merged: string[] = [];
  for (const name of [...fromDescription, ...fromExplicit]) {
    if (!seen.has(name)) {
      seen.add(name);
      merged.push(name);
    }
  }

  return merged.slice(0, MAX_TAGS_PER_VIDEO);
}
