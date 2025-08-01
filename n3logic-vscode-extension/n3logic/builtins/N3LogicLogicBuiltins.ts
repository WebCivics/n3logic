
import { N3Builtin } from '../N3LogicTypes';
import { getValue } from '../N3LogicHelpers';

// Helper: strict RDF boolean check
function isRDFTrue(val: any): boolean {
  // Accepts {type: 'Literal', value: 'true'} or string 'true'
  if (val && typeof val === 'object' && val.type === 'Literal') {
    return val.value === 'true';
  }
  return val === 'true';
}
function isRDFFalse(val: any): boolean {
  if (val && typeof val === 'object' && val.type === 'Literal') {
    return val.value === 'false';
  }
  return val === 'false';
}

export const LogicBuiltins: N3Builtin[] = [
  {
    uri: 'http://www.w3.org/2000/10/swap/log#not',
    arity: 1,
    description: 'log:not(x) is true if x is false',
  apply: (x: any) => !getValue(x) || getValue(x) === 'false'
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#implies',
    arity: 2,
    description: 'log:implies(x, y) is true if x implies y (handled by rule engine)',
  apply: (_x: any, _y: any) => true
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#equalTo',
    arity: 2,
    description: 'log:equalTo(x, y) is true if x === y',
  apply: (x: any, y: any) => getValue(x) === getValue(y)
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#or',
    arity: 2,
    description: 'log:or(x, y) is true if x or y is true',
    apply: (x: any, y: any) => {
      // Returns true if either argument is a literal with a non-empty string value
      const isTruthy = (v: any) => v && v.type === 'Literal' && typeof v.value === 'string' && v.value.length > 0;
      return isTruthy(x) || isTruthy(y);
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#and',
    arity: 2,
    description: 'log:and(x, y) is true if both x and y are true',
  apply: (x: any, y: any) => Boolean(getValue(x)) && Boolean(getValue(y))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#xor',
    arity: 2,
    description: 'log:xor(x, y) is true if x and y differ',
  apply: (x: any, y: any) => Boolean(getValue(x)) !== Boolean(getValue(y))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#if',
    arity: 3,
    description: 'log:if(cond, then, else) returns then if cond is true, else else',
    apply: (cond: any, thenVal: any, elseVal: any) => {
      const v = getValue(cond);
      return v && v !== 'false' ? thenVal : elseVal;
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#distinct',
    arity: 2,
    description: 'log:distinct(x, y) is true if x != y',
  apply: (x: any, y: any) => getValue(x) !== getValue(y)
  }
];
