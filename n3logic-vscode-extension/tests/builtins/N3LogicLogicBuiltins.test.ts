import { LogicBuiltins } from '../../n3logic/builtins/N3LogicLogicBuiltins';
import { N3Term } from '../../n3logic/N3LogicTypes';

describe('LogicBuiltins', () => {
  const lit = (v: any) => ({ type: 'Literal', value: String(v) } as const);

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

  it('log:or returns true if either is true', () => {
    const fn = LogicBuiltins.find(b => b.uri.includes('or'));
    expect(fn?.apply(lit(''), lit('x'))).toBe(true);
    expect(fn?.apply(lit('x'), lit(''))).toBe(true);
    expect(fn?.apply(lit(''), lit(''))).toBe(false);
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
