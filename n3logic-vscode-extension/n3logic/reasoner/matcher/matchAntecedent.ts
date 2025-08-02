import { N3Triple, N3Term, N3Builtin } from '../../N3LogicTypes';
import { matcherDebug, matcherTrace, logPatternsAndData } from '../matcher/logging';
import { findBuiltinForPredicate, invokeBuiltin } from '../matcher/builtins';
import { isN3IRI } from '../matcher/typeguards';
import { resolveSubjectVals, resolveObjectVals } from '../matcher/patternMatching';
import { matchTriple, termMatch } from '../matcher/tripleMatch';
import { normalizeBindings } from './normalizeBindings';
import { newTraceId } from '../../trace';

export function matchAntecedent(
  patterns: N3Triple[],
  data: N3Triple[],
  builtins: N3Builtin[],
  traceId: string = newTraceId()
): Array<Record<string, N3Term>> {
  if (!patterns || patterns.length === 0) {
    matcherTrace(`[${traceId}] No patterns left, returning [{}]`);
    return [{}];
  }
  matcherTrace(`[${traceId}] matchAntecedent called with patterns:`, JSON.stringify(patterns), 'data:', JSON.stringify(data));
  logPatternsAndData(patterns, data, builtins);
  const results: Array<Record<string, N3Term>> = [];
  for (let i = 0; i < patterns.length; i++) {
    const triple = patterns[i];
    matcherDebug(`[${traceId}] Pattern triple:`, JSON.stringify(triple));
    let predicateUri: string | undefined = undefined;
    if (isN3IRI(triple.predicate) && typeof triple.predicate === 'object' && 'value' in triple.predicate && typeof triple.predicate.value === 'string') {
      predicateUri = String(triple.predicate.value);
    } else if (typeof triple.predicate === 'string') {
      predicateUri = triple.predicate;
    }
    const builtin = findBuiltinForPredicate(predicateUri, builtins);
    if (builtin) {
      matcherDebug(`[${traceId}] Builtin match found:`, builtin.uri, 'Triple:', JSON.stringify(triple));
      const rest = patterns.slice(0, i).concat(patterns.slice(i + 1));
      const restBindingsList = matchAntecedent(rest, data, builtins, traceId);
      for (const restBindings of restBindingsList) {
        const subjRes = resolveSubjectVals(triple, restBindings, data);
        const objectRes = resolveObjectVals(triple, restBindings, data);
        const subjectVals = subjRes.vals;
        const objectVals = objectRes.vals;
        if (builtin.arity === 1) {
          for (const sVal of subjectVals) {
            const mergedBindings = { ...restBindings };
            if (typeof subjRes.varName === 'string') {
              mergedBindings[subjRes.varName] = sVal;
            }
            const args: N3Term[] = [sVal];
            matcherTrace(`[${traceId}] [MATCHER][BUILTIN] Invoking builtin: ${builtin.uri} with args:`, JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
            let result = false;
            try {
              result = invokeBuiltin(builtin, args, mergedBindings);
            } catch (err) {
              matcherTrace(`[${traceId}] [MATCHER][BUILTIN][ERROR] Exception in builtin: ${builtin.uri} args: ${JSON.stringify(args)} err: ${err}`);
            }
            matcherTrace(`[${traceId}] [MATCHER][BUILTIN] Builtin: ${builtin.uri} result:`, result, 'args:', JSON.stringify(args));
            if (result) {
              results.push(normalizeBindings({ ...mergedBindings }));
            }
          }
        } else {
          for (const sVal of subjectVals) {
            for (const oVal of objectVals) {
              const mergedBindings = { ...restBindings };
              if (typeof subjRes.varName === 'string') {
                mergedBindings[subjRes.varName] = sVal;
              }
              if (typeof objectRes.varName === 'string') {
                mergedBindings[objectRes.varName] = oVal;
              }
              const args: N3Term[] = [sVal, oVal];
              matcherTrace(`[${traceId}] [MATCHER][BUILTIN] Invoking builtin: ${builtin.uri} with args:`, JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
              let result = false;
              try {
                result = invokeBuiltin(builtin, args, mergedBindings);
              } catch (err) {
                matcherTrace(`[${traceId}] [MATCHER][BUILTIN][ERROR] Exception in builtin: ${builtin.uri} args: ${JSON.stringify(args)} err: ${err}`);
              }
              matcherTrace(`[${traceId}] [MATCHER][BUILTIN] Builtin: ${builtin.uri} result:`, result, 'args:', JSON.stringify(args));
              if (result) {
                results.push(normalizeBindings({ ...mergedBindings }));
              }
            }
          }
        }
      }
    } else {
      for (const dataTriple of data) {
        const bindings = matchTriple(triple, dataTriple, termMatch, traceId);
        if (bindings) {
          const rest = patterns.slice(0, i).concat(patterns.slice(i + 1));
          const restBindingsList = matchAntecedent(rest, data, builtins, traceId);
          for (const restBindings of restBindingsList) {
            results.push({ ...restBindings, ...bindings });
          }
        }
      }
    }
  }
  matcherDebug(`[${traceId}] matchAntecedent returning results:`, results);
  return results;
}
