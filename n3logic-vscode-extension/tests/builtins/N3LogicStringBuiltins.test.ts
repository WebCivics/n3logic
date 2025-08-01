import { StringBuiltins } from '../../n3logic/builtins/N3LogicStringBuiltins';
import { N3Term } from '../../n3logic/N3LogicTypes';

describe('StringBuiltins', () => {
  const lit = (v: any) => ({ type: 'Literal', value: String(v) } as const);

  it('string:concatenation returns concatenated string', () => {
    const fn = StringBuiltins.find((b) => b.uri.includes('concatenation'));
    expect(fn?.apply(lit('a'), lit('b'))).toBe('ab');
  });

  it('string:contains returns true if substring present', () => {
    const fn = StringBuiltins.find((b) => b.uri.includes('contains'));
    expect(fn?.apply(lit('abc'), lit('b'))).toBe(true);
    expect(fn?.apply(lit('abc'), lit('z'))).toBe(false);
  });

  it('string:startsWith and endsWith', () => {
    const starts = StringBuiltins.find((b) => b.uri.includes('startsWith'));
    const ends = StringBuiltins.find((b) => b.uri.includes('endsWith'));
    expect(starts?.apply(lit('abc'), lit('a'))).toBe(true);
    expect(ends?.apply(lit('abc'), lit('c'))).toBe(true);
  });

  it('string:substring returns substring', () => {
    const fn = StringBuiltins.find((b) => b.uri.includes('substring'));
    expect(fn?.apply(lit('abcdef'), lit(1), lit(3))).toEqual(lit('bcd'));
  });

  it('string:replace replaces substring', () => {
    const fn = StringBuiltins.find((b) => b.uri.includes('replace'));
    expect(fn?.apply(lit('abcabc'), lit('a'), lit('z'))).toEqual(lit('zbczbc'));
  });

  it('string:matches returns true if regex matches', () => {
    const fn = StringBuiltins.find((b) => b.uri.includes('matches'));
    expect(fn?.apply(lit('abc'), lit('a.c'))).toBe(true);
    expect(fn?.apply(lit('abc'), lit('z'))).toBe(false);
  });

  it('string:length returns string length', () => {
    const fn = StringBuiltins.find((b) => b.uri.includes('length'));
    expect(fn?.apply(lit('abc'))).toEqual(lit(3));
  });

  it('string:toLowerCase, toUpperCase, trim', () => {
    const lower = StringBuiltins.find((b) => b.uri.includes('toLowerCase'));
    const upper = StringBuiltins.find((b) => b.uri.includes('toUpperCase'));
    const trim = StringBuiltins.find((b) => b.uri.includes('trim'));
    expect(lower?.apply(lit('ABC'))).toEqual(lit('abc'));
    expect(upper?.apply(lit('abc'))).toEqual(lit('ABC'));
    expect(trim?.apply(lit('  abc  '))).toEqual(lit('abc'));
  });
});
