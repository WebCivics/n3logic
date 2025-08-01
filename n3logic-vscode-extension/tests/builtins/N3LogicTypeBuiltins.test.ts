import { TypeBuiltins } from '../../n3logic/builtins/N3LogicTypeBuiltins';
import { N3Term } from '../../n3logic/N3LogicTypes';

describe('TypeBuiltins', () => {
  const lit = (v: any) => ({ type: 'Literal', value: String(v) } as const);
  const iri = (v: string) => ({ type: 'IRI', value: v } as const);
  const blank = (v: string) => ({ type: 'BlankNode', value: v } as const);

  it('type:isLiteral, isIRI, isBlank', () => {
    const isLiteral = TypeBuiltins.find(b => b.uri.includes('isLiteral'));
    const isIRI = TypeBuiltins.find(b => b.uri.includes('isIRI'));
    const isBlank = TypeBuiltins.find(b => b.uri.includes('isBlank'));
    expect(isLiteral?.apply(lit('x'))).toBe(true);
    expect(isIRI?.apply(iri('foo'))).toBe(true);
    expect(isBlank?.apply(blank('b1'))).toBe(true);
    expect(isLiteral?.apply(iri('foo'))).toBe(false);
    expect(isIRI?.apply(lit('x'))).toBe(false);
    expect(isBlank?.apply(lit('x'))).toBe(false);
  });

  it('type:toString, toNumber, toBoolean', () => {
    const toString = TypeBuiltins.find(b => b.uri.includes('toString'));
    const toNumber = TypeBuiltins.find(b => b.uri.includes('toNumber'));
    const toBoolean = TypeBuiltins.find(b => b.uri.includes('toBoolean'));
    expect(toString?.apply(lit(123))).toEqual(lit('123'));
    expect(toNumber?.apply(lit('42'))).toEqual(lit(42));
    expect(toBoolean?.apply(lit(''))).toEqual(lit(false));
    expect(toBoolean?.apply(lit('x'))).toEqual(lit(true));
  });
});
