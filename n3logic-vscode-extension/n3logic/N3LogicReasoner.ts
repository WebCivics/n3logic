import { debugLog, setDebug } from './reasoner/debug';
import { tripleToString, stringToTriple, termToString, termEquals } from './reasoner/tripleUtils';
import { matchFormula, matchTriple, termMatch, matchAntecedent, instantiateTriple } from './reasoner/matcher';
import { HookManager } from './reasoner/hooks';
import { mergeBuiltins } from './reasoner/builtinsManager';
import { evaluateBuiltins } from './reasoner/builtinEvaluator';
// N3LogicReasoner.ts
// N3Logic Reasoner: applies rules and built-ins to perform inference (npm package version)
import { N3LogicDocument, N3Triple, N3Term, N3Builtin } from './N3LogicTypes';
import { N3LogicParser } from './N3LogicParser';

import { MathBuiltins } from './builtins/N3LogicMathBuiltins';
import { StringBuiltins } from './builtins/N3LogicStringBuiltins';
import { ListBuiltins } from './builtins/N3LogicListBuiltins';
import { TimeBuiltins } from './builtins/N3LogicTimeBuiltins';
import { LogicBuiltins } from './builtins/N3LogicLogicBuiltins';
import { TypeBuiltins } from './builtins/N3LogicTypeBuiltins';
import { OtherBuiltins } from './builtins/N3LogicOtherBuiltins';


// Extensible N3LogicReasoner with custom builtins and plugin/hook support
export interface N3ReasonerResult {
  message: string;
  triples: N3Triple[];
  rules: any[];
  builtins?: any[];
}

export class N3LogicReasoner {
  /**
   * Enable or disable debug logging for this reasoner instance.
   */
  setDebug(debug: boolean) {
    setDebug(debug);
  }
  private document: N3LogicDocument = { triples: [], rules: [], builtins: [] };
  private raw: string = '';
  private customBuiltins: N3Builtin[] = [];
  private plugins: Array<(reasoner: N3LogicReasoner) => void> = [];
  private hookManager = new HookManager();

  /**
   * Load an ontology in N3/N3Logic format.
   * Builtins include core, modular, and user-registered builtins.
   */
  loadOntology(data: string, format: string): void {
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
      this.document = parser.parse(data);
      debugLog('N3LogicReasoner: Parsed rules after parsing:', JSON.stringify(this.document.rules, null, 2));
      if (this.document.rules) {
        for (const [i, rule] of this.document.rules.entries()) {
          debugLog(`N3LogicReasoner: Rule #${i} antecedent triples:`, JSON.stringify(rule.antecedent.triples, null, 2));
          debugLog(`N3LogicReasoner: Rule #${i} consequent triples:`, JSON.stringify(rule.consequent.triples, null, 2));
        }
      }
      this.document.builtins = [
        ...TypeBuiltins,
        ...OtherBuiltins,
        ...this.customBuiltins
      ];
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
    debugLog('Reasoner: All triples at start:', JSON.stringify(this.document.triples, null, 2));
    debugLog('Reasoner: All rules at start:', JSON.stringify(this.document.rules, null, 2));
    if (Array.isArray(builtin)) {
      this.customBuiltins.push(...builtin);
    } else {
      this.customBuiltins.push(builtin);
    }
    // Always update document.builtins so custom builtins are available immediately
    // Merge core builtins and custom builtins
    this.document.builtins = [
      ...TypeBuiltins,
      ...OtherBuiltins,
      ...this.customBuiltins
    ];
  }

  /**
   * Register a plugin (function that receives the reasoner instance).
   */
  use(plugin: (reasoner: N3LogicReasoner) => void): void {
    this.plugins.push(plugin);
  }

  /**
   * Register a hook callback for a named event.
   */
  on(hookName: string, callback: (...args: any[]) => void): void {
  this.hookManager.on(hookName, callback);
  }

  /**
   * Run all callbacks for a named hook.
   */
  private runHook(hookName: string, ...args: any[]): void {
  this.hookManager.runHook(hookName, ...args);
  }


  /**
   * Run the reasoning process (forward chaining).
   * Hooks: beforeReason, afterReason, afterRuleApplied
   */
  reason(): N3ReasonerResult {
    // Always merge custom builtins into document.builtins before reasoning
  // Always merge custom builtins into document.builtins before reasoning

  this.document.builtins = mergeBuiltins(this.customBuiltins);
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
          debugLog(`Evaluating rule #${ruleIdx}:`, rule);
          let bindingsList: Array<Record<string, N3Term>> = [];
          try {
            bindingsList = matchFormula(rule.antecedent, working, this.matchAntecedent.bind(this));
            debugLog('Bindings list from matchFormula:', bindingsList, 'for rule:', rule);
          } catch (err) {
            debugLog('Failed to match rule antecedent', err, 'Rule:', rule);
            throw new Error(`N3LogicReasoner.reason: Failed to match rule antecedent: ${err instanceof Error ? err.message : err}`);
          }
          let ruleFired = false;
          for (const [bindIdx, bindings] of bindingsList.entries()) {
            debugLog(`Bindings #${bindIdx} before evaluateBuiltins:`, bindings, 'Rule:', rule);
            const builtinsResult = evaluateBuiltins(
              rule.antecedent.triples,
              bindings,
              this.document,
              matchAntecedent,
              instantiateTriple
            );
            debugLog('evaluateBuiltins result:', builtinsResult, 'Bindings:', bindings);
            if (!builtinsResult) {
              debugLog('Builtins check failed, skipping to next bindings.');
              continue;
            }
            for (const [consIdx, consTriple] of rule.consequent.triples.entries()) {
              debugLog(`Instantiating consequent triple #${consIdx}:`, consTriple, 'with bindings:', bindings);
              let instantiated;
              try {
                instantiated = this.instantiateTriple(consTriple, bindings);
                debugLog('Instantiated triple:', instantiated, 'from:', consTriple, 'with bindings:', bindings);
              } catch (err) {
                debugLog('Failed to instantiate triple', err, 'Triple:', consTriple, 'Bindings:', bindings);
                throw new Error(`N3LogicReasoner.reason: Failed to instantiate triple: ${err instanceof Error ? err.message : err}`);
              }
              const key = tripleToString(instantiated);
              debugLog('Checking if triple is already inferred:', key, instantiated);
              if (!inferred.has(key)) {
                debugLog('Adding new inferred triple:', instantiated, 'Key:', key);
                inferred.add(key);
                working.push(instantiated);
                changed = true;
                ruleFired = true;
                newTriplesThisIter.push(key);
                this.runHook('afterRuleApplied', rule, instantiated, bindings);
              } else {
                debugLog('Triple already present, skipping:', instantiated, 'Key:', key);
              }
            }
          }
          if (ruleFired) {
            rulesFired.push(ruleIdx);
          }
        }
        debugLog(`New triples inferred in iteration ${iteration}:`, newTriplesThisIter);
        debugLog(`Rules fired in iteration ${iteration}:`, rulesFired);
        debugLog(`Current triple store at end of iteration ${iteration}:`, JSON.stringify(working, null, 2));
        debugLog(`=== Reasoning iteration ${iteration} END. changed=${changed} ===\n`);
      }
      this.runHook('afterReason', working);
      debugLog('Reasoning complete. Inferred triples:', Array.from(inferred));
      return {
        message: 'N3Logic reasoning: forward chaining with built-in, quantifier, and formula evaluation',
  triples: Array.from(inferred).map(stringToTriple),
        rules: this.document.rules,
        builtins: this.document.builtins
      };
    } catch (err) {
      debugLog('Reasoning failed', err);
      throw new Error(`N3LogicReasoner.reason: Reasoning failed: ${err instanceof Error ? err.message : err}`);
    }
  }


  // Use modularized matcher functions
  matchAntecedent(patterns: N3Triple[], data: N3Triple[]): Array<Record<string, N3Term>> {
    // Use the modularized matchAntecedent from matcher.ts
    // Pass in the builtins from the current document
    // This is needed for builtinEvaluator and reasoner logic
    const { builtins } = this.document;
    // @ts-ignore
    return require('./reasoner/matcher').matchAntecedent(patterns, data, builtins);
  }

  instantiateTriple(triple: N3Triple, bindings: Record<string, N3Term>): N3Triple {
    // Use the modularized instantiateTriple from matcher.ts
    // @ts-ignore
    return require('./reasoner/matcher').instantiateTriple(triple, bindings);
  }
}
