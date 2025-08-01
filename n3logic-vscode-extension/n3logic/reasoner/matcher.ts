
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
  debugTrace('matchAntecedent: patterns:', JSON.stringify(patterns, null, 2));
  debugTrace('matchAntecedent: data:', JSON.stringify(data, null, 2));
  debugTrace('matchAntecedent: builtins:', JSON.stringify(builtins, null, 2));
  debugTrace('matchAntecedent: builtin URIs:', Array.isArray(builtins) ? builtins.map(b => b.uri) : builtins);
  debugTrace('matchAntecedent called', { patterns, data });
  if (patterns.length === 0) {
    debugTrace('No patterns left, returning [{}]');
    return [{}];
  }
  const [first, ...rest] = patterns;
  const results: Array<Record<string, N3Term>> = [];
  debugTrace('Registered builtins at matchAntecedent:', builtins);
  let builtin = undefined;
  if (builtins && typeof first.predicate === 'object' && first.predicate && 'value' in first.predicate) {
    const predValue = first.predicate.value;
    debugTrace('[BUILTIN MATCH] Checking for builtin with predicate value:', predValue, 'Available builtins:', builtins.map(b => b.uri));
    builtin = builtins.find(b => b.uri === predValue);
    if (builtin) {
      debugTrace('[BUILTIN MATCH] Matched builtin for predicate:', predValue, builtin);
    } else {
      debugTrace('[BUILTIN MATCH] No builtin matched for predicate:', predValue, 'Pattern:', first, 'Builtins:', builtins);
    }
  }
  if (builtin) {
    debugTrace('Matched builtin triple:', first, 'Builtin:', builtin);
    const restBindingsList = matchAntecedent(rest, data, builtins);
    debugLog('Rest bindings list for builtin:', restBindingsList);
    for (const [restIdx, restBindings] of restBindingsList.entries()) {
      debugLog('matchAntecedent: restBindings:', JSON.stringify(restBindings, null, 2));
      debugLog(`Rest bindings #${restIdx}:`, restBindings);
      // For builtins, always try all possible values for unbound variables (fix: do not skip if not bound)
      let subjectVals: N3Term[] = [];
      let objectVals: N3Term[] = [];
      if (typeof first.subject === 'object' && 'type' in first.subject && first.subject.type === 'Variable') {
        if (restBindings.hasOwnProperty(first.subject.value)) {
          subjectVals = [restBindings[first.subject.value]];
          debugLog('Subject is variable, using bound value:', subjectVals);
        } else {
          // Try all possible values for this variable from all current bindings in restBindings
          subjectVals = Object.values(restBindings);
          // If no bindings, try all data subjects as fallback
          if (subjectVals.length === 0) subjectVals = data.map(t => t.subject);
          debugLog('Subject variable', first.subject.value, 'not bound, trying all possible values:', subjectVals);
        }
      } else {
        subjectVals = [first.subject];
      }
      if (typeof first.object === 'object' && 'type' in first.object && first.object.type === 'Variable') {
        if (restBindings.hasOwnProperty(first.object.value)) {
          objectVals = [restBindings[first.object.value]];
          debugLog('Object is variable, using bound value:', objectVals);
        } else {
          // Try all possible values for this variable from all current bindings in restBindings
          objectVals = Object.values(restBindings);
          // If no bindings, try all data objects as fallback
          if (objectVals.length === 0) objectVals = data.map(t => t.object);
          debugLog('Object variable', first.object.value, 'not bound, trying all possible values:', objectVals);
        }
      } else {
        objectVals = [first.object];
      }
      if (builtin.arity === 1) {
        for (const sVal of subjectVals) {
          debugLog('[BUILTIN ARGS] matchAntecedent: Trying builtin (arity 1) with sVal:', JSON.stringify(sVal), 'restBindings:', JSON.stringify(restBindings), 'first:', first);
          let mergedBindings = { ...restBindings };
          if (typeof first.subject === 'object' && 'type' in first.subject && first.subject.type === 'Variable') {
            mergedBindings[first.subject.value] = sVal;
          }
          let args: N3Term[] = [sVal];
          debugLog('[BUILTIN ARGS] Applying builtin (arity 1):', builtin.uri, 'args:', args, 'mergedBindings:', mergedBindings, 'first:', first);
          const result = builtin.apply(...args);
          debugLog('[BUILTIN ARGS] Builtin result:', result, 'for args:', args, 'bindings:', mergedBindings);
          if (result === true) {
            debugLog('[BUILTIN ARGS] Builtin returned true, pushing bindings:', mergedBindings);
            results.push({ ...mergedBindings });
          } else {
            debugLog('[BUILTIN ARGS] Builtin returned false, skipping bindings:', mergedBindings);
          }
        }
      } else {
        for (const sVal of subjectVals) {
          for (const oVal of objectVals) {
            debugLog('[BUILTIN ARGS] matchAntecedent: Trying builtin (arity 2) with sVal:', JSON.stringify(sVal), 'oVal:', JSON.stringify(oVal), 'restBindings:', JSON.stringify(restBindings), 'first:', first);
            let mergedBindings = { ...restBindings };
            if (typeof first.subject === 'object' && 'type' in first.subject && first.subject.type === 'Variable') {
              mergedBindings[first.subject.value] = sVal;
            }
            if (typeof first.object === 'object' && 'type' in first.object && first.object.type === 'Variable') {
              mergedBindings[first.object.value] = oVal;
            }
            let args: N3Term[] = [sVal, oVal];
            debugLog('[BUILTIN ARGS] Applying builtin (arity 2):', builtin.uri, 'args:', args, 'mergedBindings:', mergedBindings, 'first:', first);
            const result = builtin.apply(...args);
            debugLog('[BUILTIN ARGS] Builtin result:', result, 'for args:', args, 'bindings:', mergedBindings);
            if (result === true) {
              debugLog('[BUILTIN ARGS] Builtin returned true, pushing bindings:', mergedBindings);
              results.push({ ...mergedBindings });
            } else {
              debugLog('[BUILTIN ARGS] Builtin returned false, skipping bindings:', mergedBindings);
            }
          }
        }
      }
    }
  } else {
    debugLog('No builtin matched, matching against data triples');
    for (const [tripleIdx, triple] of data.entries()) {
      debugLog(`Matching triple #${tripleIdx}:`, triple, 'against pattern:', first);
      const bindings = matchTriple(first, triple, termMatch);
      if (bindings) {
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
  debugLog('matchAntecedent: final results:', JSON.stringify(results, null, 2));
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
