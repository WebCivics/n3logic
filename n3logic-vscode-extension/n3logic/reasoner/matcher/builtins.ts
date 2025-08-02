// matcher/builtins.ts - Builtin lookup and invocation helpers
import { N3Builtin, N3Term } from '../../N3LogicTypes';
import { matcherDebug, matcherWarn, matcherError, matcherTrace } from './logging';

export function findBuiltinForPredicate(predicateUri: string | undefined, builtins: N3Builtin[]): N3Builtin | undefined {
  matcherDebug('findBuiltinForPredicate called with:', predicateUri);
  if (!predicateUri || !Array.isArray(builtins)) {
    matcherWarn('No predicateUri or builtins array provided to findBuiltinForPredicate');
    return undefined;
  }
  for (const b of builtins) {
    matcherDebug('Checking builtin candidate:', b.uri, 'against predicateUri:', predicateUri);
    if (b.uri === predicateUri) {
      matcherDebug('Builtin match found:', b.uri);
      return b;
    }
  }
  matcherWarn('No builtin found for predicateUri:', predicateUri, 'Builtins available:', builtins.map((b) => b.uri));
  return undefined;
}

export function invokeBuiltin(builtin: N3Builtin, args: N3Term[], mergedBindings: Record<string, N3Term>): boolean {
  matcherDebug('invokeBuiltin called with:', builtin.uri, 'args:', JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
  try {
    if (typeof (global as any).debugLog === 'function') {
      (global as any).debugLog('[MATCHER][TRACE][EXTRA] About to call builtin.apply:', builtin.uri, 'args:', args, 'bindings:', mergedBindings);
    }
    matcherDebug('[MATCHER][TRACE][LITERAL][EXTRA] Calling builtin.apply:', builtin.uri, 'args:', JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
    const result = builtin.apply(...args);
    matcherDebug('invokeBuiltin result:', result, 'for args:', JSON.stringify(args));
    if (typeof (global as any).debugLog === 'function') {
      (global as any).debugLog('[MATCHER][TRACE][EXTRA] Builtin result:', result);
    }
    return result === true;
  } catch (e) {
    matcherError('Exception in invokeBuiltin:', e, 'args:', JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
    matcherTrace('[MATCHER][TRACE][ERROR] Exception in invokeBuiltin:', e, 'args:', args, 'bindings:', mergedBindings);
    if (typeof (global as any).debugLog === 'function') {
      (global as any).debugLog('[MATCHER][TRACE][EXTRA] Exception in invokeBuiltin:', e, 'args:', args, 'bindings:', mergedBindings);
    }
    return false;
  }
}
