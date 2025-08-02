import { isN3Variable, isN3IRI } from '../../../n3logic/reasoner/matcher/typeguards';

describe('matcher/typeguards', () => {
  it('isN3Variable detects variable terms', () => {
    expect(isN3Variable({ type: 'Variable', value: 'x' })).toBe(true);
    expect(isN3Variable({ type: 'IRI', value: 'x' })).toBe(false);
    expect(isN3Variable('foo' as any)).toBe(false);
  });
  it('isN3IRI detects IRI terms', () => {
    expect(isN3IRI({ type: 'IRI', value: 'x' })).toBe(true);
    expect(isN3IRI({ type: 'Variable', value: 'x' })).toBe(false);
    expect(isN3IRI('foo' as any)).toBe(false);
  });
});
