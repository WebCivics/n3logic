

// N3LogicReasoner.cjs.ts
// CJS version: use global __filename
// Use Node's global __filename directly in CJS

import { N3LogicDocument, N3Triple, N3Builtin, N3Term } from './N3LogicTypes';
import { HookManager } from './reasoner/hooks';
import { debugLog, debugTrace, setDebug } from './reasoner/debug';
import { mergeBuiltins } from './reasoner/builtinsManager';
import { matchAntecedent, instantiateTriple, matchFormula, tripleToN3 } from './reasoner/matcher';
import { newTraceId } from './trace';
import { N3LogicParser } from './N3LogicParser';
import { evaluateBuiltins } from './reasoner/builtinEvaluator';
import { stringToTriple, tripleToString } from './reasoner/tripleUtils';

// Extensible N3LogicReasoner with custom builtins and plugin/hook support
export interface N3ReasonerResult {
	message: string;
	triples: string[]; // N3 string output
	rules: any[];
	builtins?: any[];
}

export class N3LogicReasoner {
	/**
	 * The parsed ontology document (triples, rules, builtins).
	 */
	private document: N3LogicDocument = { triples: [], rules: [], builtins: [] };

	/**
	 * The raw ontology string loaded.
	 */
	private raw: string = '';

	/**
	 * Custom builtins registered by the user.
	 */
	private customBuiltins: N3Builtin[] = [];

	/**
	 * Plugins to run after ontology load.
	 */
	private plugins: Array<(reasoner: N3LogicReasoner) => void> = [];

	/**
	 * Hook manager for event hooks.
	 */
	private hookManager = new HookManager();

	constructor() {}

	/**
	 * Enable or disable debug logging for this reasoner instance.
	 */
	setDebug(debug: boolean): void {
		debugTrace && debugTrace('[N3LogicReasoner] setDebug called:', debug);
		setDebug(debug);
		debugTrace('[N3LogicReasoner][TRACE] setDebug finished:', debug);
	}

	/**
	 * Use the modularized matchAntecedent from matcher.ts with current builtins.
	 */
	matchAntecedent(patterns: N3Triple[], data: N3Triple[], traceId: string = newTraceId()): Array<Record<string, N3Term>> {
		debugTrace(`[N3LogicReasoner][TRACE][${traceId}] matchAntecedent called:`, { patterns, data });
		// Always use up-to-date document.builtins for every match
		if (!this.document.builtins || this.document.builtins.length === 0) {
			this.document.builtins = mergeBuiltins(this.customBuiltins);
		}
		debugTrace(`[N3LogicReasoner][TRACE][${traceId}] Using document.builtins:`, (this.document.builtins || []).map((b) => b.uri));
		debugLog(`[N3LogicReasoner][DEBUG][${traceId}] matchAntecedent called with:`, JSON.stringify(patterns), JSON.stringify(data));
		debugLog(`[N3LogicReasoner][DEBUG][${traceId}] Using document.builtins:`, (this.document.builtins || []).map((b) => b.uri));
		const result = matchAntecedent(patterns, data, this.document.builtins, traceId);
		debugTrace(`[N3LogicReasoner][TRACE][${traceId}] matchAntecedent result:`, result);
		debugLog(`[N3LogicReasoner][DEBUG][${traceId}] matchAntecedent result:`, JSON.stringify(result));
		return result;
	}

	/**
	 * Use the modularized instantiateTriple from matcher.ts.
	 */
		instantiateTriple(triple: N3Triple, bindings: Record<string, N3Term>, traceId: string = newTraceId()): N3Triple {
			debugTrace(`[N3LogicReasoner][TRACE][${traceId}] instantiateTriple called:`, { triple, bindings });
			const result = instantiateTriple(triple, bindings);
			debugTrace(`[N3LogicReasoner][TRACE][${traceId}] instantiateTriple result:`, result);
			return result;
		}

		// Example: Add traceId to evaluateBuiltins call in your reasoning loop (pseudo-code, adapt as needed)
		// const traceId = newTraceId();
		// evaluateBuiltins(triples, bindings, this.document, matchAntecedent, instantiateTriple, traceId);

	/**
	 * Load an ontology in N3/N3Logic format.
	 * Builtins include core, modular, and user-registered builtins.
	 */
	loadOntology(data: string, format: string): void {
		debugTrace('[N3LogicReasoner][TRACE] loadOntology called:', { format, data });
		debugLog('[N3LogicReasoner][DEBUG] customBuiltins before loadOntology:', (this.customBuiltins || []).map((b) => b.uri));
		debugLog('Loading ontology', { format, data });
		if (typeof data !== 'string') {
			debugTrace('[N3LogicReasoner][TRACE] loadOntology: data is not a string');
			throw new TypeError('N3LogicReasoner.loadOntology: data must be a string');
		}
		if (typeof format !== 'string') {
			debugTrace('[N3LogicReasoner][TRACE] loadOntology: format is not a string');
			throw new TypeError('N3LogicReasoner.loadOntology: format must be a string');
		}
		if (format !== 'n3' && format !== 'n3logic') {
			debugTrace('[N3LogicReasoner][TRACE] loadOntology: format not supported', format);
			throw new Error('Only N3/N3Logic format supported in N3LogicReasoner');
		}
		this.raw = data;
		try {
			const parser = new N3LogicParser();
			const parsedDoc = parser.parse(data);
			debugTrace('[N3LogicReasoner][TRACE] loadOntology: parsedDoc', parsedDoc);
			debugLog('N3LogicReasoner: Parsed rules after parsing:', JSON.stringify(parsedDoc.rules, null, 2));
			debugLog('[N3LogicReasoner][DEBUG][LOGGING] Parsed triples after parsing:', JSON.stringify(parsedDoc.triples, null, 2));
			if (parsedDoc.rules) {
				for (const [i, rule] of parsedDoc.rules.entries()) {
					debugLog(`N3LogicReasoner: Rule #${i} antecedent triples:`, JSON.stringify(rule.antecedent.triples, null, 2));
					debugLog(`N3LogicReasoner: Rule #${i} consequent triples:`, JSON.stringify(rule.consequent.triples, null, 2));
				}
			}
			// Preserve any custom builtins registered before ontology load
			if (!this.customBuiltins) this.customBuiltins = [];
			this.document = parsedDoc;
			// Always merge in any custom builtins registered before ontology load
			debugTrace('[N3LogicReasoner][TRACE] loadOntology: merging builtins', this.customBuiltins);
			this.document.builtins = mergeBuiltins(this.customBuiltins);
			// Always force document.builtins to be up-to-date
			this.document.builtins = mergeBuiltins(this.customBuiltins);
			debugTrace('[N3LogicReasoner][TRACE] loadOntology: document.builtins after merge', this.document.builtins);
			debugLog('[N3LogicReasoner][DEBUG] document.builtins after loadOntology:', (this.document.builtins || []).map((b) => b.uri));
			debugLog('[N3LogicReasoner][DEBUG][LOGGING] document.builtins after loadOntology:', JSON.stringify(this.document.builtins, null, 2));
			debugLog('Parsed rules:', this.document.rules);
			// Run plugins after ontology load
			for (const plugin of this.plugins) {
				plugin(this);
			}
			this.runHook('afterLoadOntology', this.document);
			debugTrace('[N3LogicReasoner][TRACE] loadOntology finished');
		} catch (err) {
			debugTrace('[N3LogicReasoner][TRACE] loadOntology: error', err);
			debugLog('Failed to parse ontology', err);
			throw new Error(`N3LogicReasoner.loadOntology: Failed to parse ontology: ${err instanceof Error ? err.message : err}`);
		}
	}

	/**
	 * Register a custom builtin (or array of builtins).
	 */
	registerBuiltin(builtin: N3Builtin | N3Builtin[]): void {
		debugTrace('[N3LogicReasoner][TRACE] registerBuiltin called:', builtin);
		debugLog('Reasoner: All triples at start:', JSON.stringify(this.document.triples, null, 2));
		debugLog('Reasoner: All rules at start:', JSON.stringify(this.document.rules, null, 2));
		debugLog('[N3LogicReasoner][DEBUG] Builtins before registerBuiltin:', (this.document.builtins || []).map((b) => b.uri));
		if (Array.isArray(builtin)) {
			this.customBuiltins.push(...builtin);
		} else {
			this.customBuiltins.push(builtin);
		}
		debugTrace('[N3LogicReasoner][TRACE] registerBuiltin: customBuiltins after push', (this.customBuiltins || []).map((b) => b.uri));
		debugLog('[N3LogicReasoner][DEBUG][PATCHED] customBuiltins after push:', (this.customBuiltins || []).map((b) => b.uri));
		// Always update document.builtins so custom builtins are available immediately
		if (this.document) {
			debugTrace('[N3LogicReasoner][TRACE] registerBuiltin: merging builtins', this.customBuiltins);
			this.document.builtins = mergeBuiltins(this.customBuiltins);
			// Always force document.builtins to be up-to-date
			this.document.builtins = mergeBuiltins(this.customBuiltins);
			debugTrace('[N3LogicReasoner][TRACE] registerBuiltin: document.builtins after merge', (this.document.builtins || []).map((b) => b.uri));
			debugLog('[N3LogicReasoner][DEBUG][PATCHED] Builtins after registerBuiltin:', (this.document.builtins || []).map((b) => b.uri));
			debugLog('[N3LogicReasoner][DEBUG][PATCHED] customBuiltins after registerBuiltin:', (this.customBuiltins || []).map((b) => b.uri));
		}
		debugTrace('[N3LogicReasoner][TRACE] registerBuiltin finished');
	}

	/**
	 * Register a plugin (function that receives the reasoner instance).
	 */
	use(plugin: (reasoner: N3LogicReasoner) => void): void {
		debugTrace && debugTrace('[N3LogicReasoner] use(plugin) called');
		this.plugins.push(plugin);
	}

	/**
	 * Register a hook callback for a named event.
	 */
	on(hookName: string, callback: (...args: any[]) => void): void {
		debugTrace && debugTrace('[N3LogicReasoner] on(hookName) called:', hookName, 'callback:', callback && callback.toString());
		if (!this.hookManager) debugTrace && debugTrace('[N3LogicReasoner][HOOKS] hookManager not initialized!');
		this.hookManager.on(hookName, (...args: any[]) => {
			debugTrace && debugTrace('[N3LogicReasoner][HOOKS] Firing hook:', hookName, 'args:', args);
			callback(...args);
		});
	}

	/**
	 * Run all callbacks for a named hook.
	 */
	private runHook(hookName: string, ...args: any[]): void {
		debugTrace && debugTrace('[N3LogicReasoner] runHook called:', hookName, args);
		if (!this.hookManager) debugTrace && debugTrace('[N3LogicReasoner][HOOKS] hookManager not initialized!');
		debugTrace && debugTrace('[N3LogicReasoner][HOOKS] About to fire hook:', hookName, 'args:', args);
		this.hookManager.runHook(hookName, ...args);
		debugTrace && debugTrace('[N3LogicReasoner][HOOKS] Finished firing hook:', hookName);
	}

	/**
	 * Run the reasoning process (forward chaining).
	 * Hooks: beforeReason, afterReason, afterRuleApplied
	 */
	reason(): N3ReasonerResult {
		debugTrace('[N3LogicReasoner][TRACE] reason() called');
		// Log all asserted triples before reasoning
		// sessionDebugLog('[REASONER][START] Asserted triples:', this.document.triples);
		// Provenance: assign unique IDs and provenance info to all triples
		let tripleIdCounter = 0;
		function addProvenance(triple: any, provenance: string) {
			triple._id = ++tripleIdCounter;
			triple._provenance = provenance;
			return triple;
		}
		// Add provenance to asserted triples
		this.document.triples = this.document.triples.map((t) => addProvenance(t, 'asserted'));
		debugLog('[REASONER] Starting reason() method. Current builtins:', (this.document.builtins || []).map((b) => b.uri));
		debugTrace('[N3LogicReasoner][TRACE] reason: merging builtins', this.customBuiltins);
		// Always merge custom builtins into document.builtins before reasoning
	this.document.builtins = mergeBuiltins(this.customBuiltins);
	// Always force document.builtins to be up-to-date
	this.document.builtins = mergeBuiltins(this.customBuiltins);
		debugTrace('[N3LogicReasoner][TRACE] reason: document.builtins after merge', this.document.builtins);
		const mergedBuiltins = this.document.builtins;
		debugLog('[N3LogicReasoner][DEBUG] customBuiltins before reasoning:', (this.customBuiltins || []).map((b) => b.uri));
		debugLog('[N3LogicReasoner][DEBUG] document.builtins before reasoning:', (this.document.builtins || []).map((b) => b.uri));
		debugLog('Merged builtins for reasoning:', this.document.builtins);
		debugLog('Starting reasoning', { triples: this.document.triples, rules: this.document.rules });
		try {
			this.runHook('beforeReason', this.document);
			debugTrace('[N3LogicReasoner][TRACE] reason: after runHook beforeReason');
			const inferred: Set<string> = new Set();
			const working: N3Triple[] = [...this.document.triples];
			debugLog('Initial working triples:', working);
			for (const t of working) {
				const key = tripleToString(t);
				debugLog('Adding initial triple to inferred set:', key, t);
				inferred.add(key);
			}
			let changed = true;
			let iteration = 0;
			while (changed) {
				iteration++;
				debugTrace(`[N3LogicReasoner][TRACE] Reasoning iteration ${iteration} START`);
				debugLog(`\n=== Reasoning iteration ${iteration} START ===`);
				debugLog(`Current triple store at start of iteration ${iteration}:`, JSON.stringify(working, null, 2));
				changed = false;
				const rulesFired: number[] = [];
				const newTriplesThisIter: string[] = [];
				for (const [ruleIdx, rule] of this.document.rules.entries()) {
					const traceId = newTraceId();
					debugTrace(`[N3LogicReasoner][TRACE] Evaluating rule #${ruleIdx}`);
					debugLog(`[N3LogicReasoner][DEBUG] Evaluating rule #${ruleIdx}:`, JSON.stringify(rule));
					let bindingsList: Array<Record<string, N3Term>> = [];
					try {
						debugTrace(`[N3LogicReasoner][TRACE] Matching antecedent for rule #${ruleIdx}`);
						debugLog(`[N3LogicReasoner][DEBUG] Matching antecedent for rule #${ruleIdx}:`, JSON.stringify(rule.antecedent));
											const traceId = newTraceId();
											bindingsList = matchFormula(
											  rule.antecedent,
											  working,
											  (patterns, data, builtins, _traceId) => this.matchAntecedent(patterns, data, traceId),
											  this.document.builtins,
											);
						debugTrace(`[N3LogicReasoner][TRACE] Bindings list from matchFormula for rule #${ruleIdx}:`, bindingsList);
						debugLog(`[N3LogicReasoner][DEBUG] Bindings list from matchFormula for rule #${ruleIdx}:`, JSON.stringify(bindingsList));
					} catch (err) {
						debugTrace('[N3LogicReasoner][TRACE] Failed to match rule antecedent', err, 'Rule:', rule);
						debugLog('[N3LogicReasoner][DEBUG] Failed to match rule antecedent', err, 'Rule:', JSON.stringify(rule));
						throw new Error(`N3LogicReasoner.reason: Failed to match rule antecedent: ${err instanceof Error ? err.message : err}`);
					}
					let ruleFired = false;
					for (const [bindIdx, bindings] of bindingsList.entries()) {
						debugTrace(`[N3LogicReasoner][TRACE] Bindings #${bindIdx} before evaluateBuiltins for rule #${ruleIdx}:`, bindings);
						debugLog(`[N3LogicReasoner][DEBUG] Bindings #${bindIdx} before evaluateBuiltins for rule #${ruleIdx}:`, JSON.stringify(bindings));
						// Always call evaluateBuiltins for all antecedent triples, including custom builtins
						const builtinsResult = evaluateBuiltins(
							rule.antecedent.triples,
							bindings,
							{ ...this.document, builtins: mergedBuiltins },
							(patterns, data, builtins) => this.matchAntecedent(patterns, data, traceId),
							(triple, bindings) => this.instantiateTriple(triple, bindings, traceId),
							traceId
						);
						debugTrace(`[N3LogicReasoner][TRACE] evaluateBuiltins result for rule #${ruleIdx}, bindings #${bindIdx}:`, builtinsResult);
						debugLog(`[N3LogicReasoner][DEBUG] evaluateBuiltins result for rule #${ruleIdx}, bindings #${bindIdx}:`, builtinsResult);
						if (!builtinsResult) {
							debugTrace('[N3LogicReasoner][TRACE] Builtins check failed, skipping to next bindings.');
							debugLog('[N3LogicReasoner][DEBUG] Builtins check failed, skipping to next bindings.');
							continue;
						}
						for (const [consIdx, consTriple] of rule.consequent.triples.entries()) {
							debugTrace(`[N3LogicReasoner][TRACE] Instantiating consequent triple #${consIdx} for rule #${ruleIdx}`);
							debugLog(`[N3LogicReasoner][DEBUG] Instantiating consequent triple #${consIdx} for rule #${ruleIdx}:`, JSON.stringify(consTriple), 'with bindings:', JSON.stringify(bindings));
							let instantiated;
							try {
								instantiated = this.instantiateTriple(consTriple, bindings, traceId);
								debugTrace(`[N3LogicReasoner][TRACE] Instantiated triple for rule #${ruleIdx}, consIdx #${consIdx}:`, instantiated);
								debugLog(`[N3LogicReasoner][DEBUG] Instantiated triple for rule #${ruleIdx}, consIdx #${consIdx}:`, JSON.stringify(instantiated));
							} catch (err) {
								debugTrace('[N3LogicReasoner][TRACE] Failed to instantiate triple', err, consTriple, bindings);
								debugLog('[N3LogicReasoner][DEBUG] Failed to instantiate triple', err, 'Triple:', JSON.stringify(consTriple), 'Bindings:', JSON.stringify(bindings));
								throw new Error(`N3LogicReasoner.reason: Failed to instantiate triple: ${err instanceof Error ? err.message : err}`);
							}
							const key = tripleToString(instantiated);
							debugTrace(`[N3LogicReasoner][TRACE] Checking if triple is already inferred for rule #${ruleIdx}, consIdx #${consIdx}:`, key, instantiated);
							debugLog(`[N3LogicReasoner][DEBUG] Checking if triple is already inferred for rule #${ruleIdx}, consIdx #${consIdx}:`, key, JSON.stringify(instantiated));
							if (!inferred.has(key)) {
								debugTrace(`[N3LogicReasoner][TRACE] Adding new inferred triple for rule #${ruleIdx}, consIdx #${consIdx}:`, instantiated, 'Key:', key);
								debugLog(`[N3LogicReasoner][DEBUG] Adding new inferred triple for rule #${ruleIdx}, consIdx #${consIdx}:`, JSON.stringify(instantiated), 'Key:', key);
								inferred.add(key);
								working.push(instantiated);
								changed = true;
								ruleFired = true;
								newTriplesThisIter.push(key);
								this.runHook('afterRuleApplied', rule, instantiated, bindings);
							} else {
								debugTrace(`[N3LogicReasoner][TRACE] Triple already present, skipping for rule #${ruleIdx}, consIdx #${consIdx}:`, instantiated, 'Key:', key);
								debugLog(`[N3LogicReasoner][DEBUG] Triple already present, skipping for rule #${ruleIdx}, consIdx #${consIdx}:`, JSON.stringify(instantiated), 'Key:', key);
							}
						}
					}
					if (ruleFired) {
						rulesFired.push(ruleIdx);
					}
				}
				debugTrace(`[N3LogicReasoner][TRACE] New triples inferred in iteration ${iteration}:`, newTriplesThisIter);
				debugLog(`[N3LogicReasoner][DEBUG] New triples inferred in iteration ${iteration}:`, newTriplesThisIter);
				debugTrace(`[N3LogicReasoner][TRACE] Rules fired in iteration ${iteration}:`, rulesFired);
				debugLog(`[N3LogicReasoner][DEBUG] Rules fired in iteration ${iteration}:`, rulesFired);
				debugTrace(`[N3LogicReasoner][TRACE] Current triple store at end of iteration ${iteration}:`, working);
				debugLog(`[N3LogicReasoner][DEBUG] Current triple store at end of iteration ${iteration}:`, JSON.stringify(working, null, 2));
				debugTrace(`[N3LogicReasoner][TRACE] === Reasoning iteration ${iteration} END. changed=${changed} ===`);
				debugLog(`[N3LogicReasoner][DEBUG] === Reasoning iteration ${iteration} END. changed=${changed} ===\n`);
			}
			this.runHook('afterReason', working);
			debugTrace('[N3LogicReasoner][TRACE] reason: after runHook afterReason');
			debugLog('Reasoning complete. Inferred triples:', Array.from(inferred));
			// Only include canonical object-form triples, deduplicated by semantic value
			function canonicalTriple(t: any): any {
				// If already object form, return as is
				if (typeof t === 'object' && t && 'subject' in t && 'predicate' in t && 'object' in t) return t;
				// If string form, try to parse (should not happen, but fallback)
				try { return stringToTriple(t); } catch { return t; }
			}
			const assertedTriples = this.document.triples.map(canonicalTriple);
			// Log all asserted triples after canonicalization
			const inferredTriples = Array.from(inferred).map((t) => {
				const triple = stringToTriple(t);
				addProvenance(triple, 'inferred');
				return triple;
			});
			// Deduplicate by subject/predicate/object value
			const tripleKey = (t: any): string => {
				const subj = typeof t.subject === 'object' && 'value' in t.subject ? t.subject.value : t.subject;
				const pred = typeof t.predicate === 'object' && 'value' in t.predicate ? t.predicate.value : t.predicate;
				const obj = typeof t.object === 'object' && 'value' in t.object ? t.object.value : t.object;
				return `${subj}|${pred}|${obj}`;
			};
			const allTriplesMap = new Map();
			for (const t of assertedTriples) {
				allTriplesMap.set(tripleKey(t), t);
			}
			for (const t of inferredTriples) {
				allTriplesMap.set(tripleKey(t), t);
			}
			const allTriples = Array.from(allTriplesMap.values());
			// Modularized filtering with debug
			const filteredTriples = allTriples; // No-op, replace with actual filtering if needed
			// Convert all triples to N3 string format for output
			let allTriplesN3 = filteredTriples.map(tripleToN3);
			// Deduplicate by N3 string
			allTriplesN3 = Array.from(new Set(allTriplesN3));
			debugTrace('[N3LogicReasoner][TRACE] reason: finished, returning result');
			// Always output N3 string triples, never JSON objects
			return {
				message: 'N3Logic reasoning: forward chaining with built-in, quantifier, and formula evaluation',
				triples: allTriplesN3,
				rules: this.document.rules,
				builtins: this.document.builtins,
			};
		} catch (err) {
			debugTrace('[N3LogicReasoner][TRACE] reason: error', err);
			debugLog('Reasoning failed', err);
			throw new Error(`N3LogicReasoner.reason: Reasoning failed: ${err instanceof Error ? err.message : err}`);
		}
	}
}
// (moved to cjs/N3LogicReasoner.cjs.ts)
