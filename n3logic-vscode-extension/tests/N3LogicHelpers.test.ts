import { getValue } from '../n3logic/N3LogicHelpers';

describe('getValue', () => {
  it('returns value for literal', () => {
    expect(getValue({ type: 'Literal', value: 'foo' })).toBe('foo');
  });
  it('returns value for IRI', () => {
    expect(getValue({ type: 'IRI', value: 'bar' })).toBe('bar');
  });
  it('returns elements for list', () => {
    const elements = [
      { type: 'Literal', value: '1' } as const,
      { type: 'Literal', value: '2' } as const,
      { type: 'Literal', value: '3' } as const
    ];
    expect(getValue({ type: 'List', elements })).toEqual(elements);
  });
  it('returns primitive for string', () => {
    expect(getValue('baz')).toBe('baz');
  });
});
