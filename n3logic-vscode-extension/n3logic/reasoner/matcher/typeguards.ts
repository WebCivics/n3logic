// matcher/typeguards.ts - Type guards for N3Term

import { N3Term } from '../../N3LogicTypes';
import { matcherDebug, matcherTrace } from './logging';

export function isN3Variable(term: N3Term): boolean {
  matcherTrace('isN3Variable called with:', term);
  const result = typeof term === 'object' && term !== null && 'type' in term && term.type === 'Variable' && 'value' in term;
  matcherDebug('isN3Variable result:', result, 'for term:', term);
  return result;
}

export function isN3IRI(term: N3Term): boolean {
  matcherTrace('isN3IRI called with:', term);
  const result = typeof term === 'object' && term !== null && 'type' in term && term.type === 'IRI' && 'value' in term;
  matcherDebug('isN3IRI result:', result, 'for term:', term);
  return result;
}
