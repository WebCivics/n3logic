
// Unified scenario-based regression runner for esm-failures-demo
const scenarios = [];

// Scenario 1: log:or (logic builtins)
scenarios.push({
  name: 'log:or builtins',
  run: () => {
    const logicBuiltins = require('../../dist/cjs/n3logic/builtins/N3LogicLogicBuiltins');
    const logOr = logicBuiltins.logOr;
    const logOrCases = [
      { args: ["", "x"], expected: true },
      { args: ["x", ""], expected: true },
      { args: ["", ""], expected: false },
      { args: ["x", "y"], expected: true },
      { args: ["true", "false"], expected: true },
      { args: ["false", "false"], expected: false },
    ];
    const results = logOrCases.map((test, i) => {
      let result, error = null;
      try { result = logOr(test.args[0], test.args[1]); } catch (e) { error = e.message || String(e); }
      return { case: i, args: test.args, expected: test.expected, result, pass: result === test.expected, error };
    });
    return { results, pass: results.every(r => r.pass) };
  }
});

// Scenario 2: custom builtin inference
scenarios.push({
  name: 'custom builtin inference',
  run: () => {
    const { N3LogicReasoner } = require('../../dist/cjs/n3logic/N3LogicReasoner');
    const customBuiltin = {
      uri: 'http://example.org/custom#alwaysTrue',
      arity: 1,
      apply: () => true
    };
    const reasoner = new N3LogicReasoner();
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
    const { N3LogicReasoner } = require('../../dist/cjs/n3logic/N3LogicReasoner');
    const diagN3 = `@prefix : <#> .\n:foo a :Thing .\n:bar a :OtherThing .\n{ ?x a :Thing } => { ?x :inferred true } .`;
    const reasoner = new N3LogicReasoner();
    reasoner.loadOntology(diagN3, 'n3');
    const result = reasoner.reason();
    const fooTriple = result.triples.find(t => typeof t === 'string' ? t.includes(':foo') && t.includes(':inferred') : t.subject?.value === 'foo' && t.predicate?.value === 'inferred');
    const barTriple = result.triples.find(t => typeof t === 'string' ? t.includes(':bar') && t.includes(':inferred') : t.subject?.value === 'bar' && t.predicate?.value === 'inferred');
    return { fooTriple, barTriple, pass: !!fooTriple && !barTriple };
  }
});

// Run all scenarios and collect results
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
}

const outPath = path.join(__dirname, 'esm-failures-results.json');
fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
console.log('ESM failure demo results written to', outPath);
if (anyFail) process.exitCode = 1;
