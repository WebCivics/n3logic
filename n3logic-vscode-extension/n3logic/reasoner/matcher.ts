import { N3Triple, N3Term, N3Builtin } from '../N3LogicTypes';
import { matcherDebug, matcherTrace, matcherWarn, matcherError, logPatternsAndData } from './matcher/logging';
import { findBuiltinForPredicate, invokeBuiltin } from './matcher/builtins';
import { isN3Variable, isN3IRI } from './matcher/typeguards';
import { tripleToString as tripleToN3 } from './tripleUtils';
import { resolveSubjectVals, resolveObjectVals } from './matcher/patternMatching';
import { matchTriple, termMatch } from './matcher/tripleMatch';
export { matchAntecedent } from './matcher/matchAntecedent';
import { normalizeBindings } from './matcher/normalizeBindings';

export { tripleToN3 };

export function instantiateTriple(triple: N3Triple, bindings: Record<string, N3Term>): N3Triple {
  const resolve = (term: N3Term) => {
    if (typeof term === 'object' && term !== null && term.type === 'Variable' && term.value in bindings) {
      return bindings[term.value];
    }
    return term;
  };
  return {
    subject: resolve(triple.subject),
    predicate: resolve(triple.predicate),
    object: resolve(triple.object),
  };
}

export function matchFormula(
  formula: { triples: N3Triple[] },
  data: N3Triple[],
  matcher: (patterns: N3Triple[], data: N3Triple[], builtins: N3Builtin[], traceId?: string) => Array<Record<string, N3Term>>,
  builtins: N3Builtin[] = [],
  traceId?: string
): Array<Record<string, N3Term>> {
  return matcher(formula.triples, data, builtins, traceId);
}
