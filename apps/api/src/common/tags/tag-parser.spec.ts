import {
  extractTagCandidates,
  normalizeTagCandidate,
  mergeTagCandidates,
  MAX_TAGS_PER_VIDEO,
} from './tag-parser';

describe('extractTagCandidates', () => {
  it('matches a hashtag at the start of the string', () => {
    expect(extractTagCandidates('#amapiano vibes')).toEqual(['amapiano']);
  });

  it('is case-insensitive and normalizes to lowercase', () => {
    expect(extractTagCandidates('#AmapianoVibes')).toEqual(['amapianovibes']);
  });

  it('does not match a hashtag shorter than 2 characters', () => {
    expect(extractTagCandidates('# a')).toEqual([]);
  });

  it('matches when punctuation immediately follows the tag', () => {
    expect(extractTagCandidates('so good #fire!')).toEqual(['fire']);
  });

  it('matches two adjacent hashtags independently', () => {
    expect(extractTagCandidates('#amapiano#gqom')).toEqual(['amapiano', 'gqom']);
  });

  it('dedupes repeated tags, keeping first-appearance order', () => {
    expect(extractTagCandidates('#gqom nice #gqom #kwaito')).toEqual(['gqom', 'kwaito']);
  });

  it('returns an empty array when there are no hashtags', () => {
    expect(extractTagCandidates('just a description')).toEqual([]);
  });

  it('truncates a run longer than 30 characters to the first 30', () => {
    expect(extractTagCandidates(`#${'a'.repeat(31)}`)).toEqual(['a'.repeat(30)]);
  });
});

describe('normalizeTagCandidate', () => {
  it('strips a leading # and lowercases', () => {
    expect(normalizeTagCandidate('#Amapiano')).toBe('amapiano');
  });

  it('accepts a tag with no leading #', () => {
    expect(normalizeTagCandidate('Gqom')).toBe('gqom');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeTagCandidate('  kwaito  ')).toBe('kwaito');
  });

  it('rejects a tag shorter than 2 characters', () => {
    expect(normalizeTagCandidate('a')).toBeNull();
  });

  it('rejects a tag with invalid characters', () => {
    expect(normalizeTagCandidate('house music')).toBeNull();
  });
});

describe('mergeTagCandidates', () => {
  it('merges description hashtags with explicit tags, deduped', () => {
    expect(mergeTagCandidates('#gqom good track', ['gqom', 'kwaito'])).toEqual([
      'gqom',
      'kwaito',
    ]);
  });

  it('returns an empty array when both sources are empty', () => {
    expect(mergeTagCandidates('', [])).toEqual([]);
    expect(mergeTagCandidates(null, undefined)).toEqual([]);
  });

  it('caps the merged result at MAX_TAGS_PER_VIDEO, dropping extras silently', () => {
    const explicit = Array.from({ length: 15 }, (_, i) => `tag${i}`);
    const result = mergeTagCandidates(null, explicit);
    expect(result).toHaveLength(MAX_TAGS_PER_VIDEO);
    expect(result).toEqual(explicit.slice(0, MAX_TAGS_PER_VIDEO));
  });

  it('drops invalid explicit tags without erroring', () => {
    expect(mergeTagCandidates(null, ['gqom', 'a', 'house music'])).toEqual(['gqom']);
  });
});
