// Builtin evaluation logic for N3LogicReasoner
import { N3Triple, N3Term, N3Builtin } from '../N3LogicTypes';
import { debugLog, debugTrace } from './debug';

export function evaluateBuiltins(
  triples: N3Triple[],
  bindings: Record<string, N3Term>,
  document: any,
  matchAntecedent: (patterns: N3Triple[], data: N3Triple[], builtins: N3Builtin[], traceId?: string) => Array<Record<string, N3Term>>,
  instantiateTriple: (triple: N3Triple, bindings: Record<string, N3Term>) => N3Triple,
  traceId?: string
): boolean {
  debugTrace && debugTrace(`[builtinEvaluator][TRACE][${traceId}] evaluateBuiltins called:`, { triples, bindings, builtins: document.builtins });
  debugLog('evaluateBuiltins: triples:', JSON.stringify(triples, null, 2));
  debugLog('evaluateBuiltins: bindings:', JSON.stringify(bindings, null, 2));
  debugLog('evaluateBuiltins called', { triples, bindings, builtins: document.builtins });
  debugLog('[EVALBUILTINS][CUSTOM] Builtins full array:', JSON.stringify(document.builtins, null, 2));
  for (const triple of triples) {
    debugLog('[EVALBUILTINS][CUSTOM] Triple:', JSON.stringify(triple, null, 2));
    if (typeof (global as any).debugLog === 'function') {
      (global as any).debugLog('[EVALBUILTINS][TRACE][EXTRA] Triple:', JSON.stringify(triple, null, 2));
    }
    if (!document.builtins) {
      debugTrace && debugTrace('[builtinEvaluator][TRACE] No builtins registered, returning true');
      debugLog('No builtins registered, returning true');
      return true;
    }
  debugTrace && debugTrace(`[builtinEvaluator][TRACE][${traceId}] Checking triple:`, triple);
    debugLog('evaluateBuiltins: checking triple:', JSON.stringify(triple, null, 2));
    // Check if this triple's predicate matches any builtin
    let predValue = null;
    if (typeof triple.predicate === 'object' && 'value' in triple.predicate) {
      predValue = triple.predicate.value;
    }
    if (predValue) {
      // Try to find a builtin for this predicate
      const builtin = document.builtins.find((b: N3Builtin) => b.uri === predValue);
  debugTrace && debugTrace(`[builtinEvaluator][TRACE][${traceId}] Checking builtin for predicate:`, predValue, 'Found:', !!builtin, 'Function:', builtin && builtin.apply, 'Typeof:', builtin && typeof builtin.apply);
      debugLog('[EVALBUILTINS][CUSTOM] Checking builtin for predicate:', predValue, 'Found:', !!builtin);
      if (typeof (global as any).debugLog === 'function') {
        (global as any).debugLog('[EVALBUILTINS][TRACE][EXTRA] Checking builtin for predicate:', predValue, 'Found:', !!builtin);
      }
      if (builtin) {
    debugTrace && debugTrace(`[builtinEvaluator][TRACE][${traceId}] Found builtin in antecedent:`, builtin.uri);
        debugLog('evaluateBuiltins: Found builtin in antecedent:', builtin.uri);
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog('[EVALBUILTINS][TRACE][EXTRA] Found builtin in antecedent:', builtin.uri);
        }
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
  debugTrace && debugTrace(`[builtinEvaluator][TRACE][${traceId}] About to invoke builtin.apply:`, builtin.uri, 'args:', args, 'function:', builtin.apply, 'typeof:', typeof builtin.apply);
        debugLog('evaluateBuiltins: Calling builtin', builtin.uri, 'with args:', args, 'builtin.apply:', builtin.apply, 'typeof:', typeof builtin.apply);
        debugLog('[EVALBUILTINS][CUSTOM][EXTRA] About to call builtin.apply:', builtin.uri, 'args:', JSON.stringify(args), 'bindings:', JSON.stringify(bindings));
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog('[EVALBUILTINS][TRACE][EXTRA] About to call builtin.apply:', builtin.uri, 'args:', args, 'bindings:', bindings);
        }
        let result = false;
        try {
          debugLog('[EVALBUILTINS][CUSTOM][TRACE] About to call builtin:', builtin.uri, 'args:', JSON.stringify(args), 'bindings:', JSON.stringify(bindings));
          if (builtin.uri === 'http://example.org/custom#isFoo') {
            debugLog('[EVALBUILTINS][CUSTOM][TEST] Custom isFoo builtin called with args:', JSON.stringify(args));
          }
          result = builtin.apply(...args);
          debugLog('[EVALBUILTINS][CUSTOM][EXTRA] Builtin.apply result:', result, 'for args:', JSON.stringify(args));
          if (builtin.uri === 'http://example.org/custom#isFoo') {
            debugLog('[EVALBUILTINS][CUSTOM][TEST] Custom isFoo builtin result:', result, 'for args:', JSON.stringify(args));
          }
        } catch (err) {
          debugLog('[EVALBUILTINS][ERROR] Exception in builtin.apply:', err);
          if (typeof (global as any).debugLog === 'function') {
            (global as any).debugLog('[EVALBUILTINS][ERROR] Exception in builtin.apply:', err);
          }
          return false;
        }
  debugTrace && debugTrace(`[builtinEvaluator][TRACE][${traceId}] Builtin result:`, { builtin: builtin.uri, result });
        debugLog('evaluateBuiltins: Builtin result:', result);
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog('[EVALBUILTINS][TRACE][EXTRA] Builtin result:', result);
        }
        if (!result) {
          debugTrace && debugTrace(`[builtinEvaluator][TRACE][${traceId}] Builtin returned false, failing builtins check.`);
          debugLog('evaluateBuiltins: Builtin returned false, failing builtins check.');
          if (typeof (global as any).debugLog === 'function') {
            (global as any).debugLog('[EVALBUILTINS][TRACE][EXTRA] Builtin returned false, failing builtins check.');
          }
          return false;
        } else {
          debugTrace && debugTrace(`[builtinEvaluator][TRACE][${traceId}] Builtin returned true, passing builtins check.`);
          debugLog('evaluateBuiltins: Builtin returned true, passing builtins check.');
          if (typeof (global as any).debugLog === 'function') {
            (global as any).debugLog('[EVALBUILTINS][TRACE][EXTRA] Builtin returned true, passing builtins check.');
          }
        }
      } else {
        debugLog('[EVALBUILTINS][CUSTOM] No builtin found for predicate:', predValue);
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog('[EVALBUILTINS][TRACE][EXTRA] No builtin found for predicate:', predValue);
        }
      }
    } else {
      debugLog('[EVALBUILTINS][CUSTOM] Triple predicate is not an object with value:', triple.predicate);
      if (typeof (global as any).debugLog === 'function') {
        (global as any).debugLog('[EVALBUILTINS][TRACE][EXTRA] Triple predicate is not an object with value:', triple.predicate);
      }
    }
  }
  debugTrace && debugTrace(`[builtinEvaluator][TRACE][${traceId}] evaluateBuiltins returning true`);
  debugLog('evaluateBuiltins returning true');
  return true;
}
