// matcher/tripleMatch.ts - Triple matching logic
import { N3Triple, N3Term } from '../../N3LogicTypes';
import { matcherDebug } from './logging';

export function termEquals(a: N3Term, b: N3Term): boolean {
  // Simple deep equality for N3Term
  return JSON.stringify(a) === JSON.stringify(b);
}

export function matchTriple(
  pattern: N3Triple,
  triple: N3Triple,
  termMatch: (a: N3Term, b: N3Term, bindings: Record<string, N3Term>) => boolean,
  traceId?: string
): Record<string, N3Term> | null {
  const bindings: Record<string, N3Term> = {};
  if (!termMatch(pattern.subject, triple.subject, bindings)) return null;
  if (!termMatch(pattern.predicate, triple.predicate, bindings)) return null;
  if (!termMatch(pattern.object, triple.object, bindings)) return null;
  if (traceId) {
    matcherDebug(`[${traceId}] matchTriple: matched`, pattern, triple, bindings);
  } else {
    matcherDebug('matchTriple: matched', pattern, triple, bindings);
  }
  return bindings;
}

export function termMatch(pattern: N3Term, value: N3Term, bindings: Record<string, N3Term>): boolean {
  if (typeof pattern === 'object' && pattern && 'type' in pattern && pattern.type === 'Variable') {
    const varName = pattern.value;
    if (varName in bindings) {
      return termEquals(bindings[varName], value);
    } else {
      bindings[varName] = value;
      return true;
    }
  } else {
    return termEquals(pattern, value);
  }
}
