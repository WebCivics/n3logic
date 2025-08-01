

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
  // (Removed broken duplicate log:or entry)
  {
    uri: 'http://www.w3.org/2000/10/swap/log#not',
    arity: 1,
    description: 'log:not(x) is true if x is false',
    apply: (x: any) => {
      debugTrace('[log:not] input:', x, 'getValue:', getValue(x));
      const v = getValue(x);
      // Accepts RDF boolean literal or string
      const result = isRDFFalse(x) || v === '' || v === false;
      debugTrace('[log:not] output:', result);
      return result;
    },
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#implies',
    arity: 2,
    description: 'log:implies(x, y) is true if x implies y (handled by rule engine)',
  apply: (_x: any, _y: any) => {
    debugTrace('[log:implies] input:', _x, _y);
    return true;
  },
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#equalTo',
    arity: 2,
    description: 'log:equalTo(x, y) is true if x === y',
  apply: (x: any, y: any) => {
  // Mutation detection: deep clone arguments at entry
  const origX = JSON.parse(JSON.stringify(x));
  const origY = JSON.parse(JSON.stringify(y));
    debugTrace('[log:equalTo] input:', x, y, 'getValue:', getValue(x), getValue(y));
    const result = getValue(x) === getValue(y);
    debugTrace('[log:equalTo] output:', result);
    return result;
  },
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/log#or',
    arity: 2,
    description: 'log:or(x, y) is true if x or y is true',
    apply: (x: any, y: any) => {
      debugTrace('[log:or][APPLY][UNMISTAKABLE] log:or builtin apply function INVOKED! Args:', { x, y, typeofX: typeof x, typeofY: typeof y, getValueX: getValue(x), getValueY: getValue(y) });
      debugTrace('[log:or][TOP-ENTRY] called with:', { x, y, typeofX: typeof x, typeofY: typeof y, getValueX: getValue(x), getValueY: getValue(y) });
      // Treat any non-empty, non-'false' literal as true (string or boolean)
      const isTruthy = (v: any) => {
        debugTrace('[log:or][isTruthy][ENTRY] arg:', v, 'typeof:', typeof v, 'getValue:', getValue(v));
        const val = getValue(v);
        let result: boolean;
        if (isRDFTrue(v)) {
          debugTrace('[log:or][isTruthy] Detected RDF true for', v);
          result = true;
        } else if (isRDFFalse(v)) {
          debugTrace('[log:or][isTruthy] Detected RDF false for', v);
          result = false;
        } else if (typeof val === 'string') {
          // Non-empty string is true
          result = val.length > 0;
          debugTrace('[log:or][isTruthy] String check for', v, 'getValue:', val, 'result:', result);
        } else {
          // Fallback: treat all non-false, non-null, non-undefined as true
          result = val !== false && val !== null && val !== undefined;
          debugTrace('[log:or][isTruthy] Fallback check for', v, 'getValue:', val, 'result:', result);
        }
        debugTrace('[log:or][isTruthy][EXIT] arg:', v, 'type:', typeof v, 'getValue:', val, 'result:', result);
        return result;
      };
      debugTrace('[log:or][PRE-EVAL] about to call isTruthy for x and y');
      const xTrue = isTruthy(x);
      const yTrue = isTruthy(y);
      debugTrace('[log:or][EVAL] isTruthy(x):', xTrue, 'isTruthy(y):', yTrue, 'x:', x, 'y:', y);
      let result;
      if (xTrue || yTrue) {
        result = true;
        debugTrace('[log:or][RESULT] At least one operand is true. Returning true.', { x, y, xTrue, yTrue });
        debugTrace('[log:or][EXIT] result:', result);
        return result;
      } else {
        result = false;
        debugWarn('[log:or][RESULT] Both operands are falsey. Returning false.', { x, y, xTrue, yTrue, getValueX: getValue(x), getValueY: getValue(y) });
        debugTrace('[log:or][EXIT] result:', result);
        return result;
      }
    },
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
  },
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
  },
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
    },
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
  },
  },
];
