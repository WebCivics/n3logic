import { N3Builtin } from './N3LogicTypes';
import { getValue } from './N3LogicHelpers';

export const MathBuiltins: N3Builtin[] = [
  {
    uri: 'http://www.w3.org/2000/10/swap/math#greaterThan',
    arity: 2,
    description: 'math:greaterThan(x, y) is true if x > y',
    apply: (x, y) => Number(getValue(x)) > Number(getValue(y))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#lessThan',
    arity: 2,
    description: 'math:lessThan(x, y) is true if x < y',
    apply: (x, y) => Number(getValue(x)) < Number(getValue(y))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#equalTo',
    arity: 2,
    description: 'math:equalTo(x, y) is true if x == y',
    apply: (x, y) => getValue(x) == getValue(y)
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#notEqualTo',
    arity: 2,
    description: 'math:notEqualTo(x, y) is true if x != y',
    apply: (x, y) => getValue(x) != getValue(y)
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#sum',
    arity: 2,
    description: 'math:sum(x, y) returns x + y',
    apply: (x, y) => ({ type: 'Literal', value: String(Number(getValue(x)) + Number(getValue(y))) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#difference',
    arity: 2,
    description: 'math:difference(x, y) returns x - y',
    apply: (x, y) => ({ type: 'Literal', value: String(Number(getValue(x)) - Number(getValue(y))) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#product',
    arity: 2,
    description: 'math:product(x, y) returns x * y',
    apply: (x, y) => ({ type: 'Literal', value: String(Number(getValue(x)) * Number(getValue(y))) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#quotient',
    arity: 2,
    description: 'math:quotient(x, y) returns x / y',
    apply: (x, y) => ({ type: 'Literal', value: String(Number(getValue(x)) / Number(getValue(y))) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#greaterThanOrEqualTo',
    arity: 2,
    description: 'math:greaterThanOrEqualTo(x, y) is true if x >= y',
    apply: (x, y) => Number(getValue(x)) >= Number(getValue(y))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#lessThanOrEqualTo',
    arity: 2,
    description: 'math:lessThanOrEqualTo(x, y) is true if x <= y',
    apply: (x, y) => Number(getValue(x)) <= Number(getValue(y))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#abs',
    arity: 1,
    description: 'math:abs(x) returns the absolute value of x',
    apply: (x) => ({ type: 'Literal', value: String(Math.abs(Number(getValue(x)))) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#power',
    arity: 2,
    description: 'math:power(x, y) returns x^y',
    apply: (x, y) => ({ type: 'Literal', value: String(Math.pow(Number(getValue(x)), Number(getValue(y)))) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#modulo',
    arity: 2,
    description: 'math:modulo(x, y) returns x % y',
    apply: (x, y) => ({ type: 'Literal', value: String(Number(getValue(x)) % Number(getValue(y))) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#floor',
    arity: 1,
    description: 'math:floor(x) returns the largest integer <= x',
    apply: (x) => ({ type: 'Literal', value: String(Math.floor(Number(getValue(x)))) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#ceil',
    arity: 1,
    description: 'math:ceil(x) returns the smallest integer >= x',
    apply: (x) => ({ type: 'Literal', value: String(Math.ceil(Number(getValue(x)))) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#round',
    arity: 1,
    description: 'math:round(x) returns the nearest integer to x',
    apply: (x) => ({ type: 'Literal', value: String(Math.round(Number(getValue(x)))) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#negation',
    arity: 1,
    description: 'math:negation(x) returns -x',
    apply: (x) => ({ type: 'Literal', value: String(-Number(getValue(x))) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#integer',
    arity: 1,
    description: 'math:integer(x) is true if x is an integer',
    apply: (x) => Number.isInteger(Number(getValue(x)))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#decimal',
    arity: 1,
    description: 'math:decimal(x) is true if x is a decimal (not integer)',
    apply: (x) => !Number.isInteger(Number(getValue(x)))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#isFinite',
    arity: 1,
    description: 'math:isFinite(x) is true if x is a finite number',
    apply: (x) => isFinite(Number(getValue(x)))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/math#isNaN',
    arity: 1,
    description: 'math:isNaN(x) is true if x is NaN',
    apply: (x) => isNaN(Number(getValue(x)))
  }
];
