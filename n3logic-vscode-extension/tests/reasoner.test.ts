import { N3LogicParser } from '../n3logic/N3LogicParser';
// Use global jest object
// ...existing code from n3logic/reasoner.test.ts...

import { N3LogicReasoner, N3ReasonerResult } from '../n3logic/N3LogicReasoner';
import { N3Term } from '../n3logic/N3LogicTypes';


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, '../logs/reasoner.test.log');
let originalLog: (...args: any[]) => void;
let originalDebug: (...args: any[]) => void;

function logToFile(...args: any[]) {
	const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ');
	fs.appendFileSync(logFile, msg + '\n');
		if (originalLog) originalLog.apply(console, args);
}

beforeAll(() => {
	originalLog = console.log;
	originalDebug = console.debug;
	fs.writeFileSync(logFile, '');
	console.log = logToFile;
	console.debug = logToFile;
});
afterAll(() => {
	if (originalLog) console.log = originalLog;
	if (originalDebug) console.debug = originalDebug;
});

describe('N3LogicReasoner', () => {

       it('performs basic forward chaining', () => {
	       const reasoner = new N3LogicReasoner();
	       const n3 = `
		       <a> <b> "1" .
		       { <a> <b> ?x } => { <a> <c> ?x } .
	       `;
	       reasoner.setDebug(true);
	       reasoner.loadOntology(n3, 'n3');
	       const result: N3ReasonerResult = reasoner.reason();
		// Debug: print all inferred triples
		 
		console.log('[TEST reasoner] All inferred triples:', JSON.stringify(result.triples, null, 2));
		expect(result.triples).toHaveLength(2);
		// The reasoner now returns triples as N3 strings
		const inferredTriple = result.triples.find((t) => t.includes('<a> <c> "1" .'));
		 
		console.log('[TEST reasoner] Inferred triple for predicate c:', inferredTriple);
		expect(inferredTriple).toBeDefined();
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
		       },
	       });
			   // Use a single-line rule to ensure parser extracts the rule
			   const n3 = '<a> <b> "foo" . <a> <b> "bar" . { <a> <b> ?x . ?x <http://example.org/custom#isFoo> ?x } => { <a> <c> ?x } .';
									 const parser = new N3LogicParser();
									 parser.setDebug(true);
									 const parsed = parser.parse(n3);
									 // Print the full parsed.rules object to the console for debug
									  
									 console.log('[DEBUG] Full parsed.rules:', JSON.stringify(parsed.rules, null, 2));
									 if (parsed.rules && parsed.rules.length > 0) {
										 const antecedentTriples = parsed.rules[0].antecedent.triples;
										 // Print to console before any assertions
										  
										 console.log('[DEBUG] Rule antecedent triples:', JSON.stringify(antecedentTriples, null, 2));
										 antecedentTriples.forEach((triple: any, idx: any) => {
											  
											 console.log(`[DEBUG] Antecedent triple #${idx} predicate:`, triple.predicate);
										 });
									 }
						 // ...existing code...
	       reasoner.loadOntology(n3, 'n3');
	       const result: N3ReasonerResult = reasoner.reason();
	       // Debug: print all inferred triples
	        
	       console.log('[TEST reasoner custom builtins] All inferred triples:', JSON.stringify(result.triples, null, 2));
		expect(result.triples).toHaveLength(3);
		// The reasoner now returns triples as N3 strings
		const inferredTriple = result.triples.find((t) => t.includes('<a> <c> "foo" .'));
		 
		console.log('[TEST reasoner custom builtins] Inferred triple for predicate c:', inferredTriple);
		expect(inferredTriple).toBeDefined();
       });

		it('supports plugins and hooks', (done: any) => {
		const reasoner = new N3LogicReasoner();
		let hookFired = false;
		reasoner.setDebug(true);
		reasoner.on('afterRuleApplied', () => { 
			hookFired = true;
			// Defer assertion to next tick to ensure hook fires
			setTimeout(() => {
				expect(hookFired).toBe(true);
				done();
			}, 0);
		});
		const n3 = `
			<a> <b> "1" .
			{ <a> <b> ?x } => { <a> <c> ?x } .
		`;
		reasoner.loadOntology(n3, 'n3');
		reasoner.reason();
	});
});
