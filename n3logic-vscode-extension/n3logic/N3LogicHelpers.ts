import { N3Term } from './N3LogicTypes';
import { debugTrace, debugWarn, debugError } from './reasoner/debug';

function assert(condition: boolean, ...msg: any[]) {
  if (!condition) {
    debugError('Assertion failed:', ...msg);
    throw new Error('Assertion failed: ' + msg.map(String).join(' '));
  }
}

export function getValue(term: N3Term): any {
  debugTrace('[getValue] input:', JSON.stringify(term), 'type:', typeof term);
  if (typeof term === 'object' && term && 'value' in term) {
    debugTrace('[getValue] returning .value:', JSON.stringify(term.value), 'from:', JSON.stringify(term));
    return term.value;
  }
  if (typeof term === 'object' && term && 'elements' in term) {
    debugTrace('[getValue] returning .elements:', JSON.stringify(term.elements), 'from:', JSON.stringify(term));
    return term.elements;
  }
  debugTrace('[getValue] returning primitive:', JSON.stringify(term));
  return term;
}
