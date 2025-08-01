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
  assert(triple && typeof triple === 'object', 'tripleToString expects object triple', triple);
  // Extra debug: flag if predicate is a custom builtin URI
  if (triple.predicate && typeof triple.predicate === 'object' && 'value' in triple.predicate && typeof triple.predicate.value === 'string') {
    const val = triple.predicate.value;
    if (/custom#|math#|string#|log#|type#|other#/.test(val)) {
      debugTrace('[tripleToString][DEBUG][BUILTIN] Predicate matches builtin pattern:', val, triple);
    }
  }
  const str = `${termToString(triple.subject)} ${termToString(triple.predicate)} ${termToString(triple.object)}`;
  debugTrace('tripleToString output:', str);
  return str;
}


export function stringToTriple(str: string): N3Triple {
  debugTrace('stringToTriple input:', str);
  const [subject, predicate, object] = str.split(' ');
  assert(!!subject && !!predicate && !!object, 'stringToTriple expects 3 parts', str);
  const triple = { subject, predicate, object };
  debugTrace('stringToTriple output:', triple);
  return triple;
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
