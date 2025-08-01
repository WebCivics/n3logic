
// Matcher logic for N3LogicReasoner
import { N3Triple, N3Term, N3Builtin } from '../N3LogicTypes';
import { debugLog, debugTrace, debugWarn, debugError } from './debug';
function assert(condition: boolean, ...msg: any[]) {
  if (!condition) {
    debugError('Assertion failed:', ...msg);
    throw new Error('Assertion failed: ' + msg.map(String).join(' '));
  }
}
import { termEquals } from './tripleUtils';

export function matchFormula(formula: any, data: N3Triple[], matchAntecedent: any): Array<Record<string, N3Term>> {
  debugTrace('matchFormula called', { formula, data });
  if (!formula) {
  debugTrace('No formula provided, returning [{}]');
    return [{}];
  }
  if (formula.type === 'Formula') {
  debugTrace('Formula type is Formula, matching antecedent:', formula.triples);
    return matchAntecedent(formula.triples, data);
  } else if (formula.type === 'ForAll') {
  debugTrace('Formula type is ForAll, recursing into formula:', formula.formula);
    return matchFormula(formula.formula, data, matchAntecedent);
  } else if (formula.type === 'Exists') {
  debugTrace('Formula type is Exists, recursing into formula:', formula.formula);
    return matchFormula(formula.formula, data, matchAntecedent);
  }
  debugWarn('Unknown formula type, returning [{}]', formula);
  return [{}];
}

export function matchTriple(pattern: N3Triple, triple: N3Triple, termMatch: any): Record<string, N3Term> | null {
  debugTrace('matchTriple called', { pattern, triple });
  const bindings: Record<string, N3Term> = {};
  assert(!!pattern && !!triple, 'matchTriple expects pattern and triple');
  if (!termMatch(pattern.subject, triple.subject, bindings)) {
    debugTrace('matchTriple: subject did not match', pattern.subject, triple.subject);
    return null;
  }
  if (!termMatch(pattern.predicate, triple.predicate, bindings)) {
    debugTrace('matchTriple: predicate did not match', pattern.predicate, triple.predicate);
    return null;
  }
  if (!termMatch(pattern.object, triple.object, bindings)) {
    debugTrace('matchTriple: object did not match', pattern.object, triple.object);
    return null;
  }
  debugTrace('matchTriple succeeded, bindings:', bindings);
  return bindings;
}

export function termMatch(pattern: N3Term, value: N3Term, bindings: Record<string, N3Term>): boolean {
  debugTrace('termMatch called', { pattern, value, bindings });
  if (typeof pattern === 'object' && pattern && 'type' in pattern && pattern.type === 'Variable') {
    const varName = pattern.value;
    debugTrace('Pattern is variable:', varName);
    if (varName in bindings) {
      debugTrace('Variable already bound:', varName, 'Checking equality with value:', value);
      return termEquals(bindings[varName], value);
    } else {
      debugTrace('Binding variable:', varName, 'to value:', value);
      bindings[varName] = value;
      return true;
    }
  } else {
    debugTrace('Pattern is not variable, checking term equality');
    return termEquals(pattern, value);
  }
}

export function matchAntecedent(patterns: N3Triple[], data: N3Triple[], builtins: N3Builtin[]): Array<Record<string, N3Term>> {
  debugLog('[MATCHER][DEBUG] matchAntecedent called with patterns:', JSON.stringify(patterns, null, 2), 'data:', JSON.stringify(data, null, 2), 'builtins:', builtins ? builtins.map(b => b.uri) : builtins);
  debugTrace('matchAntecedent: patterns:', JSON.stringify(patterns, null, 2));
  debugTrace('matchAntecedent: data:', JSON.stringify(data, null, 2));
  debugTrace('matchAntecedent: builtins:', JSON.stringify(builtins, null, 2));
  debugTrace('matchAntecedent: builtin URIs:', Array.isArray(builtins) ? builtins.map(b => b.uri) : builtins);
  debugTrace('matchAntecedent called', { patterns, data });
  if (patterns.length === 0) {
    debugTrace('No patterns left, returning [{}]');
    return [{}];
  }
  // New logic: try all permutations of builtin triple position in the antecedent
  if (patterns.length === 0) {
    debugTrace('No patterns left, returning [{}]');
    return [{}];
  }
  let results: Array<Record<string, N3Term>> = [];
  // Try each triple as the builtin, recursively match the rest
  for (let i = 0; i < patterns.length; i++) {
  const triple = patterns[i];
  debugLog('[MATCHER][DEBUG] Checking pattern triple #', i, ':', JSON.stringify(triple));
    let builtin = undefined;
    if (builtins && typeof triple.predicate === 'object' && triple.predicate && 'value' in triple.predicate) {
  debugLog('[MATCHER][DEBUG] Predicate type:', triple.predicate.type, 'Predicate value:', triple.predicate.value);
      const predValue = triple.predicate.value;
      debugLog('[BUILTIN MATCH][TRACE] Checking triple for builtin match:', JSON.stringify(triple), 'Predicate URI:', predValue);
      debugLog('[BUILTIN MATCH][TRACE] Registered builtins:', builtins.map(b => b.uri));
      builtin = builtins.find(b => b.uri === predValue);
      if (builtin) {
  debugLog('[MATCHER][DEBUG] Builtin found for triple:', JSON.stringify(triple), 'Builtin URI:', builtin.uri);
        debugLog('[BUILTIN MATCH][TRACE] Found builtin for predicate:', predValue, builtin);
      } else {
        debugLog('[BUILTIN MATCH][TRACE] No builtin found for predicate:', predValue);
      }
    }
    if (builtin) {
      // Recursively match the rest of the patterns (excluding this one)
      const rest = patterns.slice(0, i).concat(patterns.slice(i + 1));
      const restBindingsList = matchAntecedent(rest, data, builtins);
      debugLog('Rest bindings list for builtin:', restBindingsList);
      for (const [restIdx, restBindings] of restBindingsList.entries()) {
        debugLog('matchAntecedent: restBindings:', JSON.stringify(restBindings, null, 2));
        debugLog(`Rest bindings #${restIdx}:`, restBindings);
        // For builtins, always try all possible values for unbound variables (fix: do not skip if not bound)
        let subjectVals: N3Term[] = [];
        let objectVals: N3Term[] = [];
        if (typeof triple.subject === 'object' && 'type' in triple.subject && triple.subject.type === 'Variable') {
          if (restBindings.hasOwnProperty(triple.subject.value)) {
            subjectVals = [restBindings[triple.subject.value]];
            debugLog('Subject is variable, using bound value:', subjectVals);
          } else {
            subjectVals = Object.values(restBindings);
            if (subjectVals.length === 0) subjectVals = data.map(t => t.subject);
            debugLog('Subject variable', triple.subject.value, 'not bound, trying all possible values:', subjectVals);
          }
        } else {
          subjectVals = [triple.subject];
        }
        if (typeof triple.object === 'object' && 'type' in triple.object && triple.object.type === 'Variable') {
          if (restBindings.hasOwnProperty(triple.object.value)) {
            objectVals = [restBindings[triple.object.value]];
            debugLog('Object is variable, using bound value:', objectVals);
          } else {
            objectVals = Object.values(restBindings);
            if (objectVals.length === 0) objectVals = data.map(t => t.object);
            debugLog('Object variable', triple.object.value, 'not bound, trying all possible values:', objectVals);
          }
        } else {
          objectVals = [triple.object];
        }
        if (builtin.arity === 1) {
          debugLog('[MATCHER][DEBUG] Trying builtin (arity 1) with subjectVals:', JSON.stringify(subjectVals), 'objectVals:', JSON.stringify(objectVals), 'restBindings:', JSON.stringify(restBindings));
          for (const sVal of subjectVals) {
            if (typeof triple.subject === 'object' && 'type' in triple.subject && triple.subject.type === 'Variable') {
              debugLog('[MATCHER][DEBUG] Binding subject variable', triple.subject.value, 'to', JSON.stringify(sVal));
            }
            debugLog('[BUILTIN ARGS][TRACE] Trying builtin (arity 1) with sVal:', JSON.stringify(sVal), 'restBindings:', JSON.stringify(restBindings), 'triple:', JSON.stringify(triple));
            let mergedBindings = { ...restBindings };
            if (typeof triple.subject === 'object' && 'type' in triple.subject && triple.subject.type === 'Variable') {
              debugLog('[BUILTIN ARGS][TRACE] Binding variable', triple.subject.value, 'to', sVal);
              mergedBindings[triple.subject.value] = sVal;
            }
            let args: N3Term[] = [sVal];
            debugLog('[MATCHER][DEBUG] Builtin (arity 1) args:', JSON.stringify(args));
            debugLog('[BUILTIN ARGS][TRACE] Applying builtin (arity 1):', builtin.uri, 'args:', JSON.stringify(args), 'mergedBindings:', JSON.stringify(mergedBindings), 'triple:', JSON.stringify(triple));
            try {
            debugLog('[MATCHER][DEBUG] Invoking builtin.apply (arity 1) with args:', JSON.stringify(args));
              const result = builtin.apply(...args);
              debugLog('[BUILTIN ARGS][TRACE] Builtin result:', result, 'for args:', JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
              if (result === true) {
                debugLog('[BUILTIN ARGS][TRACE] Builtin returned true, pushing bindings:', JSON.stringify(mergedBindings));
                results.push({ ...mergedBindings });
              } else {
                debugLog('[BUILTIN ARGS][TRACE] Builtin returned false, skipping bindings:', JSON.stringify(mergedBindings));
              }
            } catch (e) {
            debugLog('[MATCHER][ERROR] Exception in builtin (arity 1):', e, 'args:', JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
          debugLog('[MATCHER][DEBUG] Trying builtin (arity 2) with subjectVals:', JSON.stringify(subjectVals), 'objectVals:', JSON.stringify(objectVals), 'restBindings:', JSON.stringify(restBindings));
          for (const sVal of subjectVals) {
            for (const oVal of objectVals) {
              if (typeof triple.subject === 'object' && 'type' in triple.subject && triple.subject.type === 'Variable') {
                debugLog('[MATCHER][DEBUG] Binding subject variable', triple.subject.value, 'to', JSON.stringify(sVal));
              }
              if (typeof triple.object === 'object' && 'type' in triple.object && triple.object.type === 'Variable') {
                debugLog('[MATCHER][DEBUG] Binding object variable', triple.object.value, 'to', JSON.stringify(oVal));
              }
              debugLog('[BUILTIN ARGS][ERROR] Exception in builtin (arity 1):', e, 'args:', JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
            }
          }
        } else {
          for (const sVal of subjectVals) {
            for (const oVal of objectVals) {
              debugLog('[BUILTIN ARGS][TRACE] Trying builtin (arity 2) with sVal:', JSON.stringify(sVal), 'oVal:', JSON.stringify(oVal), 'restBindings:', JSON.stringify(restBindings), 'triple:', JSON.stringify(triple));
              let mergedBindings = { ...restBindings };
              if (typeof triple.subject === 'object' && 'type' in triple.subject && triple.subject.type === 'Variable') {
                debugLog('[BUILTIN ARGS][TRACE] Binding subject variable', triple.subject.value, 'to', sVal);
                mergedBindings[triple.subject.value] = sVal;
              }
              if (typeof triple.object === 'object' && 'type' in triple.object && triple.object.type === 'Variable') {
                debugLog('[BUILTIN ARGS][TRACE] Binding object variable', triple.object.value, 'to', oVal);
                mergedBindings[triple.object.value] = oVal;
              }
              let args: N3Term[] = [sVal, oVal];
              debugLog('[MATCHER][DEBUG] Builtin (arity 2) args:', JSON.stringify(args));
              debugLog('[MATCHER][DEBUG] Invoking builtin.apply (arity 2) with args:', JSON.stringify(args));
              debugLog('[MATCHER][ERROR] Exception in builtin (arity 2):', e, 'args:', JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
              debugLog('[BUILTIN ARGS][TRACE] Applying builtin (arity 2):', builtin.uri, 'args:', JSON.stringify(args), 'mergedBindings:', JSON.stringify(mergedBindings), 'triple:', JSON.stringify(triple));
              try {
                const result = builtin.apply(...args);
                debugLog('[BUILTIN ARGS][TRACE] Builtin result:', result, 'for args:', JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
                if (result === true) {
                  debugLog('[BUILTIN ARGS][TRACE] Builtin returned true, pushing bindings:', JSON.stringify(mergedBindings));
                  results.push({ ...mergedBindings });
                } else {
                  debugLog('[BUILTIN ARGS][TRACE] Builtin returned false, skipping bindings:', JSON.stringify(mergedBindings));
                }
              } catch (e) {
                debugLog('[BUILTIN ARGS][ERROR] Exception in builtin (arity 2):', e, 'args:', JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
              }
            }
          }
        }
      }
    }
  }
  // If no builtin matched, try matching the first triple against data
  if (results.length === 0) {
  debugLog('[MATCHER][DEBUG] No builtin matched for any triple, falling back to data triple matching. Patterns:', JSON.stringify(patterns));
    const [first, ...rest] = patterns;
    for (const [tripleIdx, triple] of data.entries()) {
  debugLog('[MATCHER][DEBUG] Data triple #', tripleIdx, ':', JSON.stringify(triple), 'Pattern:', JSON.stringify(first));
      debugLog(`Matching triple #${tripleIdx}:`, triple, 'against pattern:', first);
      const bindings = matchTriple(first, triple, termMatch);
  debugLog('[MATCHER][DEBUG] matchTriple result:', JSON.stringify(bindings));
      if (bindings) {
  debugLog('[MATCHER][DEBUG] Triple matched. Bindings:', JSON.stringify(bindings));
          debugLog('[MATCHER][DEBUG] Checking compatibility of bindings:', JSON.stringify(bindings), 'with restBindings:', JSON.stringify(restBindings));
        debugLog('Triple matched, bindings:', bindings);
        const restBindingsList = matchAntecedent(rest, data, builtins);
        for (const [restIdx, restBindings] of restBindingsList.entries()) {
          let compatible = true;
          for (const k in bindings) {
            if (k in restBindings && !termEquals(bindings[k], restBindings[k])) {
              debugLog('Bindings not compatible for variable:', k, bindings[k], restBindings[k]);
              compatible = false;
              break;
            }
          }
          if (compatible) {
            debugLog('[MATCHER][DEBUG] Bindings compatible, merging:', JSON.stringify({ ...restBindings, ...bindings }));
            debugLog('[MATCHER][DEBUG] Bindings not compatible, skipping.');
  debugLog('[MATCHER][DEBUG] Triple did not match pattern:', JSON.stringify(triple), 'Pattern:', JSON.stringify(first));
            debugLog('Bindings compatible, pushing merged bindings:', { ...restBindings, ...bindings });
            results.push({ ...restBindings, ...bindings });
          } else {
            debugLog('Bindings not compatible, skipping');
          }
        }
      } else {
        debugLog('Triple did not match pattern');
      }
    }
  }
  debugLog('matchAntecedent returning results:', results);
  debugLog('[MATCHER][DEBUG] matchAntecedent returning results:', JSON.stringify(results));
  debugLog('matchAntecedent: final results:', JSON.stringify(results, null, 2));
  debugLog('[MATCHER][DEBUG] matchAntecedent: final results:', JSON.stringify(results, null, 2));
  return results;
}

export function instantiateTriple(triple: N3Triple, bindings: Record<string, N3Term>): N3Triple {
  debugLog('instantiateTriple called', { triple, bindings });
  const instantiateTerm = (term: N3Term): N3Term => {
    if (typeof term === 'object' && 'type' in term && term.type === 'Variable') {
      const varName = term.value;
      if (bindings[varName] !== undefined) {
        const binding = bindings[varName];
        debugLog('Substituting variable in triple:', varName, 'with', binding);
        return binding;
      } else {
        debugLog('Unbound variable in consequent:', varName);
      }
    }
    return term;
  };
  const result = {
    subject: instantiateTerm(triple.subject),
    predicate: instantiateTerm(triple.predicate),
    object: instantiateTerm(triple.object)
  };
  debugLog('instantiateTriple result:', result);
  return result;
}
