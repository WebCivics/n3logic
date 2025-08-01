import { N3Term } from './N3LogicTypes';
import { debugTrace, debugWarn, debugError } from './reasoner/debug';

function assert(condition: boolean, ...msg: any[]) {
  if (!condition) {
    debugError('Assertion failed:', ...msg);
    throw new Error('Assertion failed: ' + msg.map(String).join(' '));
  }
}

export function getValue(term: N3Term): any {
  debugTrace('getValue input:', term);
  if (typeof term === 'object' && term && 'value' in term) {
    debugTrace('getValue: returning .value', term.value);
    return term.value;
  }
  if (typeof term === 'object' && term && 'elements' in term) {
    debugTrace('getValue: returning .elements', term.elements);
    return term.elements;
  }
  debugTrace('getValue: returning primitive', term);
  return term;
}
