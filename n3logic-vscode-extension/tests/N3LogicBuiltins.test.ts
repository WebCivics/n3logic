import * as Builtins from '../n3logic/N3LogicBuiltins';

describe('N3LogicBuiltins', () => {
  it('exports all builtin modules', () => {
    expect(Builtins).toHaveProperty('MathBuiltins');
    expect(Builtins).toHaveProperty('StringBuiltins');
    expect(Builtins).toHaveProperty('ListBuiltins');
    expect(Builtins).toHaveProperty('TimeBuiltins');
    expect(Builtins).toHaveProperty('LogicBuiltins');
    expect(Builtins).toHaveProperty('TypeBuiltins');
    expect(Builtins).toHaveProperty('OtherBuiltins');
  });
});
