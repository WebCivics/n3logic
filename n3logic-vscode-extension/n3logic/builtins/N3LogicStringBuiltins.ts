import { N3Builtin } from './N3LogicTypes';
import { getValue } from './N3LogicHelpers';

export const StringBuiltins: N3Builtin[] = [
  {
    uri: 'http://www.w3.org/2000/10/swap/string#concatenation',
    arity: 2,
    description: 'string:concatenation(x, y) returns x + y',
    apply: (x, y) => String(getValue(x)) + String(getValue(y))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/string#contains',
    arity: 2,
    description: 'string:contains(x, y) is true if x contains y',
    apply: (x, y) => String(getValue(x)).includes(String(getValue(y)))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/string#startsWith',
    arity: 2,
    description: 'string:startsWith(x, y) is true if x starts with y',
    apply: (x, y) => String(getValue(x)).startsWith(String(getValue(y)))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/string#endsWith',
    arity: 2,
    description: 'string:endsWith(x, y) is true if x ends with y',
    apply: (x, y) => String(getValue(x)).endsWith(String(getValue(y)))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/string#substring',
    arity: 3,
    description: 'string:substring(s, start, len) returns substring',
    apply: (s, start, len) => {
      const str = String(getValue(s));
      return { type: 'Literal', value: str.substr(Number(getValue(start)), Number(getValue(len))) };
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/string#replace',
    arity: 3,
    description: 'string:replace(s, search, replace) returns s with search replaced by replace',
    apply: (s, search, replace) => {
      const str = String(getValue(s));
      return { type: 'Literal', value: str.replace(new RegExp(String(getValue(search)), 'g'), String(getValue(replace))) };
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/string#matches',
    arity: 2,
    description: 'string:matches(s, pattern) is true if s matches regex pattern',
    apply: (s, pattern) => new RegExp(String(getValue(pattern))).test(String(getValue(s)))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/string#length',
    arity: 1,
    description: 'string:length(s) returns the length of s',
    apply: (s) => ({ type: 'Literal', value: String(String(getValue(s)).length) })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/string#toLowerCase',
    arity: 1,
    description: 'string:toLowerCase(s) returns s in lower case',
    apply: (s) => ({ type: 'Literal', value: String(getValue(s)).toLowerCase() })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/string#toUpperCase',
    arity: 1,
    description: 'string:toUpperCase(s) returns s in upper case',
    apply: (s) => ({ type: 'Literal', value: String(getValue(s)).toUpperCase() })
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/string#trim',
    arity: 1,
    description: 'string:trim(s) returns s with whitespace trimmed',
    apply: (s) => ({ type: 'Literal', value: String(getValue(s)).trim() })
  }
];
