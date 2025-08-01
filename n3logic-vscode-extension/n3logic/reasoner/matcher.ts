
// Matcher logic for N3LogicReasoner
import { N3Triple, N3Term, N3Builtin } from '../N3LogicTypes';
import { debugLog } from './debug';
import { termEquals } from './tripleUtils';

export function matchFormula(formula: any, data: N3Triple[], matchAntecedent: any): Array<Record<string, N3Term>> {
  debugLog('matchFormula called', { formula, data });
  if (!formula) {
    debugLog('No formula provided, returning [{}]');
    return [{}];
  }
  if (formula.type === 'Formula') {
    debugLog('Formula type is Formula, matching antecedent:', formula.triples);
    return matchAntecedent(formula.triples, data);
  } else if (formula.type === 'ForAll') {
    debugLog('Formula type is ForAll, recursing into formula:', formula.formula);
    return matchFormula(formula.formula, data, matchAntecedent);
  } else if (formula.type === 'Exists') {
    debugLog('Formula type is Exists, recursing into formula:', formula.formula);
    return matchFormula(formula.formula, data, matchAntecedent);
  }
  debugLog('Unknown formula type, returning [{}]');
  return [{}];
}

export function matchTriple(pattern: N3Triple, triple: N3Triple, termMatch: any): Record<string, N3Term> | null {
  debugLog('matchTriple called', { pattern, triple });
  const bindings: Record<string, N3Term> = {};
  if (!termMatch(pattern.subject, triple.subject, bindings)) return null;
  if (!termMatch(pattern.predicate, triple.predicate, bindings)) return null;
  if (!termMatch(pattern.object, triple.object, bindings)) return null;
  debugLog('matchTriple succeeded, bindings:', bindings);
  return bindings;
}

export function termMatch(pattern: N3Term, value: N3Term, bindings: Record<string, N3Term>): boolean {
  debugLog('termMatch called', { pattern, value, bindings });
  if (typeof pattern === 'object' && 'type' in pattern && pattern.type === 'Variable') {
    const varName = pattern.value;
    debugLog('Pattern is variable:', varName);
    if (varName in bindings) {
      debugLog('Variable already bound:', varName, 'Checking equality with value:', value);
      return termEquals(bindings[varName], value);
    } else {
      debugLog('Binding variable:', varName, 'to value:', value);
      bindings[varName] = value;
      return true;
    }
  } else {
    debugLog('Pattern is not variable, checking term equality');
    return termEquals(pattern, value);
  }
}

export function matchAntecedent(patterns: N3Triple[], data: N3Triple[], builtins: N3Builtin[]): Array<Record<string, N3Term>> {
  debugLog('matchAntecedent: patterns:', JSON.stringify(patterns, null, 2));
  debugLog('matchAntecedent: data:', JSON.stringify(data, null, 2));
  debugLog('matchAntecedent: builtins:', JSON.stringify(builtins, null, 2));
  debugLog('matchAntecedent called', { patterns, data });
  if (patterns.length === 0) {
    debugLog('No patterns left, returning [{}]');
    return [{}];
  }
  const [first, ...rest] = patterns;
  const results: Array<Record<string, N3Term>> = [];
  debugLog('Registered builtins at matchAntecedent:', builtins);
  let builtin = undefined;
  if (builtins && typeof first.predicate === 'object' && 'value' in first.predicate) {
    const predValue = first.predicate.value;
    debugLog('Checking for builtin with predicate value:', predValue);
    builtin = builtins.find(b => b.uri === predValue);
    if (builtin) {
      debugLog('Matched builtin for predicate:', predValue, builtin);
    } else {
      debugLog('No builtin matched for predicate:', predValue);
    }
  }
  if (builtin) {
    debugLog('Matched builtin triple:', first, 'Builtin:', builtin);
    const restBindingsList = matchAntecedent(rest, data, builtins);
    debugLog('Rest bindings list for builtin:', restBindingsList);
    for (const [restIdx, restBindings] of restBindingsList.entries()) {
  debugLog('matchAntecedent: restBindings:', JSON.stringify(restBindings, null, 2));
      debugLog(`Rest bindings #${restIdx}:`, restBindings);
      // Use current binding for variable if present, else all possible values
      let subjectVals: N3Term[] = [];
      let objectVals: N3Term[] = [];
      if (typeof first.subject === 'object' && 'type' in first.subject && first.subject.type === 'Variable' && restBindings.hasOwnProperty(first.subject.value)) {
        subjectVals = [restBindings[first.subject.value]];
        debugLog('Subject is variable, using bound value:', subjectVals);
      } else if (typeof first.subject === 'object' && 'type' in first.subject && first.subject.type === 'Variable') {
        subjectVals = Array.from(new Set(data.map(t => t.subject).concat(data.map(t => t.object))));
        debugLog('Subject is variable, possible values (subjects+objects):', subjectVals);
      } else {
        subjectVals = [first.subject];
      }
      if (typeof first.object === 'object' && 'type' in first.object && first.object.type === 'Variable' && restBindings.hasOwnProperty(first.object.value)) {
        objectVals = [restBindings[first.object.value]];
        debugLog('Object is variable, using bound value:', objectVals);
      } else if (typeof first.object === 'object' && 'type' in first.object && first.object.type === 'Variable') {
        objectVals = Array.from(new Set(data.map(t => t.object).concat(data.map(t => t.subject))));
        debugLog('Object is variable, possible values (objects+subjects):', objectVals);
      } else {
        objectVals = [first.object];
      }
      if (builtin.arity === 1) {
        for (const sVal of subjectVals) {
          debugLog('matchAntecedent: Trying builtin (arity 1) with sVal:', JSON.stringify(sVal), 'restBindings:', JSON.stringify(restBindings));
          let mergedBindings = { ...restBindings };
          if (typeof first.subject === 'object' && 'type' in first.subject && first.subject.type === 'Variable') {
            mergedBindings[first.subject.value] = sVal;
          }
          let args: N3Term[] = [sVal];
          debugLog('Applying builtin (arity 1):', builtin.uri, 'args:', args, 'mergedBindings:', mergedBindings);
          const result = builtin.apply(...args);
          debugLog('Builtin result:', result, 'for args:', args, 'bindings:', mergedBindings);
          if (result === true) {
            debugLog('Builtin returned true, pushing bindings:', mergedBindings);
            results.push({ ...mergedBindings });
          } else {
            debugLog('Builtin returned false, skipping bindings:', mergedBindings);
          }
        }
      } else {
        for (const sVal of subjectVals) {
          for (const oVal of objectVals) {
            debugLog('matchAntecedent: Trying builtin (arity 2) with sVal:', JSON.stringify(sVal), 'oVal:', JSON.stringify(oVal), 'restBindings:', JSON.stringify(restBindings));
            let mergedBindings = { ...restBindings };
            if (typeof first.subject === 'object' && 'type' in first.subject && first.subject.type === 'Variable') {
              mergedBindings[first.subject.value] = sVal;
            }
            if (typeof first.object === 'object' && 'type' in first.object && first.object.type === 'Variable') {
              mergedBindings[first.object.value] = oVal;
            }
            let args: N3Term[] = [sVal, oVal];
            debugLog('Applying builtin (arity 2):', builtin.uri, 'args:', args, 'mergedBindings:', mergedBindings);
            const result = builtin.apply(...args);
            debugLog('Builtin result:', result, 'for args:', args, 'bindings:', mergedBindings);
            if (result === true) {
              debugLog('Builtin returned true, pushing bindings:', mergedBindings);
              results.push({ ...mergedBindings });
            } else {
              debugLog('Builtin returned false, skipping bindings:', mergedBindings);
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
