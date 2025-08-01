// Builtin evaluation logic for N3LogicReasoner
import { N3Triple, N3Term, N3Builtin } from '../N3LogicTypes';
import { debugLog, debugTrace } from './debug';

export function evaluateBuiltins(
  triples: N3Triple[],
  bindings: Record<string, N3Term>,
  document: any,
  matchAntecedent: (patterns: N3Triple[], data: N3Triple[], builtins: N3Builtin[]) => Array<Record<string, N3Term>>,
  instantiateTriple: (triple: N3Triple, bindings: Record<string, N3Term>) => N3Triple
): boolean {
  debugTrace && debugTrace('[builtinEvaluator] evaluateBuiltins called:', { triples, bindings, builtins: document.builtins });
  debugLog('evaluateBuiltins: triples:', JSON.stringify(triples, null, 2));
  debugLog('evaluateBuiltins: bindings:', JSON.stringify(bindings, null, 2));
  debugLog('evaluateBuiltins called', { triples, bindings, builtins: document.builtins });
  if (!document.builtins) {
    debugLog('No builtins registered, returning true');
    return true;
  }
  for (const triple of triples) {
    debugLog('evaluateBuiltins: checking triple:', JSON.stringify(triple, null, 2));
    if (typeof triple.predicate === 'object' && 'value' in triple.predicate) {
      const predValue = triple.predicate.value;
      const builtin = document.builtins.find((b: N3Builtin) => b.uri === predValue);
      if (builtin) {
        debugLog('evaluateBuiltins: Found builtin in antecedent:', builtin.uri);
        // Get argument(s) from bindings or triple
        let args: N3Term[] = [];
        if (builtin.arity === 1) {
          let arg = triple.subject;
          if (typeof arg === 'object' && 'type' in arg && arg.type === 'Variable' && bindings.hasOwnProperty(arg.value)) {
            arg = bindings[arg.value];
          }
          args = [arg];
        } else if (builtin.arity === 2) {
          let arg1 = triple.subject;
          let arg2 = triple.object;
          if (typeof arg1 === 'object' && 'type' in arg1 && arg1.type === 'Variable' && bindings.hasOwnProperty(arg1.value)) {
            arg1 = bindings[arg1.value];
          }
          if (typeof arg2 === 'object' && 'type' in arg2 && arg2.type === 'Variable' && bindings.hasOwnProperty(arg2.value)) {
            arg2 = bindings[arg2.value];
          }
          args = [arg1, arg2];
        }
        debugLog('evaluateBuiltins: Calling builtin', builtin.uri, 'with args:', args);
        const result = builtin.apply(...args);
        debugLog('evaluateBuiltins: Builtin result:', result);
        if (!result) {
          debugLog('evaluateBuiltins: Builtin returned false, failing builtins check.');
          return false;
        } else {
          debugLog('evaluateBuiltins: Builtin returned true, passing builtins check.');
        }
      }
    }
  }
  debugLog('evaluateBuiltins returning true');
  return true;
}
