// Triple and term utilities for N3LogicReasoner

import { N3Triple, N3Term } from '../N3LogicTypes';
import { N3LogicParser } from '../N3LogicParser';
import { debugTrace, debugWarn, debugError } from './debug';

function assert(condition: boolean, ...msg: any[]) {
  if (!condition) {
    debugError('Assertion failed:', ...msg);
    throw new Error('Assertion failed: ' + msg.map(String).join(' '));
  }
}


export function tripleToString(triple: N3Triple): string {
  debugTrace('tripleToString input:', triple);
    debugTrace && debugTrace('[tripleUtils][TRACE] tripleToString called:', triple);
    // Always output canonical N3 string: <subj> <pred> <obj> .
    function n3Term(term: any): string {
      if (term && typeof term === 'object') {
        if (term.type === 'IRI' && term.value) {
          if (/^<.*>$/.test(term.value)) return term.value;
          return `<${term.value}>`;
        }
        if (term.type === 'Literal' && term.value !== undefined) {
          if (/^".*"$/.test(term.value)) return term.value;
          return `"${term.value}"`;
        }
        if (term.type === 'Variable' && term.value) {
          if (/^\?.+/.test(term.value)) return term.value;
          return `?${term.value}`;
        }
        if ('value' in term) return String(term.value);
      }
      if (typeof term === 'string') {
        // If already in N3 format, don't wrap again
        if (/^<.*>$/.test(term) || /^".*"$/.test(term) || /^\?.+/.test(term)) return term;
        return term;
      }
      return String(term);
    }
    // If input is a string, try to parse it into subject, predicate, object
    if (typeof triple === 'string') {
      const tripleStr: string = triple;
      // Try to parse: <a> <b> "1" .
      const match = tripleStr.match(/^(<[^>]+>|\?\w+) (<[^>]+>|\?\w+) ("[^"]*"|<[^>]+>|\?\w+)(?: \\.)?$/);
      if (match) {
        const subj = match[1];
        const pred = match[2];
        const obj = match[3];
        const result = `${subj} ${pred} ${obj} .`;
        debugTrace && debugTrace('[tripleUtils][TRACE] tripleToString: parsed string input, result', result);
        debugTrace('tripleToString output:', result);
        return result;
      } else {
        // Fallback: return as-is, but ensure trailing dot
        let s: string = tripleStr.trim();
        if (!s.endsWith('.')) s = s + ' .';
        debugTrace && debugTrace('[tripleUtils][TRACE] tripleToString: fallback string input, result', s);
        debugTrace('tripleToString output:', s);
        return s;
      }
    }
    if (!triple || typeof triple !== 'object') {
      debugTrace && debugTrace('[tripleUtils][TRACE] tripleToString: input is not object, returning empty string');
      return '';
    }
    const subj = n3Term(triple.subject);
    const pred = n3Term(triple.predicate);
    const obj = n3Term(triple.object);
    const result = `${subj} ${pred} ${obj} .`;
    debugTrace && debugTrace('[tripleUtils][TRACE] tripleToString: result', result);
    debugTrace('tripleToString output:', result);
    return result;
}


export function stringToTriple(str: string): N3Triple {
  debugTrace('stringToTriple input:', str);
    debugTrace && debugTrace('[tripleUtils][TRACE] stringToTriple called:', str);
    if (typeof str !== 'string') {
      debugTrace && debugTrace('[tripleUtils][TRACE] stringToTriple: input is not string, returning as is');
      return str;
    }
  const [subject, predicate, object] = str.split(' ');
  const result = { subject, predicate, object };
  debugTrace && debugTrace('[tripleUtils][TRACE] stringToTriple: result', result);
  return result;
}


export function termToString(term: N3Term): string {
  debugTrace('termToString input:', term);
  if (typeof term === 'string') return term;
  if (term && typeof term === 'object' && 'type' in term && term.type === 'Literal') {
    return '"' + term.value + '"';
  }
  if (term && typeof term === 'object' && 'value' in term) return term.value;
  debugWarn('termToString: unknown term structure', term);
  return '';
}


export function termEquals(a: N3Term, b: N3Term): boolean {
  debugTrace('termEquals input:', a, b);
  // If both are objects and type Literal, compare value
  if (typeof a === 'object' && a && a.type === 'Literal') {
    if (typeof b === 'object' && b && b.type === 'Literal') {
      const eq = a.value === b.value;
      debugTrace('termEquals: both Literal objects, value equality', eq);
      return eq;
    }
    if (typeof b === 'string') {
      const eq = a.value === b;
      debugTrace('termEquals: Literal object vs string, value equality', eq);
      return eq;
    }
  }
  if (typeof b === 'object' && b && b.type === 'Literal' && typeof a === 'string') {
    const eq = b.value === a;
    debugTrace('termEquals: string vs Literal object, value equality', eq);
    return eq;
  }
  if (typeof a !== typeof b) {
    debugTrace('termEquals: type mismatch', typeof a, typeof b);
    return false;
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const eq = JSON.stringify(a) === JSON.stringify(b);
    debugTrace('termEquals: object equality', eq);
    return eq;
  }
  const eq = a === b;
  debugTrace('termEquals: primitive equality', eq);
  return eq;
}
