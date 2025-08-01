// Triple and term utilities for N3LogicReasoner
import { N3Triple, N3Term } from '../N3LogicTypes';
import { N3LogicParser } from '../N3LogicParser';

export function tripleToString(triple: N3Triple): string {
  return `${termToString(triple.subject)} ${termToString(triple.predicate)} ${termToString(triple.object)}`;
}

export function stringToTriple(str: string): N3Triple {
  const parser = new N3LogicParser();
  const [s, p, o] = str.split(' ');
  return {
    subject: parser['parseTerm'](s),
    predicate: parser['parseTerm'](p),
    object: parser['parseTerm'](o)
  };
}

export function termToString(term: N3Term): string {
  if (typeof term === 'string') return term;
  if ('type' in term && term.type === 'Literal') {
    return '"' + term.value + '"';
  }
  if ('value' in term) return term.value;
  return '';
}

export function termEquals(a: N3Term, b: N3Term): boolean {
  if (typeof a !== typeof b) return false;
  if (typeof a === 'object' && typeof b === 'object') {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return a === b;
}
