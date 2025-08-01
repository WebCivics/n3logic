import { N3Builtin } from './N3LogicTypes';
import { getValue } from './N3LogicHelpers';

export const LogicBuiltins: N3Builtin[] = [
  {
    uri: 'http://www.w3.org/2000/10/swap/log#not',
    arity: 1,
    description: 'log:not(x) is true if x is false',
    apply: (x) => !getValue(x)
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#implies',
    arity: 2,
    description: 'log:implies(x, y) is true if x implies y (handled by rule engine)',
    apply: () => true
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#equalTo',
    arity: 2,
    description: 'log:equalTo(x, y) is true if x === y',
    apply: (x, y) => getValue(x) === getValue(y)
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#or',
    arity: 2,
    description: 'log:or(x, y) is true if x or y is true',
    apply: (x, y) => Boolean(getValue(x)) || Boolean(getValue(y))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#and',
    arity: 2,
    description: 'log:and(x, y) is true if both x and y are true',
    apply: (x, y) => Boolean(getValue(x)) && Boolean(getValue(y))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#xor',
    arity: 2,
    description: 'log:xor(x, y) is true if x and y differ',
    apply: (x, y) => Boolean(getValue(x)) !== Boolean(getValue(y))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#if',
    arity: 3,
    description: 'log:if(cond, then, else) returns then if cond is true, else else',
    apply: (cond, thenVal, elseVal) => Boolean(getValue(cond)) ? thenVal : elseVal
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#distinct',
    arity: 2,
    description: 'log:distinct(x, y) is true if x != y',
    apply: (x, y) => getValue(x) !== getValue(y)
  }
];
