import { N3Term } from './N3LogicTypes';

export function getValue(term: N3Term): any {
  if (typeof term === 'object' && 'value' in term) return term.value;
  if (typeof term === 'object' && 'elements' in term) return term.elements;
  return term;
}
