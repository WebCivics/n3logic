// Builtins management for N3LogicReasoner
import { LogicBuiltins } from '../builtins/N3LogicLogicBuiltins';
import { TypeBuiltins } from '../builtins/N3LogicTypeBuiltins';
import { OtherBuiltins } from '../builtins/N3LogicOtherBuiltins';
import { N3Builtin } from '../N3LogicTypes';
import { debugTrace } from './debug';

export function mergeBuiltins(customBuiltins: N3Builtin[]): N3Builtin[] {
  // Custom builtins should override standard ones if URIs clash
  const allStandard = [...LogicBuiltins, ...TypeBuiltins, ...OtherBuiltins];
  const customUris = new Set(customBuiltins.map(b => b.uri));
  const filteredStandard = allStandard.filter(b => !customUris.has(b.uri));
  const merged = [
    ...customBuiltins,
    ...filteredStandard
  ];
  debugTrace && debugTrace('[builtinsManager] mergeBuiltins called:', customBuiltins, 'Resulting merged builtins:', merged.map((b) => ({ uri: b.uri, apply: b.apply, typeofApply: typeof b.apply })));
  return merged;
}
