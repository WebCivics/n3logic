import { splitTriples } from '../../n3logic/parser/TripleSplitter';

describe('splitTriples', () => {
  it('splits simple triples', () => {
    const text = '<a> <b> <c> .\n<d> <e> <f> .';
    expect(splitTriples(text)).toEqual(['<a> <b> <c>', '<d> <e> <f>']);
  });

  it('handles quoted literals', () => {
    const text = '<a> <b> "foo bar." .\n<d> <e> <f> .';
    expect(splitTriples(text)).toEqual(['<a> <b> "foo bar."', '<d> <e> <f>']);
  });

  it('handles lists and blank nodes', () => {
    const text = '<a> <b> (1 2 3) .\n<d> <e> _:x .';
    expect(splitTriples(text)).toEqual(['<a> <b> (1 2 3)', '<d> <e> _:x']);
  });

  it('handles semicolons and newlines', () => {
    const text = '<a> <b> <c> ;\n<d> <e> <f> .';
    expect(splitTriples(text)).toEqual(['<a> <b> <c>', '<d> <e> <f>']);
  });
});
