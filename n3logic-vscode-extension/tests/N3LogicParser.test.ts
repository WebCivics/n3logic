import { N3LogicParser } from '../n3logic/N3LogicParser';

describe('N3LogicParser', () => {
  const parser = new N3LogicParser();

  it('parses triples', () => {
    const n3 = '<a> <b> <c> .';
    const doc = parser.parse(n3);
    expect(doc.triples.length).toBe(1);
  });

  it('parses rules', () => {
    const n3 = '{ <a> <b> ?x } => { <a> <c> ?x } .';
    const doc = parser.parse(n3);
    expect(doc.rules.length).toBe(1);
  });

  it('throws on invalid input', () => {
    expect(() => parser.parse(123 as any)).toThrow();
  });
});
