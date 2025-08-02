import { N3Term } from '../../N3LogicTypes';
import { matcherDebug } from '../matcher/logging';

export function normalizeBindings(bindings: Record<string, N3Term>): Record<string, N3Term> {
  matcherDebug('normalizeBindings called with:', JSON.stringify(bindings));
  const out: Record<string, N3Term> = {};
  for (const k in bindings) {
    const v = bindings[k];
    if (typeof v === 'string' && /^".*"$/.test(v)) {
      out[k] = { type: 'Literal', value: JSON.parse(v) };
      matcherDebug(`normalizeBindings: variable ${k} bound to quoted string, treating as Literal:`, v);
    } else if (typeof v === 'object' && v !== null && v.type === 'IRI' && typeof v.value === 'string' && /^".*"$/.test(v.value)) {
      out[k] = { type: 'Literal', value: JSON.parse(v.value) };
      matcherDebug(`normalizeBindings: variable ${k} bound to IRI with quoted string value, treating as Literal:`, v.value);
    } else {
      out[k] = v;
      matcherDebug(`normalizeBindings: variable ${k} bound to:`, v);
    }
  }
  matcherDebug('normalizeBindings result:', JSON.stringify(out));
  return out;
}
