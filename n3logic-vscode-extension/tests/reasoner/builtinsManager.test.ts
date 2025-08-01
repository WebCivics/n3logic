import { mergeBuiltins } from '../../n3logic/reasoner/builtinsManager';

describe('mergeBuiltins', () => {
  it('merges custom builtins with TypeBuiltins and OtherBuiltins', () => {
    const custom = [{ uri: 'custom', arity: 1, apply: () => true }];
    const result = mergeBuiltins(custom);
    expect(Array.isArray(result)).toBe(true);
    expect(result.some(b => b.uri === 'custom')).toBe(true);
  });
});
