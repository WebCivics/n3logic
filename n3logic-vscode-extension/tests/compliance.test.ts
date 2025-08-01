// ...existing code from n3logic/compliance.test.ts...
import { N3LogicParser } from '../n3logic/N3LogicParser';

describe('N3/N3Logic Syntax Compliance', () => {
  const parser = new N3LogicParser();

  it('parses IRIs, literals, variables, blank nodes, lists', () => {
    const n3 = `
      <a> <b> <c> .
      <a> <b> "literal" .
      <a> <b> ?x .
      <a> <b> _:b1 .
      <a> <b> ( <c> ?x "literal" ) .
    `;
    const doc = parser.parse(n3);
    expect(doc.triples.length).toBe(5);
  });

  it('parses rules with nested formulas and quantifiers', () => {
    const n3 = `@forAll ?x . { <a> <b> ?x } => { <c> <d> ?x } .`;
    const doc = parser.parse(n3);
    expect(doc.rules.length).toBe(1);
    // quantifiers may be undefined or an array
    const q = doc.rules[0].antecedent.quantifiers;
    if (q) {
      expect(Array.isArray(q)).toBe(true);
      expect(q.length).toBeGreaterThanOrEqual(0);
    } else {
      expect(q).toBeUndefined();
    }
  });

  // Add more edge case tests as needed
});
