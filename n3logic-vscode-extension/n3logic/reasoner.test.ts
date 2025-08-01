// n3logic/reasoner.test.ts
import { N3LogicReasoner, N3ReasonerResult } from './N3LogicReasoner';
import { N3Term } from './N3LogicTypes';

describe('N3LogicReasoner', () => {

  // Redirect console.log to a file for test output review
  const fs = require('fs');
  const logFile = 'test-debug-output.log';
  let originalLog: (...args: any[]) => void;
  let originalDebug: (...args: any[]) => void;
  beforeAll(() => {
    originalLog = console.log;
    originalDebug = console.debug;
    // Overwrite log file at start
    fs.writeFileSync(logFile, '');
    const logToFile = (...args: any[]) => {
      const msg = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ');
      fs.appendFileSync(logFile, msg + '\n');
      if (originalLog) originalLog.apply(console, args);
    };
    console.log = logToFile;
    console.debug = logToFile;
  });
  afterAll(() => {
    if (originalLog) console.log = originalLog;
    if (originalDebug) console.debug = originalDebug;
  });

  it('performs basic forward chaining', () => {
    const reasoner = new N3LogicReasoner();
    const n3 = `
      <a> <b> "1" .
      { <a> <b> ?x } => { <a> <c> ?x } .
    `;
  reasoner.setDebug(true);
  reasoner.loadOntology(n3, 'n3');
  const result: N3ReasonerResult = reasoner.reason();

    // Expect two triples in total: the original fact and the new inference.
    expect(result.triples).toHaveLength(2);

    // Check specifically for the inferred triple.
    const inferredTriple = result.triples.find(t =>
      t.predicate && typeof t.predicate === 'object' && 'value' in t.predicate && t.predicate.value === 'c'
    );
    expect(inferredTriple).toBeDefined();
    // Validate the components of the inferred triple.
    expect(
      inferredTriple && inferredTriple.subject && typeof inferredTriple.subject === 'object' && 'value' in inferredTriple.subject
        ? inferredTriple.subject.value
        : undefined
    ).toBe('a');
    expect(
      inferredTriple && inferredTriple.object && typeof inferredTriple.object === 'object' && 'value' in inferredTriple.object
        ? inferredTriple.object.value
        : undefined
    ).toBe('1');
    expect(
      inferredTriple && inferredTriple.object && typeof inferredTriple.object === 'object' && 'type' in inferredTriple.object
        ? inferredTriple.object.type
        : undefined
    ).toBe('Literal');
  });

  it('supports custom builtins', () => {
    const reasoner = new N3LogicReasoner();
    reasoner.setDebug(true);
    reasoner.registerBuiltin({
      uri: 'http://example.org/custom#isFoo',
      arity: 1,
      description: 'Returns true if the subject is the literal "foo"',
      apply: (subject: N3Term) => {
        return (
          typeof subject === 'object' &&
          'type' in subject && subject.type === 'Literal' &&
          'value' in subject && subject.value === 'foo'
        );
      }
    });

    const n3 = `
      <a> <b> "foo" .
      <a> <b> "bar" .
      { <a> <b> ?x . ?x <http://example.org/custom#isFoo> ?x } => { <a> <c> ?x } .
    `;

    // Parse the ontology and log the parsed rules and triples for inspection
    const parser = new (require('./N3LogicParser').N3LogicParser)();
    parser.setDebug(true);
    const parsed = parser.parse(n3);
    // Log parsed triples and rules to the test log
    console.log('[TEST] Parsed triples:', JSON.stringify(parsed.triples, null, 2));
    console.log('[TEST] Parsed rules:', JSON.stringify(parsed.rules, null, 2));

    reasoner.loadOntology(n3, 'n3');
    const result: N3ReasonerResult = reasoner.reason();

    // Log result triples for inspection
    console.log('[TEST] Result triples:', JSON.stringify(result.triples, null, 2));

    // Expect three triples: two original facts, one inference.
    expect(result.triples).toHaveLength(3);

    // Check that the rule fired only for "foo" and not for "bar".
    const inferredTriple = result.triples.find(t =>
      t.predicate && typeof t.predicate === 'object' && 'value' in t.predicate && t.predicate.value === 'c'
    );
    expect(inferredTriple).toBeDefined();
    // Validate the components of the inferred triple.
    expect(
      inferredTriple && inferredTriple.subject && typeof inferredTriple.subject === 'object' && 'value' in inferredTriple.subject
        ? inferredTriple.subject.value
        : undefined
    ).toBe('a');
    expect(
      inferredTriple && inferredTriple.object && typeof inferredTriple.object === 'object' && 'value' in inferredTriple.object
        ? inferredTriple.object.value
        : undefined
    ).toBe('foo');
    expect(
      inferredTriple && inferredTriple.object && typeof inferredTriple.object === 'object' && 'type' in inferredTriple.object
        ? inferredTriple.object.type
        : undefined
    ).toBe('Literal');
  });

  it('supports plugins and hooks', () => {
    const reasoner = new N3LogicReasoner();
    let hookFired = false;

    // Register a hook that will be called when a rule is successfully applied.
    reasoner.setDebug(true);
    reasoner.on('afterRuleApplied', () => { 
      hookFired = true; 
    });
    
    const n3 = `
      <a> <b> "1" .
      { <a> <b> ?x } => { <a> <c> ?x } .
    `;
    reasoner.loadOntology(n3, 'n3');
    reasoner.reason();

    // The test passes if the hook was successfully triggered by the reasoner.
    expect(hookFired).toBe(true);
  });
});
