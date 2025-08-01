// N3LogicReasoner.ts
// N3Logic Reasoner: applies rules and built-ins to perform inference (npm package version)
import { N3LogicDocument, N3Triple, N3Term, N3Builtin } from './N3LogicTypes';
import { N3LogicParser } from './N3LogicParser';

import { MathBuiltins } from './N3LogicMathBuiltins';
import { StringBuiltins } from './N3LogicStringBuiltins';
import { ListBuiltins } from './N3LogicListBuiltins';
import { TimeBuiltins } from './N3LogicTimeBuiltins';
import { LogicBuiltins } from './N3LogicLogicBuiltins';
import { TypeBuiltins } from './N3LogicTypeBuiltins';
import { OtherBuiltins } from './N3LogicOtherBuiltins';


// Extensible N3LogicReasoner with custom builtins and plugin/hook support
export interface N3ReasonerResult {
  message: string;
  triples: N3Triple[];
  rules: any[];
  builtins?: any[];
}

export class N3LogicReasoner {
  private document: N3LogicDocument = { triples: [], rules: [], builtins: [] };
  private raw: string = '';
  private customBuiltins: N3Builtin[] = [];
  private plugins: Array<(reasoner: N3LogicReasoner) => void> = [];
  private hooks: Record<string, Array<(...args: any[]) => void>> = {};

  /**
   * Load an ontology in N3/N3Logic format.
   * Builtins include core, modular, and user-registered builtins.
   */
  loadOntology(data: string, format: string): void {
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
this.document.builtins = [
  ...TypeBuiltins,
  ...OtherBuiltins,
  ...this.customBuiltins
];
      // Run plugins after ontology load
      for (const plugin of this.plugins) {
        plugin(this);
      }
      this.runHook('afterLoadOntology', this.document);
    } catch (err) {
      throw new Error(`N3LogicReasoner.loadOntology: Failed to parse ontology: ${err instanceof Error ? err.message : err}`);
    }
  }

  /**
   * Register a custom builtin (or array of builtins).
   */
  registerBuiltin(builtin: N3Builtin | N3Builtin[]): void {
    if (Array.isArray(builtin)) {
      this.customBuiltins.push(...builtin);
    } else {
      this.customBuiltins.push(builtin);
    }
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
    if (!this.hooks[hookName]) this.hooks[hookName] = [];
    this.hooks[hookName].push(callback);
  }

  /**
   * Run all callbacks for a named hook.
   */
  private runHook(hookName: string, ...args: any[]): void {
    if (this.hooks[hookName]) {
      for (const cb of this.hooks[hookName]) {
        try { cb(...args); } catch (e) { /* ignore hook errors */ }
      }
    }
  }

  /**
   * Run the reasoning process (forward chaining).
   * Hooks: beforeReason, afterReason, afterRuleApplied
   */
  reason(): N3ReasonerResult {
    try {
      this.runHook('beforeReason', this.document);
      let inferred: Set<string> = new Set();
      let working: N3Triple[] = [...this.document.triples];
      for (const t of working) inferred.add(this.tripleToString(t));
      let changed = true;
      while (changed) {
        changed = false;
        for (const rule of this.document.rules) {
          let bindingsList: Array<Record<string, N3Term>> = [];
          try {
            bindingsList = this.matchFormula(rule.antecedent, working);
            console.log('[DEBUG reason] bindingsList from matchFormula:', JSON.stringify(bindingsList));
          } catch (err) {
            throw new Error(`N3LogicReasoner.reason: Failed to match rule antecedent: ${err instanceof Error ? err.message : err}`);
          }
          for (const bindings of bindingsList) {
            console.log('[DEBUG reason] bindings before evaluateBuiltins:', JSON.stringify(bindings));
            if (!this.evaluateBuiltins(rule.antecedent.triples, bindings)) continue;
            for (const consTriple of rule.consequent.triples) {
              console.log('[DEBUG reason] bindings before instantiateTriple:', JSON.stringify(bindings));
              let instantiated;
              try {
                instantiated = this.instantiateTriple(consTriple, bindings);
                console.log('[DEBUG reason] instantiated triple:', JSON.stringify(instantiated));
              } catch (err) {
                throw new Error(`N3LogicReasoner.reason: Failed to instantiate triple: ${err instanceof Error ? err.message : err}`);
              }
              const key = this.tripleToString(instantiated);
              console.log('[DEBUG rule application] instantiated:', instantiated, 'key:', key, 'bindings:', bindings);
              if (!inferred.has(key)) {
                console.log('[DEBUG rule application] Adding new triple:', instantiated);
                inferred.add(key);
                working.push(instantiated);
                changed = true;
                this.runHook('afterRuleApplied', rule, instantiated, bindings);
              } else {
                console.log('[DEBUG rule application] Triple already present:', instantiated);
              }
            }
          }
        }
      }
      this.runHook('afterReason', working);
      return {
        message: 'N3Logic reasoning: forward chaining with built-in, quantifier, and formula evaluation',
        triples: Array.from(inferred).map(this.stringToTriple),
        rules: this.document.rules,
        builtins: this.document.builtins
      };
    } catch (err) {
      throw new Error(`N3LogicReasoner.reason: Reasoning failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  private matchFormula(formula: any, data: N3Triple[]): Array<Record<string, N3Term>> {
    if (!formula) return [{}];
    if (formula.type === 'Formula') {
      return this.matchAntecedent(formula.triples, data);
    } else if (formula.type === 'ForAll') {
      return this.matchFormula(formula.formula, data);
    } else if (formula.type === 'Exists') {
      return this.matchFormula(formula.formula, data);
    }
    return [{}];
  }
 
  private termMatch(pattern: N3Term, value: N3Term, bindings: Record<string, N3Term>): boolean {
    if (typeof pattern === 'object' && 'type' in pattern && pattern.type === 'Variable') {
      const varName = pattern.value;
      if (varName in bindings) {
        return this.termEquals(bindings[varName], value);
      } else {
        bindings[varName] = value;
        return true;
      }
    } else {
      return this.termEquals(pattern, value);
    }
  }
  /**
   * Instantiate a triple by replacing variables with their bindings.
   */
  private instantiateTriple(triple: N3Triple, bindings: Record<string, N3Term>): N3Triple {
    const instantiateTerm = (term: N3Term): N3Term => {
      if (typeof term === 'object' && 'type' in term && term.type === 'Variable') {
        const varName = term.value;
        if (bindings[varName] !== undefined) {
          console.log('[DEBUG instantiateTriple] substituting variable', varName, 'with', bindings[varName]);
          return bindings[varName];
        } else {
          console.warn('[DEBUG instantiateTriple] unbound variable in consequent:', varName);
        }
      }
      return term;
    };
    const result = {
      subject: instantiateTerm(triple.subject),
      predicate: instantiateTerm(triple.predicate),
      object: instantiateTerm(triple.object)
    };
    console.log('[DEBUG instantiateTriple] result:', JSON.stringify(result));
    return result;
  }

  /**
   * Evaluate all builtins in the given triples with the provided bindings.
   * Returns true if all builtins evaluate to true, otherwise false.
   */
  private evaluateBuiltins(triples: N3Triple[], bindings: Record<string, N3Term>): boolean {
    if (!this.document.builtins) return true;
    for (const rule of this.document.rules) {
      const antecedentBindings = this.matchAntecedent(rule.antecedent.triples, this.document.triples);
      console.log('[reason] Final bindings from antecedent match:', antecedentBindings);
      for (const bindings of antecedentBindings) {
        console.log('[reason] Bindings for consequent instantiation:', bindings);
        const instantiatedTriples = Array.isArray(rule.consequent.triples)
          ? rule.consequent.triples.map(triple => this.instantiateTriple(triple, bindings))
          : [];
        console.log('[reason] Inferred triples:', instantiatedTriples);
        // Use a local Set to track inferred triples by string key
        if (typeof (globalThis as any).__n3logic_inferredSet === 'undefined') {
          (globalThis as any).__n3logic_inferredSet = new Set<string>();
        }
        const inferredSet: Set<string> = (globalThis as any).__n3logic_inferredSet;
        for (const instantiated of instantiatedTriples) {
          const key = `${typeof instantiated.subject === 'object' && 'value' in instantiated.subject ? instantiated.subject.value : instantiated.subject} ${typeof instantiated.predicate === 'object' && 'value' in instantiated.predicate ? instantiated.predicate.value : instantiated.predicate} ${typeof instantiated.object === 'object' && 'value' in instantiated.object ? instantiated.object.value : instantiated.object}`;
          console.log(`[DEBUG rule application] instantiated:`, instantiated, 'key:', key, 'bindings:', bindings);
          if (!inferredSet.has(key)) {
            console.log(`[DEBUG rule application] Adding new triple:`, instantiated);
            inferredSet.add(key);
            // Optionally, push to a local array if needed
            // inferred.push(instantiated);
          } else {
            console.log(`[DEBUG rule application] Triple already present:`, instantiated);
          }
        }
      }
    }
    return true;
  }

  private matchTriple(pattern: N3Triple, triple: N3Triple): Record<string, N3Term> | null {
    const bindings: Record<string, N3Term> = {};
    if (!this.termMatch(pattern.subject, triple.subject, bindings)) return null;
    if (!this.termMatch(pattern.predicate, triple.predicate, bindings)) return null;
    if (!this.termMatch(pattern.object, triple.object, bindings)) return null;
    return bindings;
  }

  private termEquals(a: N3Term, b: N3Term): boolean {
    if (typeof a !== typeof b) return false;
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    return a === b;
  }

  private matchAntecedent(patterns: N3Triple[], data: N3Triple[]): Array<Record<string, N3Term>> {
    if (patterns.length === 0) return [{}];
    const [first, ...rest] = patterns;
    const results: Array<Record<string, N3Term>> = [];
      const builtin = this.document.builtins?.find(b =>
        typeof first.predicate === 'object' && 'value' in first.predicate && b.uri === first.predicate.value
      );
    if (builtin) {
      // For builtins, try all possible bindings from rest, filter by builtin
      const restBindingsList = this.matchAntecedent(rest, data);
      for (const restBindings of restBindingsList) {
        // DEBUG: Log restBindings before builtin matching
        console.log('[DEBUG matchAntecedent] restBindings before builtin:', JSON.stringify(restBindings));
        // For each variable in the builtin triple, use the value from restBindings if available, else try all values from data
        let subjectVals: N3Term[] = [];
        let objectVals: N3Term[] = [];
        if (typeof first.subject === 'object' && 'type' in first.subject && first.subject.type === 'Variable') {
          if (restBindings[first.subject.value] !== undefined) {
            subjectVals = [restBindings[first.subject.value]];
          } else {
            // Try all values that appear in the data for this variable
            subjectVals = data.map(t => t.subject);
          }
        } else {
          subjectVals = [first.subject];
        }
        if (typeof first.object === 'object' && 'type' in first.object && first.object.type === 'Variable') {
          if (restBindings[first.object.value] !== undefined) {
            objectVals = [restBindings[first.object.value]];
          } else {
            objectVals = data.map(t => t.object);
          }
        } else {
          objectVals = [first.object];
        }
        // If both subject and object are variables and both are unbound, try all pairs from data
        if (
          typeof first.subject === 'object' && 'type' in first.subject && first.subject.type === 'Variable' && restBindings[first.subject.value] === undefined &&
          typeof first.object === 'object' && 'type' in first.object && first.object.type === 'Variable' && restBindings[first.object.value] === undefined
        ) {
          subjectVals = data.map(t => t.subject);
          objectVals = data.map(t => t.object);
        }
        if (builtin.arity === 1) {
          for (const sVal of subjectVals) {
            let mergedBindings = { ...restBindings };
            if (typeof first.subject === 'object' && 'type' in first.subject && first.subject.type === 'Variable') {
              mergedBindings[first.subject.value] = sVal;
            }
            let args: N3Term[] = [sVal];
            // DEBUG: Log builtin arguments
            console.log('[DEBUG matchAntecedent] builtin:', builtin.uri, 'args:', args, 'mergedBindings:', mergedBindings, 'first:', first);
            const result = builtin.apply(...args);
            // DEBUG: Log builtin result
            console.log('[DEBUG matchAntecedent] result:', result, 'for args:', args, 'bindings:', mergedBindings);
            if (result === true) {
              results.push({ ...mergedBindings });
            }
          }
        } else {
          for (const sVal of subjectVals) {
            for (const oVal of objectVals) {
              let mergedBindings = { ...restBindings };
              if (typeof first.subject === 'object' && 'type' in first.subject && first.subject.type === 'Variable') {
                mergedBindings[first.subject.value] = sVal;
              }
              if (typeof first.object === 'object' && 'type' in first.object && first.object.type === 'Variable') {
                mergedBindings[first.object.value] = oVal;
              }
              let args: N3Term[] = [sVal, oVal];
              // DEBUG: Log builtin arguments
              console.log('[DEBUG matchAntecedent] builtin:', builtin.uri, 'args:', args, 'mergedBindings:', mergedBindings, 'first:', first);
              const result = builtin.apply(...args);
              // DEBUG: Log builtin result
              console.log('[DEBUG matchAntecedent] result:', result, 'for args:', args, 'bindings:', mergedBindings);
              if (result === true) {
                results.push({ ...mergedBindings });
              }
            }
          }
        }
      }
    } else {
      for (const triple of data) {
        const bindings = this.matchTriple(first, triple);
        if (bindings) {
          const restBindingsList = this.matchAntecedent(rest, data);
          for (const restBindings of restBindingsList) {
            let compatible = true;
            for (const k in bindings) {
              if (k in restBindings && !this.termEquals(bindings[k], restBindings[k])) {
                compatible = false;
                break;
              }
            }
            if (compatible) {
              results.push({ ...restBindings, ...bindings });
            }
          }
        }
      }
    }
    return results;
  }

  private tripleToString(triple: N3Triple): string {
    return `${this.termToString(triple.subject)} ${this.termToString(triple.predicate)} ${this.termToString(triple.object)}`;
  }

  private stringToTriple = (str: string): N3Triple => {
    // Use the parser's parseTerm to restore correct N3Term types
    const parser = new N3LogicParser();
    const [s, p, o] = str.split(' ');
    return {
      subject: parser['parseTerm'](s),
      predicate: parser['parseTerm'](p),
      object: parser['parseTerm'](o)
    };
  };

  private termToString(term: N3Term): string {
    if (typeof term === 'string') return term;
    if ('value' in term) return term.value;
      return '';
    }
  
  }

