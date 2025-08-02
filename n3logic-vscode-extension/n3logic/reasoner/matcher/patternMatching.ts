// matcher/patternMatching.ts - Pattern and data triple matching helpers
import { N3Triple, N3Term, N3Builtin } from '../../N3LogicTypes';
import { isN3Variable } from './typeguards';
import { matcherDebug } from './logging';

export function resolveSubjectVals(triple: N3Triple, restBindings: Record<string, N3Term>, data: N3Triple[]): { vals: N3Term[], varName?: string } {
  if (isN3Variable(triple.subject) && typeof triple.subject === 'object' && 'value' in triple.subject) {
    const subjVar = triple.subject.value;
    if (restBindings.hasOwnProperty(subjVar)) {
      matcherDebug('Subject is variable, using bound value:', restBindings[subjVar]);
      return { vals: [restBindings[subjVar]], varName: subjVar };
    } else {
      const vals = Array.from(new Set(data.map((t) => JSON.stringify(t.subject)))).map((s) => JSON.parse(s));
      matcherDebug('Subject variable', subjVar, 'not bound, trying all possible values from data:', vals);
      return { vals, varName: subjVar };
    }
  } else {
    return { vals: [triple.subject] };
  }
}

export function resolveObjectVals(triple: N3Triple, restBindings: Record<string, N3Term>, data: N3Triple[]): { vals: N3Term[], varName?: string } {
  if (isN3Variable(triple.object) && typeof triple.object === 'object' && 'value' in triple.object) {
    const objVar = triple.object.value;
    if (restBindings.hasOwnProperty(objVar)) {
      matcherDebug('Object is variable, using bound value:', restBindings[objVar]);
      return { vals: [restBindings[objVar]], varName: objVar };
    } else {
      const vals = Array.from(new Set(data.map((t) => JSON.stringify(t.object)))).map((s) => JSON.parse(s));
      matcherDebug('Object variable', objVar, 'not bound, trying all possible values from data:', vals);
      return { vals, varName: objVar };
    }
  } else {
    return { vals: [triple.object] };
  }
}
