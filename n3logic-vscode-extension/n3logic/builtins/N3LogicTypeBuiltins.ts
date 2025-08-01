import { N3Builtin } from '../N3LogicTypes';
import { getValue } from '../N3LogicHelpers';

export const TypeBuiltins: N3Builtin[] = [
  {
    uri: 'http://www.w3.org/2000/10/swap/type#isLiteral',
    arity: 1,
    description: 'type:isLiteral(x) is true if x is a literal',
  apply: (x: any) => typeof x === 'object' && 'type' in x && x.type === 'Literal',
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/type#isIRI',
    arity: 1,
    description: 'type:isIRI(x) is true if x is an IRI',
  apply: (x: any) => typeof x === 'object' && 'type' in x && x.type === 'IRI',
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/type#isBlank',
    arity: 1,
    description: 'type:isBlank(x) is true if x is a blank node',
  apply: (x: any) => typeof x === 'object' && 'type' in x && x.type === 'BlankNode',
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/type#toString',
    arity: 1,
    description: 'type:toString(x) returns x as string',
  apply: (x: any) => ({ type: 'Literal', value: String(getValue(x)) }),
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/type#toNumber',
    arity: 1,
    description: 'type:toNumber(x) returns x as number literal',
  apply: (x: any) => ({ type: 'Literal', value: String(Number(getValue(x))) }),
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/type#toBoolean',
    arity: 1,
    description: 'type:toBoolean(x) returns x as boolean literal',
  apply: (x: any) => ({ type: 'Literal', value: String(Boolean(getValue(x))) }),
  },
];
