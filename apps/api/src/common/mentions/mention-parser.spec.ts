import { extractMentionCandidates } from './mention-parser';

describe('extractMentionCandidates', () => {
  it('matches a mention at the start of the string', () => {
    expect(extractMentionCandidates('@alice hello')).toEqual(['alice']);
  });

  it('does not match a bare @ at the end of the string', () => {
    expect(extractMentionCandidates('hello @')).toEqual([]);
  });

  it('matches a plain @name', () => {
    expect(extractMentionCandidates('@alice')).toEqual(['alice']);
  });

  it('matches when punctuation immediately follows the username', () => {
    expect(extractMentionCandidates('hey @alice!')).toEqual(['alice']);
    expect(extractMentionCandidates('@alice, thanks')).toEqual(['alice']);
  });

  it('matches two adjacent mentions independently', () => {
    expect(extractMentionCandidates('@alice@bob')).toEqual(['alice', 'bob']);
  });

  it('dedupes repeated mentions of the same user, keeping first-appearance order', () => {
    expect(extractMentionCandidates('@alice hi @alice again @bob')).toEqual(['alice', 'bob']);
  });

  it('does not match usernames shorter than 3 characters', () => {
    expect(extractMentionCandidates('@ab hi')).toEqual([]);
  });

  it('does not match an email-style short local part before a dot', () => {
    expect(extractMentionCandidates('contact x@y.com for details')).toEqual([]);
  });

  it('does not match when the token exceeds 30 characters', () => {
    const longName = 'a'.repeat(31);
    expect(extractMentionCandidates(`@${longName}`)).toEqual([]);
  });

  it('matches up to 30 characters', () => {
    const name = 'a'.repeat(30);
    expect(extractMentionCandidates(`@${name}`)).toEqual([name]);
  });

  it('returns an empty array when there are no mentions', () => {
    expect(extractMentionCandidates('just a regular comment')).toEqual([]);
  });

  it('matches underscores as part of the username charset', () => {
    expect(extractMentionCandidates('@al_ice_99 nice')).toEqual(['al_ice_99']);
  });
});
