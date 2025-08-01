import { tokenizeTriples } from '../../n3logic/parser/TripleTokenizer';

describe('tokenizeTriples', () => {
  it('tokenizes simple triples', () => {
    const text = '<a> <b> <c> . <d> <e> <f> .';
    expect(tokenizeTriples(text)).toEqual(['<a> <b> <c>', '<d> <e> <f>']);
  });

  it('handles quoted literals', () => {
    const text = '<a> <b> "foo bar." . <d> <e> <f> .';
    expect(tokenizeTriples(text)).toEqual(['<a> <b> "foo bar."', '<d> <e> <f>']);
  });

  it('handles lists and blank nodes', () => {
    const text = '<a> <b> (1 2 3) . <d> <e> _:x .';
    expect(tokenizeTriples(text)).toEqual(['<a> <b> (1 2 3)', '<d> <e> _:x']);
  });

  it('handles nested lists and quotes', () => {
    const text = '<a> <b> ("foo" (bar)) .';
    expect(tokenizeTriples(text)).toEqual(['<a> <b> ("foo" (bar))']);
  });
});
