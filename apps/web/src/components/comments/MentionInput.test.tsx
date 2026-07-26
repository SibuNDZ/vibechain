import { describe, it, expect } from 'vitest';
import { findActiveMention } from './MentionInput';

describe('findActiveMention', () => {
  it('detects a mention at the start of the string', () => {
    expect(findActiveMention('@ali', 4)).toEqual({ query: 'ali', startIndex: 0 });
  });

  it('detects a mention right after whitespace', () => {
    expect(findActiveMention('hey @ali', 8)).toEqual({ query: 'ali', startIndex: 4 });
  });

  it('returns null when there is no @ before the cursor', () => {
    expect(findActiveMention('just typing', 11)).toBeNull();
  });

  it('returns an empty-query mention right after typing @', () => {
    expect(findActiveMention('hey @', 5)).toEqual({ query: '', startIndex: 4 });
  });

  it('returns null once the mention is broken by whitespace', () => {
    expect(findActiveMention('hey @ali ', 9)).toBeNull();
  });

  it('returns null when @ is preceded by a non-whitespace character', () => {
    expect(findActiveMention('email@ali', 9)).toBeNull();
  });

  it('tracks the mention at the cursor position, not the end of the string', () => {
    // cursor sits right after "@al", before "ice was here"
    expect(findActiveMention('@alice was here', 3)).toEqual({ query: 'al', startIndex: 0 });
  });

  it('uses the nearest @ when there are two in the string', () => {
    expect(findActiveMention('@alice @bo', 10)).toEqual({ query: 'bo', startIndex: 7 });
  });
});
