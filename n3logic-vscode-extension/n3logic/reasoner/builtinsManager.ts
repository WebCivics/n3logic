// Builtins management for N3LogicReasoner
import { TypeBuiltins } from '../builtins/N3LogicTypeBuiltins';
import { OtherBuiltins } from '../builtins/N3LogicOtherBuiltins';
import { N3Builtin } from '../N3LogicTypes';

export function mergeBuiltins(customBuiltins: N3Builtin[]): N3Builtin[] {
  return [
    ...TypeBuiltins,
    ...OtherBuiltins,
    ...customBuiltins
  ];
}
