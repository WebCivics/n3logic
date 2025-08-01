import { TimeBuiltins } from '../../n3logic/builtins/N3LogicTimeBuiltins';
import { N3Term } from '../../n3logic/N3LogicTypes';

describe('TimeBuiltins', () => {
  const lit = (v: any) => ({ type: 'Literal', value: String(v) } as const);
  const nowIso = new Date().toISOString();

  it('time:now returns true if argument matches current ISO string', () => {
    const fn = TimeBuiltins.find(b => b.uri.includes('now'));
    expect(fn?.apply(lit(nowIso))).toBe(true);
    expect(fn?.apply(lit('notnow'))).toBe(false);
  });

  it('time:before and after', () => {
    const fnBefore = TimeBuiltins.find(b => b.uri.includes('before'));
    const fnAfter = TimeBuiltins.find(b => b.uri.includes('after'));
    expect(fnBefore?.apply(lit('2020-01-01'), lit('2025-01-01'))).toBe(true);
    expect(fnAfter?.apply(lit('2025-01-01'), lit('2020-01-01'))).toBe(true);
  });

  it('time:duration returns true if duration matches', () => {
    const fn = TimeBuiltins.find(b => b.uri.includes('duration'));
    const a = '2020-01-01T00:00:00.000Z';
    const b = '2020-01-02T00:00:00.000Z';
    const ms = 24 * 60 * 60 * 1000;
    expect(fn?.apply(lit(a), lit(b), lit(ms))).toBe(true);
  });

  it('time:hour, minute, second, year, month, day', () => {
    const d = new Date('2025-08-01T12:34:56.000Z');
    const fnHour = TimeBuiltins.find(b => b.uri.includes('hour'));
    const fnMinute = TimeBuiltins.find(b => b.uri.includes('minute'));
    const fnSecond = TimeBuiltins.find(b => b.uri.includes('second'));
    const fnYear = TimeBuiltins.find(b => b.uri.includes('year'));
    const fnMonth = TimeBuiltins.find(b => b.uri.includes('month'));
    const fnDay = TimeBuiltins.find(b => b.uri.includes('day'));
    expect(fnHour?.apply(lit(d.toISOString()), lit(d.getUTCHours()))).toBe(true);
    expect(fnMinute?.apply(lit(d.toISOString()), lit(d.getUTCMinutes()))).toBe(true);
    expect(fnSecond?.apply(lit(d.toISOString()), lit(d.getUTCSeconds()))).toBe(true);
    expect(fnYear?.apply(lit(d.toISOString()), lit(d.getUTCFullYear()))).toBe(true);
    expect(fnMonth?.apply(lit(d.toISOString()), lit(d.getUTCMonth() + 1))).toBe(true);
    expect(fnDay?.apply(lit(d.toISOString()), lit(d.getUTCDate()))).toBe(true);
  });
});
