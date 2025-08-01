import { LogicBuiltins } from '../../n3logic/builtins/N3LogicLogicBuiltins';
import { N3Term } from '../../n3logic/N3LogicTypes';

describe('LogicBuiltins', () => {
  // Helper for string literal
  const lit = (v: any) => ({ type: 'Literal', value: typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v) } as const);
  // Helper for RDF boolean literal
  const boolLit = (v: boolean) => ({ type: 'Literal', value: v ? 'true' : 'false' } as const);

  it('log:not returns true if argument is false', () => {
    const fn = LogicBuiltins.find(b => b.uri.includes('not'));
    expect(fn?.apply(lit(''))).toBe(true);
    expect(fn?.apply(lit(false))).toBe(true);
    expect(fn?.apply(lit('x'))).toBe(false);
  });

  it('log:equalTo returns true if values are equal', () => {
    const fn = LogicBuiltins.find(b => b.uri.includes('equalTo'));
    expect(fn?.apply(lit('a'), lit('a'))).toBe(true);
    expect(fn?.apply(lit('a'), lit('b'))).toBe(false);
  });

  it('log:or returns true if either is true (string and boolean cases)', () => {
    const fn = LogicBuiltins.find(b => b.uri.includes('or'));
    // String cases
    const cases = [
      { a: lit(''), b: lit('x'), expected: true },
      { a: lit('x'), b: lit(''), expected: true },
      { a: lit(''), b: lit(''), expected: false },
    ];
    cases.forEach(({ a, b, expected }, idx) => {
      const result = fn?.apply(a, b);
      // eslint-disable-next-line no-console
      console.log(`[TEST log:or string case #${idx}] a=`, a, 'b=', b, 'result=', result, 'expected=', expected);
      expect(result).toBe(expected);
    });
    // Boolean RDF literal cases
    const boolCases = [
      { a: boolLit(false), b: boolLit(true), expected: true },
      { a: boolLit(true), b: boolLit(false), expected: true },
      { a: boolLit(false), b: boolLit(false), expected: false },
      { a: boolLit(true), b: boolLit(true), expected: true },
    ];
    boolCases.forEach(({ a, b, expected }, idx) => {
      const result = fn?.apply(a, b);
      // eslint-disable-next-line no-console
      console.log(`[TEST log:or bool case #${idx}] a=`, a, 'b=', b, 'result=', result, 'expected=', expected);
      expect(result).toBe(expected);
    });
  });

  it('log:and returns true if both are true', () => {
    const fn = LogicBuiltins.find(b => b.uri.includes('and'));
    expect(fn?.apply(lit('x'), lit('y'))).toBe(true);
    expect(fn?.apply(lit('x'), lit(''))).toBe(false);
  });

  it('log:xor returns true if values differ', () => {
    const fn = LogicBuiltins.find(b => b.uri.includes('xor'));
    expect(fn?.apply(lit('x'), lit(''))).toBe(true);
    expect(fn?.apply(lit('x'), lit('x'))).toBe(false);
  });

  it('log:if returns then/else based on cond', () => {
    const fn = LogicBuiltins.find(b => b.uri.includes('if'));
    expect(fn?.apply(lit(true), lit('then'), lit('else'))).toEqual(lit('then'));
    expect(fn?.apply(lit(false), lit('then'), lit('else'))).toEqual(lit('else'));
  });

  it('log:distinct returns true if values differ', () => {
    const fn = LogicBuiltins.find(b => b.uri.includes('distinct'));
    expect(fn?.apply(lit('a'), lit('b'))).toBe(true);
    expect(fn?.apply(lit('a'), lit('a'))).toBe(false);
  });
});
