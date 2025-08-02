import { findBuiltinForPredicate, invokeBuiltin } from '../../../n3logic/reasoner/matcher/builtins';

describe('matcher/builtins', () => {
  const dummyBuiltin = {
    uri: 'http://example.org/builtin',
    arity: 1,
    apply: jest.fn(() => true)
  };
  const builtins = [dummyBuiltin];

  describe('findBuiltinForPredicate', () => {
    it('finds a builtin by URI', () => {
      expect(findBuiltinForPredicate('http://example.org/builtin', builtins)).toBe(dummyBuiltin);
    });
    it('returns undefined for missing URI', () => {
      expect(findBuiltinForPredicate('http://example.org/none', builtins)).toBeUndefined();
    });
    it('returns undefined if builtins is not an array', () => {
      expect(findBuiltinForPredicate('http://example.org/builtin', undefined as any)).toBeUndefined();
    });
    it('returns undefined if predicateUri is falsy', () => {
      expect(findBuiltinForPredicate(undefined, builtins)).toBeUndefined();
    });
  });

  describe('invokeBuiltin', () => {
    it('calls builtin.apply and returns true if result is true', () => {
      const builtin = { ...dummyBuiltin, apply: jest.fn(() => true) };
  const arg = { type: 'Literal', value: '1' } as const;
  expect(invokeBuiltin(builtin, [arg], {})).toBe(true);
  expect(builtin.apply).toHaveBeenCalledWith(arg);
    });
    it('returns false if builtin.apply returns false', () => {
      const builtin = { ...dummyBuiltin, apply: jest.fn(() => false) };
  const arg = { type: 'Literal', value: '1' } as const;
  expect(invokeBuiltin(builtin, [arg], {})).toBe(false);
    });
    it('returns false and logs error if builtin.apply throws', () => {
      const builtin = { ...dummyBuiltin, apply: jest.fn(() => { throw new Error('fail'); }) };
  const arg = { type: 'Literal', value: '1' } as const;
  expect(invokeBuiltin(builtin, [arg], {})).toBe(false);
    });
  });
});
