// Builtin evaluation logic for N3LogicReasoner
import { N3Triple, N3Term, N3Builtin } from '../N3LogicTypes';
import { debugLog } from './debug';

export function evaluateBuiltins(
  triples: N3Triple[],
  bindings: Record<string, N3Term>,
  document: any,
  matchAntecedent: (patterns: N3Triple[], data: N3Triple[], builtins: N3Builtin[]) => Array<Record<string, N3Term>>,
  instantiateTriple: (triple: N3Triple, bindings: Record<string, N3Term>) => N3Triple
): boolean {
  debugLog('evaluateBuiltins called', { triples, bindings, builtins: document.builtins });
  if (!document.builtins) {
    debugLog('No builtins registered, returning true');
    return true;
  }
  for (const [ruleIdx, rule] of document.rules.entries()) {
    debugLog(`Evaluating builtins for rule #${ruleIdx}:`, rule);
    const antecedentBindings = matchAntecedent(rule.antecedent.triples, document.triples, document.builtins);
    debugLog('Antecedent bindings for builtins:', antecedentBindings);
    for (const [bindIdx, bindings2] of antecedentBindings.entries()) {
      debugLog(`Bindings #${bindIdx} for consequent instantiation:`, bindings2);
      const instantiatedTriples = Array.isArray(rule.consequent.triples)
        ? rule.consequent.triples.map((triple: N3Triple) => instantiateTriple(triple, bindings2))
        : [];
      debugLog('Inferred triples from builtins:', instantiatedTriples);
      const inferredSet: Set<string> = new Set();
      for (const instantiated of instantiatedTriples) {
        const key = `${typeof instantiated.subject === 'object' && 'value' in instantiated.subject ? instantiated.subject.value : instantiated.subject} ${typeof instantiated.predicate === 'object' && 'value' in instantiated.predicate ? instantiated.predicate.value : instantiated.predicate} ${typeof instantiated.object === 'object' && 'value' in instantiated.object ? instantiated.object.value : instantiated.object}`;
        debugLog('Builtin rule application: instantiated:', instantiated, 'key:', key, 'bindings:', bindings2);
        if (!inferredSet.has(key)) {
          debugLog('Builtin: Adding new triple:', instantiated);
          inferredSet.add(key);
        } else {
          debugLog('Builtin: Triple already present:', instantiated);
        }
      }
    }
  }
  debugLog('evaluateBuiltins returning true');
  return true;
}
