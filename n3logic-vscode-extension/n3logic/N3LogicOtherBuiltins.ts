import { N3Builtin } from './N3LogicTypes';
import { getValue } from './N3LogicHelpers';

export const OtherBuiltins: N3Builtin[] = [
  {
    uri: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    arity: 2,
    description: 'rdf:type(x, y) is true if x is of type y (handled by triple matching)',
    apply: () => true
  },
  {
    uri: 'http://www.w3.org/2002/07/owl#sameAs',
    arity: 2,
    description: 'owl:sameAs(x, y) is true if x and y are the same',
    apply: (x, y) => getValue(x) === getValue(y)
  }
];
