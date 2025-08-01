import { jest } from '@jest/globals';
// Use global jest object
// Jest globals are available automatically in ESM mode
import { evaluateBuiltins } from '../../n3logic/reasoner/builtinEvaluator';
import { N3Term, N3Triple, N3Builtin } from '../../n3logic/N3LogicTypes';

describe('evaluateBuiltins', () => {
  const dummyBuiltin = {
    uri: 'http://example.org/builtin#alwaysTrue',
    arity: 1,
    apply: () => true,
  };
  const dummyTriple = {
  subject: { type: 'Literal', value: 'foo' } as const,
  predicate: { type: 'IRI', value: 'http://example.org/builtin#alwaysTrue' } as const,
  object: { type: 'Literal', value: 'bar' } as const,
  };
  const bindings = {};
  const document = { builtins: [dummyBuiltin] };
  // Use a plain jest.fn() and type-assert to the correct function signature for evaluateBuiltins
  const matchAntecedent = jest.fn() as unknown as (patterns: N3Triple[], data: N3Triple[], builtins: N3Builtin[]) => Array<Record<string, N3Term>>;
  const instantiateTriple = jest.fn() as unknown as (triple: N3Triple, bindings: Record<string, N3Term>) => N3Triple;

  it('returns true if no builtins are registered', () => {
    const doc = { builtins: undefined };
    expect(evaluateBuiltins([
      {
        subject: { type: 'Literal', value: 'foo' } as const,
        predicate: { type: 'IRI', value: 'http://example.org/builtin#alwaysTrue' } as const,
        object: { type: 'Literal', value: 'bar' } as const,
      },
    ], bindings, doc, matchAntecedent, instantiateTriple)).toBe(true);
  });

  it('returns true if builtin returns true', () => {
    expect(evaluateBuiltins([
      {
        subject: { type: 'Literal', value: 'foo' } as const,
        predicate: { type: 'IRI', value: 'http://example.org/builtin#alwaysTrue' } as const,
        object: { type: 'Literal', value: 'bar' } as const,
      },
    ], bindings, document, matchAntecedent, instantiateTriple)).toBe(true);
  });

  it('returns false if builtin returns false', () => {
    const falseBuiltin = { ...dummyBuiltin, apply: () => false };
    const doc = { builtins: [falseBuiltin] };
    expect(evaluateBuiltins([
      {
        subject: { type: 'Literal', value: 'foo' } as const,
        predicate: { type: 'IRI', value: 'http://example.org/builtin#alwaysTrue' } as const,
        object: { type: 'Literal', value: 'bar' } as const,
      },
    ], bindings, doc, matchAntecedent, instantiateTriple)).toBe(false);
  });

  it('calls builtin with correct arguments (arity 1)', () => {
    const spy = jest.fn(() => true);
    const builtin = { ...dummyBuiltin, apply: spy };
    const doc = { builtins: [builtin] };
    const triple = {
      subject: { type: 'Literal', value: 'foo' } as const,
      predicate: { type: 'IRI', value: 'http://example.org/builtin#alwaysTrue' } as const,
      object: { type: 'Literal', value: 'bar' } as const,
    };
    evaluateBuiltins([triple], bindings, doc, matchAntecedent, instantiateTriple);
  expect(spy).toHaveBeenCalled();
  });

  it('calls builtin with correct arguments (arity 2)', () => {
    const spy = jest.fn(() => true);
    const builtin = { ...dummyBuiltin, arity: 2, apply: spy };
    const doc = { builtins: [builtin] };
    const triple = {
      subject: { type: 'Literal', value: 'foo' } as const,
      predicate: { type: 'IRI', value: 'http://example.org/builtin#alwaysTrue' } as const,
      object: { type: 'Literal', value: 'bar' } as const,
    };
    evaluateBuiltins([triple], bindings, doc, matchAntecedent, instantiateTriple);
  expect(spy).toHaveBeenCalled();
  });
});
