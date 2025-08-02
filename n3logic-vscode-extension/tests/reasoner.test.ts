import { N3LogicParser } from '../n3logic/N3LogicParser';
import { isRDFTrue, isRDFFalse } from '../n3logic/builtins/N3LogicLogicBuiltins';
// Use global jest object
// ...existing code from n3logic/reasoner.test.ts...

import { N3LogicReasoner, N3ReasonerResult } from '../n3logic/N3LogicReasoner';
import { N3Term } from '../n3logic/N3LogicTypes';


import fs from 'fs';
import path from 'path';
// ESM/CJS compatible __dirname and __filename
let localFilename = '';
let localDirname = '';
if (typeof __filename !== 'undefined' && typeof __dirname !== 'undefined') {
	// CJS
	localFilename = __filename;
	localDirname = __dirname;
} else {
	// Fallback for ESM or unknown
	localFilename = '';
	localDirname = process.cwd();
}
// Use logs/cjs for CJS, logs/esm for ESM
const logDir = (typeof __filename !== 'undefined' && typeof __dirname !== 'undefined')
	? path.resolve(localDirname, '../logs/cjs')
	: path.resolve(localDirname, '../logs/esm');
const logFile = path.join(logDir, 'reasoner.test.log');
let originalLog: (...args: any[]) => void;
let originalDebug: (...args: any[]) => void;

function logToFile(...args: any[]) {
	const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ');
	fs.appendFileSync(logFile, msg + '\n');
		if (originalLog) originalLog.apply(console, args);
}

beforeAll(() => {
	// Ensure log directory exists
	fs.mkdirSync(path.dirname(logFile), { recursive: true });
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
	       reasoner.loadOntology(n3, 'n3');
	       const result: N3ReasonerResult = reasoner.reason();
	       // Debug: print all inferred triples
	       console.log('[TEST reasoner custom builtins] All inferred triples:', JSON.stringify(result.triples, null, 2));
	       // Only one triple should be inferred by the rule
	       // Log the actual triples for debugging
	       console.log('[DEBUG] result.triples:', JSON.stringify(result.triples, null, 2));
	       // Try to find the expected triple (robust to string or object format)
	       const inferredTriple = result.triples.find((t) => {
		   if (typeof t === 'string') {
		       return /<a>\s+<c>\s+"foo"/.test(t);
				   } else if (t && typeof t === 'object') {
					   const obj = t as any;
					   return (obj.subject?.value === 'a' && obj.predicate?.value === 'c' && obj.object?.value === 'foo');
		   }
		   return false;
	       });
	       console.log('[DEBUG] inferredTriple:', JSON.stringify(inferredTriple, null, 2));
	       expect(inferredTriple).toBeDefined();
	       // Optionally, check the total number of triples (2 asserted + 1 inferred)
	       expect(result.triples.length).toBe(3);
       });

	   it('diagnostic: reasoner should infer triple for "foo" only', () => {
			   const reasoner = new N3LogicReasoner();
			   reasoner.setDebug(false);
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
			   const n3 = '<a> <b> "foo" . <a> <b> "bar" . { <a> <b> ?x . ?x <http://example.org/custom#isFoo> ?x } => { <a> <c> ?x } .';
			   reasoner.loadOntology(n3, 'n3');
			   const result: N3ReasonerResult = reasoner.reason();
			   // Log all triples
			   console.log('[DIAG] All triples:', JSON.stringify(result.triples, null, 2));
			   // Should only infer <a> <c> "foo"
			   const fooTriple = result.triples.find((t: any) => {
				   if (typeof t === 'string') {
					   return /<a>\s+<c>\s+"foo"/.test(t);
				   } else if (t && typeof t === 'object') {
					   const obj = t as any;
					   return (obj.subject?.value === 'a' && obj.predicate?.value === 'c' && obj.object?.value === 'foo');
				   }
				   return false;
			   });
			   const barTriple = result.triples.find((t: any) => {
				   if (typeof t === 'string') {
					   return /<a>\s+<c>\s+"bar"/.test(t);
				   } else if (t && typeof t === 'object') {
					   const obj = t as any;
					   return (obj.subject?.value === 'a' && obj.predicate?.value === 'c' && obj.object?.value === 'bar');
				   }
				   return false;
			   });
			   expect(fooTriple).toBeDefined();
			   expect(barTriple).toBeUndefined();
	   });

	it('diagnostic: logic builtins isRDFTrue/isRDFFalse', () => {
	expect(isRDFTrue({ type: 'Literal', value: 'true' })).toBe(true);
	expect(isRDFTrue({ type: 'Literal', value: 'false' })).toBe(false);
	expect(isRDFFalse({ type: 'Literal', value: 'false' })).toBe(true);
	expect(isRDFFalse({ type: 'Literal', value: 'true' })).toBe(false);
	expect(isRDFTrue('true')).toBe(true);
	expect(isRDFTrue('false')).toBe(false);
	expect(isRDFFalse('false')).toBe(true);
	expect(isRDFFalse('true')).toBe(false);
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
