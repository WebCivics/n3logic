// Builtins management for N3LogicReasoner
import { TypeBuiltins } from '../builtins/N3LogicTypeBuiltins';
import { OtherBuiltins } from '../builtins/N3LogicOtherBuiltins';
import { N3Builtin } from '../N3LogicTypes';
import { debugTrace } from './debug';

export function mergeBuiltins(customBuiltins: N3Builtin[]): N3Builtin[] {
  debugTrace && debugTrace('[builtinsManager] mergeBuiltins called:', customBuiltins);
  return [
    ...TypeBuiltins,
    ...OtherBuiltins,
    ...customBuiltins
  ];
}
