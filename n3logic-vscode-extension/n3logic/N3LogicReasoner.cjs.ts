

// N3LogicReasoner.cjs.ts
// CJS version: use global __filename
// Use Node's global __filename directly in CJS

import { N3LogicDocument, N3Triple, N3Builtin, N3Term } from './N3LogicTypes';
import { HookManager } from './reasoner/hooks';
import { debugLog, debugTrace, setDebug } from './reasoner/debug';
import { mergeBuiltins } from './reasoner/builtinsManager';
import { matchAntecedent, instantiateTriple, matchFormula, tripleToN3 } from './reasoner/matcher';
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
	}

	/**
	 * Use the modularized matchAntecedent from matcher.ts with current builtins.
	 */
	matchAntecedent(patterns: N3Triple[], data: N3Triple[]): Array<Record<string, N3Term>> {
		// Always merge builtins (core + custom) for every match
		const mergedBuiltins = mergeBuiltins(this.customBuiltins);
		debugLog('[N3LogicReasoner][DEBUG] matchAntecedent called with:', JSON.stringify(patterns), JSON.stringify(data));
		debugLog('[N3LogicReasoner][DEBUG] Using mergedBuiltins:', (mergedBuiltins || []).map((b) => b.uri));
		const result = matchAntecedent(patterns, data, mergedBuiltins);
		debugLog('[N3LogicReasoner][DEBUG] matchAntecedent result:', JSON.stringify(result));
		return result;
	}

	/**
	 * Use the modularized instantiateTriple from matcher.ts.
	 */
	instantiateTriple(triple: N3Triple, bindings: Record<string, N3Term>): N3Triple {
		return instantiateTriple(triple, bindings);
	}

	/**
	 * Load an ontology in N3/N3Logic format.
	 * Builtins include core, modular, and user-registered builtins.
	 */
	loadOntology(data: string, format: string): void {
		debugLog('[N3LogicReasoner][DEBUG] customBuiltins before loadOntology:', (this.customBuiltins || []).map((b) => b.uri));
		debugTrace && debugTrace('[N3LogicReasoner] loadOntology called:', { format, data });
		debugLog('Loading ontology', { format, data });
		if (typeof data !== 'string') {
			throw new TypeError('N3LogicReasoner.loadOntology: data must be a string');
		}
		if (typeof format !== 'string') {
			throw new TypeError('N3LogicReasoner.loadOntology: format must be a string');
		}
		if (format !== 'n3' && format !== 'n3logic') {
			throw new Error('Only N3/N3Logic format supported in N3LogicReasoner');
		}
		this.raw = data;
		try {
			const parser = new N3LogicParser();
			const parsedDoc = parser.parse(data);
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
			this.document.builtins = mergeBuiltins(this.customBuiltins);
			debugLog('[N3LogicReasoner][DEBUG] document.builtins after loadOntology:', (this.document.builtins || []).map((b) => b.uri));
			debugLog('[N3LogicReasoner][DEBUG][LOGGING] document.builtins after loadOntology:', JSON.stringify(this.document.builtins, null, 2));
			debugLog('Parsed rules:', this.document.rules);
			// Run plugins after ontology load
			for (const plugin of this.plugins) {
				plugin(this);
			}
			this.runHook('afterLoadOntology', this.document);
		} catch (err) {
			debugLog('Failed to parse ontology', err);
			throw new Error(`N3LogicReasoner.loadOntology: Failed to parse ontology: ${err instanceof Error ? err.message : err}`);
		}
	}

	/**
	 * Register a custom builtin (or array of builtins).
	 */
	registerBuiltin(builtin: N3Builtin | N3Builtin[]): void {
		debugTrace && debugTrace('[N3LogicReasoner] registerBuiltin called:', builtin);
		debugLog('Reasoner: All triples at start:', JSON.stringify(this.document.triples, null, 2));
		debugLog('Reasoner: All rules at start:', JSON.stringify(this.document.rules, null, 2));
		debugLog('[N3LogicReasoner][DEBUG] Builtins before registerBuiltin:', (this.document.builtins || []).map((b) => b.uri));
		if (Array.isArray(builtin)) {
			this.customBuiltins.push(...builtin);
		} else {
			this.customBuiltins.push(builtin);
		}
		// Always update document.builtins so custom builtins are available immediately
		if (this.document) {
			this.document.builtins = mergeBuiltins(this.customBuiltins);
			debugLog('[N3LogicReasoner][DEBUG] Builtins after registerBuiltin:', (this.document.builtins || []).map((b) => b.uri));
			debugLog('[N3LogicReasoner][DEBUG] customBuiltins after registerBuiltin:', (this.customBuiltins || []).map((b) => b.uri));
		}
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
		// Log all asserted triples before reasoning
		// sessionDebugLog('[REASONER][START] Asserted triples:', this.document.triples);
		// Provenance: assign unique IDs and provenance info to all triples
		let tripleIdCounter = 0;
		function addProvenance(triple: any, provenance: string) {
			triple._id = ++tripleIdCounter;
			triple._provenance = provenance;
		// sessionDebugLog('[PROVENANCE][ADD]', triple, provenance);
			return triple;
		}
		// Add provenance to asserted triples
		this.document.triples = this.document.triples.map((t) => addProvenance(t, 'asserted'));
		debugLog('[REASONER] Starting reason() method. Current builtins:', (this.document.builtins || []).map((b) => b.uri));
		debugTrace && debugTrace('[N3LogicReasoner] reason() called');
		// Always merge custom builtins into document.builtins before reasoning
		this.document.builtins = mergeBuiltins(this.customBuiltins);
		const mergedBuiltins = this.document.builtins;
		debugLog('[N3LogicReasoner][DEBUG] customBuiltins before reasoning:', (this.customBuiltins || []).map((b) => b.uri));
		debugLog('[N3LogicReasoner][DEBUG] document.builtins before reasoning:', (this.document.builtins || []).map((b) => b.uri));
		debugLog('Merged builtins for reasoning:', this.document.builtins);
		debugLog('Starting reasoning', { triples: this.document.triples, rules: this.document.rules });
		try {
			this.runHook('beforeReason', this.document);
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
				debugLog(`\n=== Reasoning iteration ${iteration} START ===`);
				debugLog(`Current triple store at start of iteration ${iteration}:`, JSON.stringify(working, null, 2));
				changed = false;
				const rulesFired: number[] = [];
				const newTriplesThisIter: string[] = [];
				for (const [ruleIdx, rule] of this.document.rules.entries()) {
					debugLog(`[N3LogicReasoner][DEBUG] Evaluating rule #${ruleIdx}:`, JSON.stringify(rule));
					let bindingsList: Array<Record<string, N3Term>> = [];
					try {
						debugLog(`[N3LogicReasoner][DEBUG] Matching antecedent for rule #${ruleIdx}:`, JSON.stringify(rule.antecedent));
						bindingsList = matchFormula(rule.antecedent, working, this.matchAntecedent.bind(this));
						debugLog(`[N3LogicReasoner][DEBUG] Bindings list from matchFormula for rule #${ruleIdx}:`, JSON.stringify(bindingsList));
					} catch (err) {
						debugLog('[N3LogicReasoner][DEBUG] Failed to match rule antecedent', err, 'Rule:', JSON.stringify(rule));
						throw new Error(`N3LogicReasoner.reason: Failed to match rule antecedent: ${err instanceof Error ? err.message : err}`);
					}
					let ruleFired = false;
					for (const [bindIdx, bindings] of bindingsList.entries()) {
						debugLog(`[N3LogicReasoner][DEBUG] Bindings #${bindIdx} before evaluateBuiltins for rule #${ruleIdx}:`, JSON.stringify(bindings));
						const builtinsResult = evaluateBuiltins(
							rule.antecedent.triples,
							bindings,
							{ ...this.document, builtins: mergedBuiltins },
							this.matchAntecedent.bind(this),
							this.instantiateTriple.bind(this),
						);
						debugLog(`[N3LogicReasoner][DEBUG] evaluateBuiltins result for rule #${ruleIdx}, bindings #${bindIdx}:`, builtinsResult);
						if (!builtinsResult) {
							debugLog('[N3LogicReasoner][DEBUG] Builtins check failed, skipping to next bindings.');
							continue;
						}
						for (const [consIdx, consTriple] of rule.consequent.triples.entries()) {
							debugLog(`[N3LogicReasoner][DEBUG] Instantiating consequent triple #${consIdx} for rule #${ruleIdx}:`, JSON.stringify(consTriple), 'with bindings:', JSON.stringify(bindings));
							let instantiated;
							try {
								instantiated = this.instantiateTriple(consTriple, bindings);
								debugLog(`[N3LogicReasoner][DEBUG] Instantiated triple for rule #${ruleIdx}, consIdx #${consIdx}:`, JSON.stringify(instantiated));
							} catch (err) {
								debugLog('[N3LogicReasoner][DEBUG] Failed to instantiate triple', err, 'Triple:', JSON.stringify(consTriple), 'Bindings:', JSON.stringify(bindings));
								throw new Error(`N3LogicReasoner.reason: Failed to instantiate triple: ${err instanceof Error ? err.message : err}`);
							}
							const key = tripleToString(instantiated);
							debugLog(`[N3LogicReasoner][DEBUG] Checking if triple is already inferred for rule #${ruleIdx}, consIdx #${consIdx}:`, key, JSON.stringify(instantiated));
							if (!inferred.has(key)) {
								debugLog(`[N3LogicReasoner][DEBUG] Adding new inferred triple for rule #${ruleIdx}, consIdx #${consIdx}:`, JSON.stringify(instantiated), 'Key:', key);
								inferred.add(key);
								working.push(instantiated);
								changed = true;
								ruleFired = true;
								newTriplesThisIter.push(key);
								this.runHook('afterRuleApplied', rule, instantiated, bindings);
							} else {
								debugLog(`[N3LogicReasoner][DEBUG] Triple already present, skipping for rule #${ruleIdx}, consIdx #${consIdx}:`, JSON.stringify(instantiated), 'Key:', key);
							}
						}
					}
					if (ruleFired) {
						rulesFired.push(ruleIdx);
					}
				}
				debugLog(`[N3LogicReasoner][DEBUG] New triples inferred in iteration ${iteration}:`, newTriplesThisIter);
				debugLog(`[N3LogicReasoner][DEBUG] Rules fired in iteration ${iteration}:`, rulesFired);
				debugLog(`[N3LogicReasoner][DEBUG] Current triple store at end of iteration ${iteration}:`, JSON.stringify(working, null, 2));
				debugLog(`[N3LogicReasoner][DEBUG] === Reasoning iteration ${iteration} END. changed=${changed} ===\n`);
			}
			this.runHook('afterReason', working);
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
			// sessionDebugLog('[REASONER][ASSERTED][CANONICAL]', assertedTriples);
			const inferredTriples = Array.from(inferred).map((t) => {
				const triple = stringToTriple(t);
				addProvenance(triple, 'inferred');
				return triple;
			});
			// sessionDebugLog('[REASONER][INFERRED][RAW]', Array.from(inferred));
			// sessionDebugLog('[REASONER][INFERRED][CANONICAL]', inferredTriples);
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
			// sessionDebugLog('[REASONER][TRIPLE][ADD][ASSERTED]', t);
			}
			for (const t of inferredTriples) {
				allTriplesMap.set(tripleKey(t), t);
			// sessionDebugLog('[REASONER][TRIPLE][ADD][INFERRED]', t);
			}
			const allTriples = Array.from(allTriplesMap.values());
			// sessionDebugLog('[REASONER][ALL][TRIPLES][PRE-FILTER]', allTriples);
			// Modularized filtering with debug
			// Filtering step placeholder (no filterValidTriples implemented)
			const filteredTriples = allTriples; // No-op, replace with actual filtering if needed
			// sessionDebugLog('[REASONER][ALL][TRIPLES][POST-FILTER]', filteredTriples);
			// Convert all triples to N3 string format for output
			let allTriplesN3 = filteredTriples.map(tripleToN3);
			// Deduplicate by N3 string
			allTriplesN3 = Array.from(new Set(allTriplesN3));
			// sessionDebugLog('[REASONER][ALL][TRIPLES][N3]', allTriplesN3);
			// Always output N3 string triples, never JSON objects
			return {
				message: 'N3Logic reasoning: forward chaining with built-in, quantifier, and formula evaluation',
				triples: allTriplesN3,
				rules: this.document.rules,
				builtins: this.document.builtins,
			};
		} catch (err) {
			debugLog('Reasoning failed', err);
			throw new Error(`N3LogicReasoner.reason: Reasoning failed: ${err instanceof Error ? err.message : err}`);
		}
	}
}
// (moved to cjs/N3LogicReasoner.cjs.ts)
