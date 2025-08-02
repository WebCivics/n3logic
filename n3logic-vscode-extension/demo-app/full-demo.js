
// Unified scenario-based regression runner for full-demo
const scenarios = [];

// Scenario 1: log:or (logic builtins)
scenarios.push({
	name: 'log:or builtins',
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
		const results = orCases.map((c, i) => {
			let result, error;
			try { result = logOr(...c.args); } catch (e) { error = e.message || String(e); }
			return {
				case: i, args: c.args, expected: c.expected, result, pass: result === c.expected, error
			};
		});
		return { results, pass: results.every(r => r.pass) };
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

const outPath = path.join(__dirname, 'full-logic-test-results.json');
fs.writeFileSync(outPath, JSON.stringify(allResults, null, 2));
console.log('Full-featured logic test results written to', outPath);
if (anyFail) process.exitCode = 1;
