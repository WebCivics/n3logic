import { ListBuiltins } from '../../n3logic/builtins/N3LogicListBuiltins';
import { N3Term } from '../../n3logic/N3LogicTypes';

describe('ListBuiltins', () => {
  const makeList = (elements: any[]): N3Term => ({ type: 'List', elements });
  const lit = (v: any) => ({ type: 'Literal', value: String(v) } as const);

  it('list:length returns true for correct length', () => {
    const fn = ListBuiltins.find(b => b.uri.includes('length'));
    expect(fn?.apply(makeList([lit(1), lit(2)]), lit(2))).toBe(true);
    expect(fn?.apply(makeList([]), lit(0))).toBe(true);
    expect(fn?.apply(makeList([lit(1)]), lit(2))).toBe(false);
  });

  it('list:contains returns true if element present', () => {
    const fn = ListBuiltins.find(b => b.uri.includes('contains'));
    expect(fn?.apply(makeList([lit('a'), lit('b')]), lit('a'))).toBe(true);
    expect(fn?.apply(makeList([lit('a'), lit('b')]), lit('c'))).toBe(false);
  });

  it('list:first returns true for first element', () => {
    const fn = ListBuiltins.find(b => b.uri.includes('first'));
    expect(fn?.apply(makeList([lit('x'), lit('y')]), lit('x'))).toBe(true);
    expect(fn?.apply(makeList([lit('x'), lit('y')]), lit('y'))).toBe(false);
    expect(fn?.apply(makeList([]), lit('x'))).toBe(false);
  });

  it('list:rest returns the rest of the list', () => {
    const fn = ListBuiltins.find(b => b.uri.includes('rest'));
    expect(fn?.apply(makeList([lit(1), lit(2), lit(3)]), lit(0))).toEqual(makeList([lit(2), lit(3)])); // second arg ignored
    expect(fn?.apply(makeList([lit(1)]), lit(0))).toEqual(makeList([]));
  });

  it('list:append returns a new list with element appended', () => {
    const fn = ListBuiltins.find(b => b.uri.includes('append'));
    expect(fn?.apply(makeList([lit('a')]), lit('b'))).toEqual(makeList([lit('a'), lit('b')]));
  });

  it('list:remove returns a new list with element removed', () => {
    const fn = ListBuiltins.find(b => b.uri.includes('remove'));
    expect(fn?.apply(makeList([lit('a'), lit('b')]), lit('a'))).toEqual(makeList([lit('b')]));
    expect(fn?.apply(makeList([lit('a'), lit('b')]), lit('c'))).toEqual(makeList([lit('a'), lit('b')]));
  });

  it('list:reverse returns a new list with elements reversed', () => {
    const fn = ListBuiltins.find(b => b.uri.includes('reverse'));
    expect(fn?.apply(makeList([lit(1), lit(2), lit(3)]))).toEqual(makeList([lit(3), lit(2), lit(1)]));
    expect(fn?.apply(makeList([]))).toEqual(makeList([]));
  });

  it('returns false for invalid list input', () => {
    const fn = ListBuiltins.find(b => b.uri.includes('length'));
    expect(fn?.apply(null as any, lit(0))).toBe(false);
    expect(fn?.apply({ type: 'Literal', value: 'notalist' } as any, lit(1))).toBe(false);
  });
});
