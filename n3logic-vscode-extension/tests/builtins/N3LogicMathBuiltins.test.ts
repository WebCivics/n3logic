import { MathBuiltins } from '../../n3logic/builtins/N3LogicMathBuiltins';
import { N3Term } from '../../n3logic/N3LogicTypes';

describe('MathBuiltins', () => {
  const lit = (v: any) => ({ type: 'Literal', value: String(v) } as const);

  it('math:greaterThan and lessThan', () => {
    const gt = MathBuiltins.find(b => b.uri.includes('greaterThan'));
    const lt = MathBuiltins.find(b => b.uri.includes('lessThan'));
    expect(gt?.apply(lit(3), lit(2))).toBe(true);
    expect(gt?.apply(lit(2), lit(3))).toBe(false);
    expect(lt?.apply(lit(2), lit(3))).toBe(true);
    expect(lt?.apply(lit(3), lit(2))).toBe(false);
  });

  it('math:equalTo and notEqualTo', () => {
    const eq = MathBuiltins.find(b => b.uri.includes('equalTo'));
    const neq = MathBuiltins.find(b => b.uri.includes('notEqualTo'));
    expect(eq?.apply(lit(2), lit('2'))).toBe(true);
    expect(neq?.apply(lit(2), lit(3))).toBe(true);
  });

  it('math:sum, difference, product, quotient', () => {
    const sum = MathBuiltins.find(b => b.uri.includes('sum'));
    const diff = MathBuiltins.find(b => b.uri.includes('difference'));
    const prod = MathBuiltins.find(b => b.uri.includes('product'));
    const quot = MathBuiltins.find(b => b.uri.includes('quotient'));
    expect(sum?.apply(lit(2), lit(3))).toEqual(lit(5));
    expect(diff?.apply(lit(5), lit(3))).toEqual(lit(2));
    expect(prod?.apply(lit(2), lit(3))).toEqual(lit(6));
    expect(quot?.apply(lit(6), lit(3))).toEqual(lit(2));
  });

  it('math:abs, power, modulo, floor, ceil, round, negation', () => {
    const abs = MathBuiltins.find(b => b.uri.includes('abs'));
    const pow = MathBuiltins.find(b => b.uri.includes('power'));
    const mod = MathBuiltins.find(b => b.uri.includes('modulo'));
    const floor = MathBuiltins.find(b => b.uri.includes('floor'));
    const ceil = MathBuiltins.find(b => b.uri.includes('ceil'));
    const round = MathBuiltins.find(b => b.uri.includes('round'));
    const neg = MathBuiltins.find(b => b.uri.includes('negation'));
    expect(abs?.apply(lit(-5))).toEqual(lit(5));
    expect(pow?.apply(lit(2), lit(3))).toEqual(lit(8));
    expect(mod?.apply(lit(7), lit(3))).toEqual(lit(1));
    expect(floor?.apply(lit(2.7))).toEqual(lit(2));
    expect(ceil?.apply(lit(2.1))).toEqual(lit(3));
    expect(round?.apply(lit(2.5))).toEqual(lit(3));
    expect(neg?.apply(lit(2))).toEqual(lit(-2));
  });

  it('math:integer, decimal, isFinite, isNaN', () => {
    const integer = MathBuiltins.find(b => b.uri.includes('integer'));
    const decimal = MathBuiltins.find(b => b.uri.includes('decimal'));
    const isFiniteFn = MathBuiltins.find(b => b.uri.includes('isFinite'));
    const isNaNFn = MathBuiltins.find(b => b.uri.includes('isNaN'));
    expect(integer?.apply(lit(2))).toBe(true);
    expect(decimal?.apply(lit(2.5))).toBe(true);
    expect(isFiniteFn?.apply(lit(2))).toBe(true);
    expect(isNaNFn?.apply(lit('notanumber'))).toBe(true);
  });
});
