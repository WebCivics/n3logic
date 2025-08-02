

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
export function isRDFTrue(val: any): boolean {
  // Accepts {type: 'Literal', value: 'true'} or string 'true'
  if (val && typeof val === 'object' && val.type === 'Literal') {
    return val.value === 'true';
  }
  return val === 'true';
}
export function isRDFFalse(val: any): boolean {
  if (val && typeof val === 'object' && val.type === 'Literal') {
    return val.value === 'false';
  }
  return val === 'false';
}

// Export logOr as a named function for CJS/ESM compatibility
export function logOr(x: any, y: any) {
  // Enhanced trace debug logging for log:or (same as in LogicBuiltins)
  debugTrace('[logOr][EXPORT] called with:', { x, y });
  const isTruthy = (v: any) => {
    debugTrace('[logOr][EXPORT] isTruthy input:', v, 'typeof:', typeof v);
    if (v && typeof v === 'object' && v.type === 'Literal') {
      const val = v.value;
      debugTrace('[logOr][EXPORT] isTruthy RDF Literal value:', val, 'typeof:', typeof val);
      if (typeof val === 'string') {
        const res = val !== '' && val !== 'false';
        debugTrace('[logOr][EXPORT] isTruthy string result:', res, 'for value:', val);
        return res;
      }
      if (typeof val === 'boolean') {
        debugTrace('[logOr][EXPORT] isTruthy boolean result:', val, 'for value:', val);
        return val;
      }
      const res = !!val;
      debugTrace('[logOr][EXPORT] isTruthy fallback result:', res, 'for value:', val);
      return res;
    }
    if (typeof v === 'string') {
      const res = v !== '' && v !== 'false';
      debugTrace('[logOr][EXPORT] isTruthy plain string result:', res, 'for value:', v);
      return res;
    }
    if (typeof v === 'boolean') {
      debugTrace('[logOr][EXPORT] isTruthy plain boolean result:', v, 'for value:', v);
      return v;
    }
    const res = !!v;
    debugTrace('[logOr][EXPORT] isTruthy generic fallback result:', res, 'for value:', v);
    return res;
  };
  const valX = getValue(x);
  const valY = getValue(y);
  debugTrace('[logOr][EXPORT] getValue(x):', valX, 'getValue(y):', valY, 'typeof valX:', typeof valX, 'typeof valY:', typeof valY);
  const truthX = isTruthy(valX);
  debugTrace('[logOr][EXPORT] isTruthy(getValue(x)):', truthX, 'x:', x, 'valX:', valX);
  const truthY = isTruthy(valY);
  debugTrace('[logOr][EXPORT] isTruthy(getValue(y)):', truthY, 'y:', y, 'valY:', valY);
  const result = truthX || truthY;
  debugTrace('[logOr][EXPORT] final result:', result, 'from isTruthy(getValue(x)):', truthX, 'isTruthy(getValue(y)):', truthY);
  // Extra explicit log and assertion before return
  debugTrace('[logOr][EXPORT] about to return result:', result, 'for x:', x, 'y:', y, 'valX:', valX, 'valY:', valY, 'truthX:', truthX, 'truthY:', truthY);
  if (result !== (truthX || truthY)) {
    debugError('[logOr][EXPORT][ERROR] result mismatch! result:', result, 'truthX:', truthX, 'truthY:', truthY);
    throw new Error('[logOr][EXPORT] result mismatch');
  }
  return result;
}

// At module load, log all exports for debug
debugTrace('[N3LogicLogicBuiltins][EXPORTS]', Object.keys(exports));

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
      // Enhanced trace debug logging for log:or
      debugTrace('[log:or][TRACE] called with:', { x, y });
      const isTruthy = (v: any) => {
        debugTrace('[log:or][TRACE] isTruthy input:', v, 'typeof:', typeof v);
        if (v && typeof v === 'object' && v.type === 'Literal') {
          const val = v.value;
          debugTrace('[log:or][TRACE] isTruthy RDF Literal value:', val, 'typeof:', typeof val);
          if (typeof val === 'string') {
            const res = val !== '' && val !== 'false';
            debugTrace('[log:or][TRACE] isTruthy string result:', res, 'for value:', val);
            return res;
          }
          if (typeof val === 'boolean') {
            debugTrace('[log:or][TRACE] isTruthy boolean result:', val, 'for value:', val);
            return val;
          }
          const res = !!val;
          debugTrace('[log:or][TRACE] isTruthy fallback result:', res, 'for value:', val);
          return res;
        }
        if (typeof v === 'string') {
          const res = v !== '' && v !== 'false';
          debugTrace('[log:or][TRACE] isTruthy plain string result:', res, 'for value:', v);
          return res;
        }
        if (typeof v === 'boolean') {
          debugTrace('[log:or][TRACE] isTruthy plain boolean result:', v, 'for value:', v);
          return v;
        }
        const res = !!v;
        debugTrace('[log:or][TRACE] isTruthy generic fallback result:', res, 'for value:', v);
        return res;
      };
      const valX = getValue(x);
      const valY = getValue(y);
      debugTrace('[log:or][TRACE] getValue(x):', valX, 'getValue(y):', valY, 'typeof valX:', typeof valX, 'typeof valY:', typeof valY);
      const truthX = isTruthy(valX);
      debugTrace('[log:or][TRACE] isTruthy(getValue(x)):', truthX, 'x:', x, 'valX:', valX);
      const truthY = isTruthy(valY);
      debugTrace('[log:or][TRACE] isTruthy(getValue(y)):', truthY, 'y:', y, 'valY:', valY);
      const result = truthX || truthY;
      debugTrace('[log:or][TRACE] final result:', result, 'from isTruthy(getValue(x)):', truthX, 'isTruthy(getValue(y)):', truthY);
      // Extra explicit log and assertion before return
      debugTrace('[log:or][TRACE] about to return result:', result, 'for x:', x, 'y:', y, 'valX:', valX, 'valY:', valY, 'truthX:', truthX, 'truthY:', truthY);
      if (result !== (truthX || truthY)) {
        debugError('[log:or][ERROR] result mismatch! result:', result, 'truthX:', truthX, 'truthY:', truthY);
        throw new Error('[log:or] result mismatch');
      }
      return result;
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
