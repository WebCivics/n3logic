import { tripleToString, stringToTriple, termToString, termEquals } from '../../n3logic/reasoner/tripleUtils';

describe('tripleToString', () => {
  it('converts triple to string', () => {
    const triple = { subject: 'a', predicate: 'b', object: 'c' };
    expect(tripleToString(triple)).toBe('a b c .');
  });
});

describe('stringToTriple', () => {
  it('converts string to triple', () => {
    const triple = stringToTriple('a b c');
    expect(triple.subject).toBe('a');
    expect(triple.predicate).toBe('b');
    expect(triple.object).toBe('c');
  });
});

describe('termToString', () => {
  it('handles string', () => {
    expect(termToString('foo')).toBe('foo');
  });
  it('handles literal', () => {
    expect(termToString({ type: 'Literal', value: 'bar' })).toBe('"bar"');
  });
  it('handles object with value', () => {
    expect(termToString({ type: 'IRI', value: 'baz' })).toBe('baz');
  });
});

describe('termEquals', () => {
  it('compares primitives', () => {
    expect(termEquals('a', 'a')).toBe(true);
    expect(termEquals('a', 'b')).toBe(false);
  });
  it('compares objects', () => {
    expect(termEquals({ type: 'Literal', value: 'x' }, { type: 'Literal', value: 'x' })).toBe(true);
    expect(termEquals({ type: 'Literal', value: 'x' }, { type: 'Literal', value: 'y' })).toBe(false);
  });
});
