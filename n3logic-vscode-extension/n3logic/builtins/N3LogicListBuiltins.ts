import { N3Builtin } from './N3LogicTypes';
import { getValue } from './N3LogicHelpers';

export const ListBuiltins: N3Builtin[] = [
  {
    uri: 'http://www.w3.org/2000/10/swap/list#length',
    arity: 2,
    description: 'list:length(list, n) is true if list has length n',
    apply: (list, n) => {
      if (typeof list !== 'object' || !('type' in list) || list.type !== 'List' || !Array.isArray(list.elements)) {
        throw new TypeError('list:length: First argument must be a List term');
      }
      return list.elements.length === Number(getValue(n));
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/list#contains',
    arity: 2,
    description: 'list:contains(list, x) is true if list contains x',
    apply: (list, x) => {
      if (typeof list !== 'object' || !('type' in list) || list.type !== 'List' || !Array.isArray(list.elements)) {
        throw new TypeError('list:contains: First argument must be a List term');
      }
      return list.elements.some(e => getValue(e) === getValue(x));
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/list#first',
    arity: 2,
    description: 'list:first(list, x) is true if x is the first element',
    apply: (list, x) => {
      if (typeof list === 'object' && 'type' in list && list.type === 'List' && Array.isArray(list.elements)) {
        return list.elements.length > 0 && getValue(list.elements[0]) === getValue(x);
      }
      return false;
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/list#rest',
    arity: 2,
    description: 'list:rest(list, rest) returns the rest of the list after the first element',
    apply: (list, rest) => {
      if (typeof list === 'object' && 'type' in list && list.type === 'List' && Array.isArray(list.elements)) {
        return { type: 'List', elements: list.elements.slice(1) };
      }
      return false;
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/list#append',
    arity: 2,
    description: 'list:append(list, x) returns a new list with x appended',
    apply: (list, x) => {
      if (typeof list === 'object' && 'type' in list && list.type === 'List' && Array.isArray(list.elements)) {
        return { type: 'List', elements: [...list.elements, x] };
      }
      return false;
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/list#remove',
    arity: 2,
    description: 'list:remove(list, x) returns a new list with x removed',
    apply: (list, x) => {
      if (typeof list === 'object' && 'type' in list && list.type === 'List' && Array.isArray(list.elements)) {
        return { type: 'List', elements: list.elements.filter(e => getValue(e) !== getValue(x)) };
      }
      return false;
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/list#reverse',
    arity: 1,
    description: 'list:reverse(list) returns a new list with elements reversed',
    apply: (list) => {
      if (typeof list === 'object' && 'type' in list && list.type === 'List' && Array.isArray(list.elements)) {
        return { type: 'List', elements: [...list.elements].reverse() };
      }
      return false;
    }
  }
];
