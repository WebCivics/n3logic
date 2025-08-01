
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
      // Only empty string or 'false' (case-insensitive) is false; all other non-empty strings are true
      const isTruthy = (v: any, label: string) => {
        const val = getValue(v);
        let result;
        if (typeof val === 'string') {
          result = val.length > 0 && val.trim().toLowerCase() !== 'false';
        } else {
          result = Boolean(val);
        }
        // Debug output
        if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.log(`[log:or debug] isTruthy(${label}): type=`, typeof v, 'input=', v, 'getValue=', val, 'result=', result);
        }
        return result;
      };
      const resX = isTruthy(x, 'x');
      const resY = isTruthy(y, 'y');
      if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log(`[log:or debug] x:`, x, 'y:', y, 'isTruthy(x):', resX, 'isTruthy(y):', resY);
      }
      return resX || resY;
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
