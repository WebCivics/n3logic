// tests/parser/RuleExtractor.test.ts
import { extractRules } from '../../n3logic/parser/RuleExtractor';

describe('RuleExtractor', () => {
  it('extracts a single rule from N3 text', () => {
    const n3 = `
      { <a> <b> ?x } => { <a> <c> ?x } .
    `;
    const rules = extractRules(n3);
    expect(rules).toHaveLength(1);
    expect(rules[0].antecedent).toContain('<a> <b> ?x');
    expect(rules[0].consequent).toContain('<a> <c> ?x');
  });

  it('extracts multiple rules from N3 text', () => {
    const n3 = `
      { <a> <b> ?x } => { <a> <c> ?x } .
      { <d> <e> ?y } => { <f> <g> ?y } .
    `;
    const rules = extractRules(n3);
    expect(rules).toHaveLength(2);
  });

  it('ignores comments and whitespace', () => {
    const n3 = `
      # This is a comment
      { <a> <b> ?x } => { <a> <c> ?x } . # end of rule
    `;
    const rules = extractRules(n3);
    expect(rules).toHaveLength(1);
  });

  it('returns empty array if no rules present', () => {
    const n3 = '<a> <b> "foo" .';
    const rules = extractRules(n3);
    expect(rules).toHaveLength(0);
  });
});
