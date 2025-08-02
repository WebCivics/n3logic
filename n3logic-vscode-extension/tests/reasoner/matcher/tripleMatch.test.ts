import { N3Triple, N3Term } from '../../../n3logic/N3LogicTypes';
import { matchTriple, termMatch, termEquals } from '../../../n3logic/reasoner/matcher/tripleMatch';

describe('matcher/tripleMatch', () => {
  const triple: N3Triple = {
    subject: { type: 'IRI', value: 'a' },
    predicate: { type: 'IRI', value: 'b' },
    object: { type: 'Literal', value: '1' }
  };
  it('termEquals compares terms by value', () => {
    expect(termEquals(triple.subject, { type: 'IRI', value: 'a' } as N3Term)).toBe(true);
    expect(termEquals(triple.subject, { type: 'IRI', value: 'b' } as N3Term)).toBe(false);
  });
  it('termMatch binds variables and matches', () => {
    const pattern: N3Term = { type: 'Variable', value: 'x' };
    const bindings: Record<string, N3Term> = {};
    expect(termMatch(pattern, triple.subject, bindings)).toBe(true);
    expect(bindings.x).toEqual(triple.subject);
  });
  it('matchTriple returns bindings if match', () => {
    const pattern: N3Triple = { ...triple };
    expect(matchTriple(pattern, triple, termMatch)).toEqual({});
  });
  it('matchTriple returns null if no match', () => {
    const pattern: N3Triple = { ...triple, object: { type: 'Literal', value: '2' } };
    expect(matchTriple(pattern, triple, termMatch)).toBeNull();
  });
});
