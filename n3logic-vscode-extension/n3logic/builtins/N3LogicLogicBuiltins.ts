

import { N3Builtin } from '../N3LogicTypes';
import { getValue } from '../N3LogicHelpers';
import { debugTrace, debugWarn, debugError } from '../reasoner/debug';

function assert(condition: boolean, ...msg: any[]) {
  if (!condition) {
    debugError('Assertion failed:', ...msg);
    throw new Error('Assertion failed: ' + msg.map(String).join(' '));
  }
}

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
  apply: (x: any) => {
    debugTrace('[log:not] input:', x, 'type:', typeof x, 'getValue:', getValue(x));
    const result = !getValue(x) || getValue(x) === 'false';
    debugTrace('[log:not] output:', result);
    return result;
  }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#implies',
    arity: 2,
    description: 'log:implies(x, y) is true if x implies y (handled by rule engine)',
  apply: (_x: any, _y: any) => {
    debugTrace('[log:implies] input:', _x, _y);
    return true;
  }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#equalTo',
    arity: 2,
    description: 'log:equalTo(x, y) is true if x === y',
  apply: (x: any, y: any) => {
    debugTrace('[log:equalTo] input:', x, y, 'getValue:', getValue(x), getValue(y));
    const result = getValue(x) === getValue(y);
    debugTrace('[log:equalTo] output:', result);
    return result;
  }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#or',
    arity: 2,
    description: 'log:or(x, y) is true if x or y is true',
    apply: (x: any, y: any) => {
      debugTrace('[log:or] input:', x, y, 'getValue(x):', getValue(x), 'getValue(y):', getValue(y), 'typeof x:', typeof x, 'typeof y:', typeof y);
      function isTruthy(v: any): boolean {
        const val = getValue(v);
        debugTrace('[log:or][isTruthy] called with:', v, 'getValue:', val, 'typeof:', typeof val);
        // Treat RDF boolean literals strictly
        if (typeof val === 'string') {
          if (val === 'true') return true;
          if (val === 'false') return false;
          // Any other non-empty string is truthy
          return val.length > 0;
        }
        if (typeof val === 'boolean') {
          return val;
        }
        if (typeof val === 'number') {
          return val !== 0;
        }
        // Fallback: treat as falsy only if null/undefined/empty
        return !!val;
      }
      const truthyX = isTruthy(x);
      const truthyY = isTruthy(y);
      debugTrace('[log:or] isTruthy(x):', truthyX, 'isTruthy(y):', truthyY, 'x:', x, 'y:', y);
      const result = truthyX || truthyY;
      debugTrace('[log:or] output:', result);
      return result;
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#and',
    arity: 2,
    description: 'log:and(x, y) is true if both x and y are true',
  apply: (x: any, y: any) => {
    debugTrace('[log:and] input:', x, y, 'getValue:', getValue(x), getValue(y));
    const result = Boolean(getValue(x)) && Boolean(getValue(y));
    debugTrace('[log:and] output:', result);
    return result;
  }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#xor',
    arity: 2,
    description: 'log:xor(x, y) is true if x and y differ',
  apply: (x: any, y: any) => {
    debugTrace('[log:xor] input:', x, y, 'getValue:', getValue(x), getValue(y));
    const result = Boolean(getValue(x)) !== Boolean(getValue(y));
    debugTrace('[log:xor] output:', result);
    return result;
  }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#if',
    arity: 3,
    description: 'log:if(cond, then, else) returns then if cond is true, else else',
    apply: (cond: any, thenVal: any, elseVal: any) => {
      debugTrace('[log:if] input:', cond, thenVal, elseVal, 'getValue:', getValue(cond));
      const v = getValue(cond);
      const result = v && v !== 'false' ? thenVal : elseVal;
      debugTrace('[log:if] output:', result);
      return result;
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#distinct',
    arity: 2,
    description: 'log:distinct(x, y) is true if x != y',
  apply: (x: any, y: any) => {
    debugTrace('[log:distinct] input:', x, y, 'getValue:', getValue(x), getValue(y));
    const result = getValue(x) !== getValue(y);
    debugTrace('[log:distinct] output:', result);
    return result;
  }
  }
];
