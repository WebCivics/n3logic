import { OtherBuiltins } from '../../n3logic/builtins/N3LogicOtherBuiltins';
import { N3Term } from '../../n3logic/N3LogicTypes';

describe('OtherBuiltins', () => {
  const lit = (v: any) => ({ type: 'Literal', value: String(v) } as const);
  const iri = (v: string) => ({ type: 'IRI', value: v } as const);

  it('rdf:type always returns true', () => {
    const fn = OtherBuiltins.find(b => b.uri.includes('rdf-syntax-ns#type'));
    expect(fn?.apply(lit('a'), lit('b'))).toBe(true);
  });

  it('owl:sameAs returns true if values are equal', () => {
    const fn = OtherBuiltins.find(b => b.uri.includes('owl#sameAs'));
    expect(fn?.apply(lit('x'), lit('x'))).toBe(true);
    expect(fn?.apply(lit('x'), lit('y'))).toBe(false);
  });
});
