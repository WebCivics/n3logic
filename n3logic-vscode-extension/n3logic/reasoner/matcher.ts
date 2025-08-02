// Type guards for N3Term
function isN3Variable(term: N3Term): term is { type: 'Variable'; value: string } {
  return typeof term === 'object' && term !== null && 'type' in term && term.type === 'Variable' && 'value' in term;
}
function isN3IRI(term: N3Term): term is { type: 'IRI'; value: string } {
  return typeof term === 'object' && term !== null && 'type' in term && term.type === 'IRI' && 'value' in term;
}
export {};

// Matcher logic for N3LogicReasoner
// Modular helpers for matcher
function resolveSubjectVals(triple: N3Triple, restBindings: Record<string, N3Term>, data: N3Triple[]): { vals: N3Term[], varName?: string } {
  if (isN3Variable(triple.subject)) {
    const subjVar = triple.subject.value;
    if (restBindings.hasOwnProperty(subjVar)) {
      debugLog('Subject is variable, using bound value:', restBindings[subjVar]);
      return { vals: [restBindings[subjVar]], varName: subjVar };
    } else {
      const vals = Array.from(new Set(data.map((t) => JSON.stringify(t.subject)))).map((s) => JSON.parse(s));
      debugLog('Subject variable', subjVar, 'not bound, trying all possible values from data:', vals);
      debugLog('[MATCHER][DEBUG][LOGGING] Trying subject variable', subjVar, 'with all possible values:', vals);
      return { vals, varName: subjVar };
    }
  } else {
    return { vals: [triple.subject] };
  }
}

function resolveObjectVals(triple: N3Triple, restBindings: Record<string, N3Term>, data: N3Triple[]): { vals: N3Term[], varName?: string } {
  if (isN3Variable(triple.object)) {
    const objVar = triple.object.value;
    if (restBindings.hasOwnProperty(objVar)) {
      debugLog('Object is variable, using bound value:', restBindings[objVar]);
      return { vals: [restBindings[objVar]], varName: objVar };
    } else {
      const vals = Array.from(new Set(data.map((t) => JSON.stringify(t.object)))).map((s) => JSON.parse(s));
      debugLog('Object variable', objVar, 'not bound, trying all possible values from data:', vals);
      debugLog('[MATCHER][DEBUG][LOGGING] Trying object variable', objVar, 'with all possible values:', vals);
      return { vals, varName: objVar };
    }
  } else {
    return { vals: [triple.object] };
  }
}
import { N3Triple, N3Term, N3Builtin } from '../N3LogicTypes';
import { debugLog, debugTrace, debugWarn, debugError } from './debug';
function assert(condition: boolean, ...msg: any[]) {
  if (!condition) {
    debugError('Assertion failed:', ...msg);
    throw new Error('Assertion failed: ' + msg.map(String).join(' '));
  }
}

// Utility: Convert N3Term to N3 string
export function n3TermToString(term: N3Term): string {
  // Only IRIs get angle brackets, not literals
  if (typeof term === 'string') {
    // If already in N3 format, return as is
    if (/^<.*>$/.test(term) || /^".*"$/.test(term) || /^\?.+/.test(term) || /^_:.+/.test(term)) return term;
    return `<${term}>`;
  }
  if (typeof term === 'object' && term !== null) {
    if (term.type === 'Variable') return `?${term.value}`;
    if (term.type === 'Literal') {
      let lit = JSON.stringify(term.value);
      if ('datatype' in term && term.datatype) lit += `^^<${term.datatype}>`;
      if ('language' in term && term.language) lit += `@${term.language}`;
      return lit;
    }
    if (term.type === 'IRI') {
      // If the value is a quoted string, treat as a literal, not an IRI
      if (typeof term.value === 'string' && /^".*"$/.test(term.value)) {
        return term.value;
      }
      return `<${term.value}>`;
    }
    if (term.type === 'BlankNode') return `_:${term.value}`;
  }
  return String(term);
}

export function tripleToN3(triple: N3Triple): string {
  return `${n3TermToString(triple.subject)} ${n3TermToString(triple.predicate)} ${n3TermToString(triple.object)} .`;
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
  const results: Array<Record<string, N3Term>> = [];
  debugLog('[MATCHER][DEBUG][LOGGING] Builtins available at match time:', builtins ? builtins.map((b) => b.uri) : builtins);
  // EXTRA DEBUG: Log all patterns and their predicates
  patterns.forEach((pattern, idx) => {
    debugLog(`[MATCHER][DEBUG][PATTERN] Pattern #${idx}:`, JSON.stringify(pattern));
    debugLog(`[MATCHER][DEBUG][PATTERN] Pattern #${idx} predicate:`, pattern.predicate);
  });
  // Log all data triples and their predicates
  data.forEach((triple, idx) => {
    debugLog(`[MATCHER][DEBUG][DATA] Data triple #${idx}:`, JSON.stringify(triple));
    debugLog(`[MATCHER][DEBUG][DATA] Data triple #${idx} predicate:`, triple.predicate);
  });
  if (typeof (global as any).debugLog === 'function') {
    (global as any).debugLog('[MATCHER][TRACE][EXTRA] Builtins at match time:', builtins ? builtins.map((b) => b.uri) : builtins);
    (global as any).debugLog('[MATCHER][TRACE][EXTRA] Patterns:', JSON.stringify(patterns, null, 2));
    (global as any).debugLog('[MATCHER][TRACE][EXTRA] Data:', JSON.stringify(data, null, 2));
  }
  debugLog('[MATCHER][DEBUG][LOGGING] Patterns:', JSON.stringify(patterns, null, 2));
  debugLog('[MATCHER][DEBUG][LOGGING] Data:', JSON.stringify(data, null, 2));
  debugLog('[MATCHER][DEBUG][LOGGING] Builtin URIs:', Array.isArray(builtins) ? builtins.map((b) => b.uri) : builtins);
  debugLog('[MATCHER][DEBUG] matchAntecedent called with patterns:', JSON.stringify(patterns, null, 2), 'data:', JSON.stringify(data, null, 2), 'builtins:', builtins ? builtins.map((b) => b.uri) : builtins);
  debugLog('[MATCHER][DEBUG] Builtins at match time:', builtins ? builtins.map((b) => b.uri) : builtins);
  debugTrace('matchAntecedent: patterns:', JSON.stringify(patterns, null, 2));
  debugTrace('matchAntecedent: data:', JSON.stringify(data, null, 2));
  debugTrace('matchAntecedent: builtins:', JSON.stringify(builtins, null, 2));
  debugTrace('matchAntecedent: builtin URIs:', Array.isArray(builtins) ? builtins.map((b) => b.uri) : builtins);
  debugTrace('matchAntecedent called', { patterns, data });
  if (patterns.length === 0) {
    debugTrace('No patterns left, returning [{}]');
    return [{}];
  }
  function normalizeBindings(bindings: Record<string, N3Term>): Record<string, N3Term> {
    const out: Record<string, N3Term> = {};
    for (const k in bindings) {
      const v = bindings[k];
      // If a variable is bound to a quoted string, always treat as Literal
      if (typeof v === 'string' && /^".*"$/.test(v)) {
        out[k] = { type: 'Literal', value: JSON.parse(v) };
      } else if (typeof v === 'object' && v !== null && v.type === 'IRI' && typeof v.value === 'string' && /^".*"$/.test(v.value)) {
        // If a variable is bound to an IRI whose value is a quoted string, treat as Literal
        out[k] = { type: 'Literal', value: JSON.parse(v.value) };
      } else {
        out[k] = v;
      }
    }
    return out;
  }
  // Only one check for patterns.length === 0
  if (patterns.length === 0) {
    debugTrace('No patterns left, returning [{}]');
    return [{}];
  }
  // Try each triple as the builtin, or as a regular triple
  for (let i = 0; i < patterns.length; i++) {
    const triple = patterns[i];
  debugLog('[MATCHER][TRACE][LITERAL] Pattern triple:', JSON.stringify(triple));
  if (triple && triple.subject) debugLog('[MATCHER][TRACE][LITERAL] Subject:', JSON.stringify(triple.subject), 'Type:', typeof triple.subject, 'Value:', (typeof triple.subject === 'object' && triple.subject !== null && 'value' in triple.subject) ? (triple.subject as any).value : triple.subject);
  if (triple && triple.object) debugLog('[MATCHER][TRACE][LITERAL] Object:', JSON.stringify(triple.object), 'Type:', typeof triple.object, 'Value:', (typeof triple.object === 'object' && triple.object !== null && 'value' in triple.object) ? (triple.object as any).value : triple.object);
  if (triple && triple.predicate) debugLog('[MATCHER][TRACE][LITERAL] Predicate:', JSON.stringify(triple.predicate), 'Type:', typeof triple.predicate, 'Value:', (typeof triple.predicate === 'object' && triple.predicate !== null && 'value' in triple.predicate) ? (triple.predicate as any).value : triple.predicate);
    debugLog('[MATCHER][DEBUG] Checking pattern triple #', i, ':', JSON.stringify(triple));
    debugLog('[MATCHER][DEBUG][LOGGING] Pattern triple details:', JSON.stringify(triple, null, 2));
    debugTrace('[MATCHER][TRACE] Triple matching logic entered:', JSON.stringify(triple));
    // EXTRA DEBUG: Print predicate value and type
    let predType = (triple.predicate && typeof triple.predicate === 'object' && 'type' in triple.predicate) ? triple.predicate.type : typeof triple.predicate;
    let predValue = (triple.predicate && typeof triple.predicate === 'object' && 'value' in triple.predicate) ? triple.predicate.value : triple.predicate;
    debugLog('[MATCHER][EXTRA][DEBUG] Pattern triple predicate type:', predType, 'value:', predValue);
    if (typeof (global as any).debugLog === 'function') {
      (global as any).debugLog('[MATCHER][EXTRA][DEBUG] Pattern triple predicate type:', predType, 'value:', predValue);
    }
    // Always extract predicate as string for builtin matching
    let predicateUri: string | undefined = undefined;
    if (isN3IRI(triple.predicate) && typeof triple.predicate.value === 'string') {
      predicateUri = String(triple.predicate.value);
    } else if (typeof triple.predicate === 'string') {
      predicateUri = triple.predicate;
    } else {
      predicateUri = undefined;
      debugLog('[MATCHER][WARN] Pattern triple predicate is not a string or IRI:', JSON.stringify(triple.predicate));
      if (typeof (global as any).debugLog === 'function') {
        (global as any).debugLog('[MATCHER][WARN] Pattern triple predicate is not a string or IRI:', JSON.stringify(triple.predicate));
      }
    }
    debugLog('[MATCHER][DEBUG][LOGGING] Attempting builtin match for triple predicate:', predicateUri);
    if (typeof (global as any).debugLog === 'function') {
      (global as any).debugLog('[MATCHER][TRACE][EXTRA] Attempting builtin match for triple predicate:', predicateUri);
    }
    debugLog('[MATCHER][DEBUG][LOGGING] All builtins at this point:', builtins ? builtins.map((b) => b.uri) : builtins);
    debugLog('[MATCHER][DEBUG][CUSTOM] Builtins full array:', JSON.stringify(builtins, null, 2));
    debugLog('[MATCHER][DEBUG][CUSTOM] Triple predicate:', JSON.stringify(triple.predicate));
    debugTrace('[MATCHER][TRACE] Builtin candidate URIs:', builtins ? builtins.map((b) => b.uri) : builtins);
    // Find builtin by comparing string value of predicate to builtin.uri
    let builtin = undefined;
    if (builtins && predicateUri) {
      for (const b of builtins) {
        debugLog('[MATCHER][DEBUG][LOGGING] Checking builtin candidate:', b.uri, 'against predicateUri:', predicateUri);
        debugTrace('[MATCHER][TRACE] Checking builtin candidate:', b.uri, 'against predicateUri:', predicateUri);
        if (b.uri === predicateUri) {
          debugLog('[MATCHER][DEBUG][LOGGING] Builtin match found:', b.uri);
          debugTrace('[MATCHER][TRACE] Builtin match found:', b.uri);
          if (typeof (global as any).debugLog === 'function') {
            (global as any).debugLog('[MATCHER][TRACE][EXTRA] Builtin match found:', b.uri, 'for predicateUri:', predicateUri);
          }
          builtin = b;
          break;
        }
      }
      if (!builtin) {
        debugLog('[MATCHER][DEBUG][LOGGING] No builtin match found for predicateUri:', predicateUri);
        debugTrace('[MATCHER][TRACE] No builtin match found for predicateUri:', predicateUri);
        debugLog('[MATCHER][EXTRA][WARN] No builtin found for predicateUri:', predicateUri, 'Builtins available:', builtins ? builtins.map((b) => b.uri) : builtins);
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog('[MATCHER][EXTRA][WARN] No builtin found for predicateUri:', predicateUri, 'Builtins available:', builtins ? builtins.map((b) => b.uri) : builtins);
        }
      }
    }
    debugLog('[MATCHER][DEBUG] Builtin found:', !!builtin, 'for predicateUri:', predicateUri, 'triple:', JSON.stringify(triple));
    debugTrace('[MATCHER][TRACE] Builtin found:', !!builtin, 'for predicateUri:', predicateUri);
    if (builtin) {
      debugLog('[MATCHER][TRACE][LITERAL] Builtin match found:', builtin.uri, 'Triple:', JSON.stringify(triple));
      debugLog('[MATCHER][TRACE][LITERAL] Builtin apply function:', builtin.apply && builtin.apply.toString());
      if (typeof (global as any).debugLog === 'function') {
        (global as any).debugLog('[MATCHER][TRACE][EXTRA] Invoking builtin:', builtin.uri, 'with triple:', JSON.stringify(triple));
      }
      debugLog('[MATCHER][DEBUG][LOGGING] Invoking builtin:', builtin.uri, 'with triple:', JSON.stringify(triple));
      debugTrace('[MATCHER][TRACE] Invoking builtin:', builtin.uri, 'with triple:', JSON.stringify(triple));
      const rest = patterns.slice(0, i).concat(patterns.slice(i + 1));
      const restBindingsList = matchAntecedent(rest, data, builtins);
      debugLog('Rest bindings list for builtin:', restBindingsList);
      debugTrace('[MATCHER][TRACE] Rest bindings list for builtin:', restBindingsList);
      for (const [restIdx, restBindings] of restBindingsList.entries()) {
        debugLog('matchAntecedent: restBindings:', JSON.stringify(restBindings, null, 2));
        debugLog(`Rest bindings #${restIdx}:`, restBindings);
        debugTrace('[MATCHER][TRACE] Rest bindings #', restIdx, ':', restBindings);
        const subjRes = resolveSubjectVals(triple, restBindings, data);
        const objectRes = resolveObjectVals(triple, restBindings, data);
        const subjectVals = subjRes.vals;
        const objectVals = objectRes.vals;
        if (builtin.arity === 1) {
          for (const sVal of subjectVals) {
            debugLog('[MATCHER][TRACE][LITERAL] Builtin arity 1, sVal:', JSON.stringify(sVal), 'Type:', typeof sVal, 'Value:', (typeof sVal === 'object' && sVal !== null && 'value' in sVal) ? (sVal as any).value : sVal);
            const mergedBindings = { ...restBindings };
            if (typeof subjRes.varName === 'string') {
              mergedBindings[subjRes.varName] = sVal;
            }
            const args: N3Term[] = [sVal];
            debugLog('[MATCHER][TRACE][LITERAL] Builtin args:', JSON.stringify(args));
            debugTrace('[MATCHER][TRACE] Invoking builtin (arity 1):', builtin.uri, 'args:', args, 'bindings:', mergedBindings);
            try {
              if (typeof (global as any).debugLog === 'function') {
                (global as any).debugLog('[MATCHER][TRACE][EXTRA] About to call builtin.apply (arity 1):', builtin.uri, 'args:', args, 'bindings:', mergedBindings);
              }
              const result = builtin.apply(...args);
              debugLog('[MATCHER][TRACE][LITERAL] Builtin result (arity 1):', result);
              debugTrace('[MATCHER][TRACE] Builtin result (arity 1):', result);
              if (typeof (global as any).debugLog === 'function') {
                (global as any).debugLog('[MATCHER][TRACE][EXTRA] Builtin result (arity 1):', result);
              }
              if (result === true) {
                results.push(normalizeBindings({ ...mergedBindings }));
              }
            } catch (e) {
              debugLog('[MATCHER][ERROR] Exception in builtin (arity 1):', e, 'args:', JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
              debugTrace('[MATCHER][TRACE][ERROR] Exception in builtin (arity 1):', e, 'args:', args, 'bindings:', mergedBindings);
              if (typeof (global as any).debugLog === 'function') {
                (global as any).debugLog('[MATCHER][TRACE][EXTRA] Exception in builtin (arity 1):', e, 'args:', args, 'bindings:', mergedBindings);
              }
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
              debugTrace('[MATCHER][TRACE] Invoking builtin (arity 2):', builtin.uri, 'args:', args, 'bindings:', mergedBindings);
              try {
                if (typeof (global as any).debugLog === 'function') {
                  (global as any).debugLog('[MATCHER][TRACE][EXTRA] About to call builtin.apply (arity 2):', builtin.uri, 'args:', args, 'bindings:', mergedBindings);
                }
                const result = builtin.apply(...args);
                debugTrace('[MATCHER][TRACE] Builtin result (arity 2):', result);
                if (typeof (global as any).debugLog === 'function') {
                  (global as any).debugLog('[MATCHER][TRACE][EXTRA] Builtin result (arity 2):', result);
                }
                if (result === true) {
                  results.push(normalizeBindings({ ...mergedBindings }));
                }
              } catch (e) {
                debugLog('[BUILTIN][DEBUG][INVOKE][ERROR] Exception in builtin (arity 2):', e, 'args:', JSON.stringify(args), 'bindings:', JSON.stringify(mergedBindings));
                debugTrace('[MATCHER][TRACE][ERROR] Exception in builtin (arity 2):', e, 'args:', args, 'bindings:', mergedBindings);
                if (typeof (global as any).debugLog === 'function') {
                  (global as any).debugLog('[MATCHER][TRACE][EXTRA] Exception in builtin (arity 2):', e, 'args:', args, 'bindings:', mergedBindings);
                }
              }
            }
          }
        }
      }
    } else {
      debugLog('[MATCHER][DEBUG][LOGGING] No builtin found, matching pattern triple against data triples.');
      debugTrace('[MATCHER][TRACE] No builtin found, matching pattern triple against data triples.');
      for (const dataTriple of data) {
        const bindings = matchTriple(triple, dataTriple, termMatch);
        if (bindings) {
          debugLog('[MATCHER][DEBUG][LOGGING] Data triple matched:', JSON.stringify(dataTriple), 'bindings:', JSON.stringify(bindings));
          debugTrace('[MATCHER][TRACE] Data triple matched:', dataTriple, 'bindings:', bindings);
          const rest = patterns.slice(0, i).concat(patterns.slice(i + 1));
          const restBindingsList = matchAntecedent(rest, data, builtins);
          for (const restBindings of restBindingsList) {
            results.push({ ...restBindings, ...bindings });
            debugTrace('[MATCHER][TRACE] Added result bindings:', { ...restBindings, ...bindings });
          }
        }
      }
    }
  }
  // Always return results, even if empty
  debugLog('matchAntecedent returning results:', results);
  debugLog('[MATCHER][DEBUG] matchAntecedent returning results:', JSON.stringify(results));
  debugLog('matchAntecedent: final results:', JSON.stringify(results, null, 2));
  debugLog('[MATCHER][DEBUG] matchAntecedent: final results:', JSON.stringify(results, null, 2));
  // Ensure a return on all code paths
  return results;
}

export function instantiateTriple(triple: N3Triple, bindings: Record<string, N3Term>): N3Triple {
  debugLog('instantiateTriple called', { triple, bindings });
  const instantiateTerm = (term: N3Term, position: 'subject' | 'predicate' | 'object'): N3Term => {
    if (typeof term === 'object' && 'type' in term && term.type === 'Variable') {
      const varName = term.value;
      if (bindings[varName] !== undefined) {
        const binding = bindings[varName];
        debugLog('Substituting variable in triple:', varName, 'with', binding);
        // If the binding is a quoted string, always treat as Literal
        if (typeof binding === 'string' && /^".*"$/.test(binding)) {
          return { type: 'Literal', value: JSON.parse(binding) };
        }
        // If the binding is an IRI whose value is a quoted string, treat as Literal
        if (typeof binding === 'object' && binding.type === 'IRI' && typeof binding.value === 'string' && /^".*"$/.test(binding.value)) {
          return { type: 'Literal', value: JSON.parse(binding.value) };
        }
        // If the binding is a Literal, return as is
        if (typeof binding === 'object' && binding.type === 'Literal') {
          return binding;
        }
        // If the binding is an IRI object, return as is
        if (typeof binding === 'object' && binding.type === 'IRI') {
          return binding;
        }
        // If the binding is a string, treat as IRI
        if (typeof binding === 'string') {
          return { type: 'IRI', value: binding };
        }
        // Otherwise, just return the binding
        return binding;
      } else {
        debugLog('Unbound variable in consequent:', varName);
      }
    }
    return term;
  };
  const result = {
    subject: instantiateTerm(triple.subject, 'subject'),
    predicate: instantiateTerm(triple.predicate, 'predicate'),
    object: instantiateTerm(triple.object, 'object'),
  };
  debugLog('instantiateTriple result:', result);
  return result;
}
