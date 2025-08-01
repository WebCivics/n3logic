import { tokenizeTerms } from '../../n3logic/parser/TermTokenizer';

describe('tokenizeTerms', () => {
  it('tokenizes a simple triple', () => {
    expect(tokenizeTerms('<a> <b> <c>')).toEqual(['<a>', '<b>', '<c>']);
  });

  it('handles quoted strings', () => {
    expect(tokenizeTerms('<a> <b> "foo bar"')).toEqual(['<a>', '<b>', '"foo bar"']);
  });

  it('handles lists', () => {
    expect(tokenizeTerms('<a> <b> (1 2 3)')).toEqual(['<a>', '<b>', '(1 2 3)']);
  });

  it('handles blank nodes', () => {
    expect(tokenizeTerms('<a> <b> _:x')).toEqual(['<a>', '<b>', '_:x']);
  });

  it('handles nested lists and quotes', () => {
    expect(tokenizeTerms('<a> <b> ("foo" (bar))')).toEqual(['<a>', '<b>', '("foo" (bar))']);
  });
});
