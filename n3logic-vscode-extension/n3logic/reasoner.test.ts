// n3logic/reasoner.test.ts
// Test suite for N3LogicReasoner: reasoning, builtins, extensibility
import { N3LogicReasoner, N3ReasonerResult } from './N3LogicReasoner';

describe('N3LogicReasoner', () => {
  it('performs basic forward chaining', () => {
    const reasoner = new N3LogicReasoner();
    const n3 = `
      <a> <b> "1" .
      { <a> <b> ?x } => { <a> <c> ?x } .
    `;
    reasoner.loadOntology(n3, 'n3');
    const result: N3ReasonerResult = reasoner.reason();
    // Debug output
    console.log('TRIPLES:', JSON.stringify(result.triples, null, 2));
    for (const triple of result.triples) {
      console.log('DEBUG TRIPLE:', triple);
    }
    expect(result.triples.some((t) => t.predicate && typeof t.predicate === 'object' && 'value' in t.predicate && t.predicate.value === 'c')).toBe(true);
  });

  it('supports custom builtins', () => {
    const reasoner = new N3LogicReasoner();
  reasoner.registerBuiltin({
      uri: 'http://example.org/custom#alwaysTrue',
      arity: 1,
      description: 'Always returns true',
      apply: (...args: any[]) => {
        console.log('[DEBUG custom builtin] args:', args);
        return true;
      }
    });
    const n3 = `
      <a> <b> "foo" .
      { <a> <b> ?x . ?x <http://example.org/custom#alwaysTrue> ?x } => { <a> <c> ?x } .
    `;
  reasoner.loadOntology(n3, 'n3');
  // Print loaded triples for debug
  // @ts-ignore
  console.log('[DEBUG test] loaded triples:', JSON.stringify(reasoner.document.triples, null, 2));
    const result: N3ReasonerResult = reasoner.reason();
    for (const triple of result.triples) {
      if (triple.predicate && typeof triple.predicate === 'object' && 'value' in triple.predicate && triple.predicate.value === 'c') {
        console.log('DEBUG PRODUCED TRIPLE:', triple, 'object type:', triple.object && typeof triple.object === 'object' && 'type' in triple.object ? triple.object.type : typeof triple.object);
      }
    }
    expect(result.triples.some((t) => t.predicate && typeof t.predicate === 'object' && 'value' in t.predicate && t.predicate.value === 'c')).toBe(true);
  });

  it('supports plugins and hooks', () => {
    const reasoner = new N3LogicReasoner();
    let afterRuleApplied = false;
    reasoner.on('afterRuleApplied', () => { afterRuleApplied = true; });
    const n3 = `
      <a> <b> "1" .
      { <a> <b> ?x } => { <a> <c> ?x } .
    `;
    reasoner.loadOntology(n3, 'n3');
    reasoner.reason();
    expect(afterRuleApplied).toBe(true);
  });
});
