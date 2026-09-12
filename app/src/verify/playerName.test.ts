import { validatePlayerName } from './playerName';

describe('validatePlayerName', () => {
  it('trims surrounding whitespace', () => {
    expect(validatePlayerName('  lena ')).toBe('lena');
  });
  it('rejects empty and whitespace-only names', () => {
    expect(validatePlayerName('')).toBeNull();
    expect(validatePlayerName('   ')).toBeNull();
  });
  it('accepts 1 and 20 characters', () => {
    expect(validatePlayerName('a')).toBe('a');
    expect(validatePlayerName('abcdefghijklmnopqrst')).toBe('abcdefghijklmnopqrst');
  });
  it('rejects 21 characters, even when only the trimmed length counts', () => {
    expect(validatePlayerName('abcdefghijklmnopqrstu')).toBeNull();
    expect(validatePlayerName(' abcdefghijklmnopqrst ')).toBe('abcdefghijklmnopqrst');
  });
});
