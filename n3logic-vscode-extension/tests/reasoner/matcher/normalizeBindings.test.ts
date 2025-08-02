import { normalizeBindings } from '../../../n3logic/reasoner/matcher/normalizeBindings';

describe('matcher/normalizeBindings', () => {
  it('returns a copy of the bindings', () => {
    const b: Record<string, { type: 'Literal'; value: string }> = { x: { type: 'Literal', value: '1' } };
    expect(normalizeBindings(b)).toEqual({ x: { type: 'Literal', value: '1' } });
  });
  it('converts quoted string to Literal', () => {
    const b: Record<string, string> = { x: '"foo"' };
    expect(normalizeBindings(b)).toEqual({ x: { type: 'Literal', value: 'foo' } });
  });
  it('converts IRI with quoted string value to Literal', () => {
    const b: Record<string, { type: 'IRI'; value: string }> = { x: { type: 'IRI', value: '"bar"' } };
    expect(normalizeBindings(b)).toEqual({ x: { type: 'Literal', value: 'bar' } });
  });
});
