import { N3Builtin } from './N3LogicTypes';
import { getValue } from './N3LogicHelpers';

export const TimeBuiltins: N3Builtin[] = [
  {
    uri: 'http://www.w3.org/2000/10/swap/time#now',
    arity: 1,
    description: 'time:now(x) is true if x is the current ISO date string',
    apply: (x) => String(getValue(x)) === new Date().toISOString()
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/time#before',
    arity: 2,
    description: 'time:before(a, b) is true if a < b (date)',
    apply: (a, b) => new Date(getValue(a)) < new Date(getValue(b))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/time#after',
    arity: 2,
    description: 'time:after(a, b) is true if a > b (date)',
    apply: (a, b) => new Date(getValue(a)) > new Date(getValue(b))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/time#duration',
    arity: 3,
    description: 'time:duration(a, b, d) is true if d is the difference in ms between a and b',
    apply: (a, b, d) => Number(getValue(d)) === Math.abs(new Date(getValue(a)).getTime() - new Date(getValue(b)).getTime())
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/time#hour',
    arity: 2,
    description: 'time:hour(date, h) is true if date has hour h',
    apply: (date, h) => new Date(getValue(date)).getHours() === Number(getValue(h))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/time#minute',
    arity: 2,
    description: 'time:minute(date, m) is true if date has minute m',
    apply: (date, m) => new Date(getValue(date)).getMinutes() === Number(getValue(m))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/time#second',
    arity: 2,
    description: 'time:second(date, s) is true if date has second s',
    apply: (date, s) => new Date(getValue(date)).getSeconds() === Number(getValue(s))
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/time#year',
    arity: 2,
    description: 'time:year(date, y) is true if date has year y',
    apply: (date, y) => {
      const d = new Date(getValue(date));
      return d.getFullYear() === Number(getValue(y));
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/time#month',
    arity: 2,
    description: 'time:month(date, m) is true if date has month m (1-12)',
    apply: (date, m) => {
      const d = new Date(getValue(date));
      return d.getMonth() + 1 === Number(getValue(m));
    }
  },
  {
    uri: 'http://www.w3.org/2000/10/swap/time#day',
    arity: 2,
    description: 'time:day(date, d) is true if date has day d',
    apply: (date, d) => {
      const dt = new Date(getValue(date));
      return dt.getDate() === Number(getValue(d));
    }
  }
];
