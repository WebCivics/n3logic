const path = require('path');
const fs = require('fs');
// Unified scenario-based regression runner for demo-app
const { N3LogicReasoner } = require('../dist/cjs/n3logic/N3LogicReasoner');
const { N3LogicParser } = require('../dist/cjs/n3logic/N3LogicParser');

const scenarios = [];

// Scenario 1: log:or (logic builtins, with full debug)
scenarios.push({
  name: 'log:or builtins (diagnostic)',
  run: () => {
    const { LogicBuiltins } = require('../dist/cjs/n3logic/builtins/N3LogicLogicBuiltins');
    const getBuiltin = (name) => LogicBuiltins.find(b => b.uri === 'http://www.w3.org/2000/10/swap/log#' + name);
    const logOr = getBuiltin('or').apply;
    const orCases = [
      { args: [{ type: 'Literal', value: '' }, { type: 'Literal', value: 'x' }], expected: true },
      { args: [{ type: 'Literal', value: 'x' }, { type: 'Literal', value: '' }], expected: true },
      { args: [{ type: 'Literal', value: '' }, { type: 'Literal', value: '' }], expected: false },
      { args: [{ type: 'Literal', value: 'x' }, { type: 'Literal', value: 'y' }], expected: true },
      { args: [{ type: 'Literal', value: 'true' }, { type: 'Literal', value: 'false' }], expected: true },
      { args: [{ type: 'Literal', value: 'false' }, { type: 'Literal', value: 'false' }], expected: false },
    ];
    const debugLog = [];
    const results = orCases.map((c, i) => {
      let result, error;
      try {
        result = logOr(...c.args);
        debugLog.push({ case: i, args: c.args, result });
      } catch (e) {
        error = e.message || String(e);
        debugLog.push({ case: i, args: c.args, error });
      }
      return {
        case: i, args: c.args, expected: c.expected, result, pass: result === c.expected, error
      };
    });
    fs.writeFileSync(path.join(__dirname, 'log-or-diagnostic.log'), JSON.stringify(debugLog, null, 2));
    return { results, pass: results.every(r => r.pass), debugLogPath: 'log-or-diagnostic.log' };
  }
});
// Scenario 1b: Mirror failing Jest test for custom builtin (full trace)
scenarios.push({
  name: 'custom builtin (jest-mirror)',
  run: () => {
    const reasoner = new N3LogicReasoner();
    reasoner.setDebug(true);
    const builtin = {
      uri: 'http://example.org/custom#isFoo',
      arity: 1,
      description: 'Returns true if the subject is the literal "foo"',
      apply: (subject) => typeof subject === 'object' && subject.type === 'Literal' && subject.value === 'foo'
    };
    reasoner.registerBuiltin(builtin);
    const n3 = '<a> <b> "foo" . <a> <b> "bar" . { <a> <b> ?x . ?x <http://example.org/custom#isFoo> ?x } => { <a> <c> ?x } .';
    reasoner.loadOntology(n3, 'n3');
    const result = reasoner.reason();
    const inferredTriple = result.triples.find((t) => typeof t === 'string' && t.includes('<a> <c> "foo" .'));
    const allTriples = result.triples;
    fs.writeFileSync(path.join(__dirname, 'custom-builtin-jest-mirror.log'), JSON.stringify({ allTriples, inferredTriple }, null, 2));
    return { inferredTriple, allTriples, pass: !!inferredTriple, debugLogPath: 'custom-builtin-jest-mirror.log' };
  }
});

// Scenario 2: custom builtin inference
scenarios.push({
  name: 'custom builtin inference',
  run: () => {
    const reasoner = new N3LogicReasoner();
    const customBuiltin = {
      uri: 'http://example.org/custom#alwaysTrue',
      arity: 1,
      apply: () => true
    };
    reasoner.registerBuiltin(customBuiltin);
    const customN3 = `@prefix ex: <http://example.org/custom#> .\n@prefix : <#> .\n:a ex:alwaysTrue "foo" . { ?x ex:alwaysTrue ?y } => { ?x :inferred ?y } .`;
    reasoner.loadOntology(customN3, 'n3');
    const result = reasoner.reason();
    const found = result.triples.some(t => typeof t === 'string' ? t.includes(':inferred') : t.predicate?.value === 'inferred');
    return { inferredTriples: result.triples, pass: found };
  }
});

// Scenario 3: diagnostic inference (should infer triple for "foo" only)
scenarios.push({
  name: 'diagnostic inference',
  run: () => {
    const reasoner = new N3LogicReasoner();
    const diagN3 = `@prefix : <#> .\n:foo a :Thing .\n:bar a :OtherThing .\n{ ?x a :Thing } => { ?x :inferred true } .`;
    reasoner.loadOntology(diagN3, 'n3');
    const result = reasoner.reason();
    const fooTriple = result.triples.find(t => typeof t === 'string' ? t.includes(':foo') && t.includes(':inferred') : t.subject?.value === 'foo' && t.predicate?.value === 'inferred');
    const barTriple = result.triples.find(t => typeof t === 'string' ? t.includes(':bar') && t.includes(':inferred') : t.subject?.value === 'bar' && t.predicate?.value === 'inferred');
    return { fooTriple, barTriple, pass: !!fooTriple && !barTriple };
  }
});


// Run all scenarios and collect results, writing per-scenario logs
const allResults = [];
let anyFail = false;
for (const scenario of scenarios) {
  let res = {};
  try {
    res = scenario.run();
  } catch (e) {
    res = { error: e.message || String(e), pass: false };
  }
  allResults.push({ scenario: scenario.name, ...res });
  if (!res.pass) anyFail = true;
  // Write per-scenario debug log if present
  if (res.debugLogPath && fs.existsSync(path.join(__dirname, res.debugLogPath))) {
    console.log(`[DEBUG] Scenario '${scenario.name}' wrote debug log:`, res.debugLogPath);
  }
}

const outPath = path.join(__dirname, 'demo-regression-results.json');
fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
console.log('Demo regression results written to', outPath);
if (anyFail) process.exitCode = 1;
