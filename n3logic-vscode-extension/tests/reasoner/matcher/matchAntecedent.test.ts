import { matchAntecedent } from '../../../n3logic/reasoner/matcher/matchAntecedent';
import { N3Triple, N3Builtin } from '../../../n3logic/N3LogicTypes';

describe('matcher/matchAntecedent', () => {
  const dummyBuiltin: N3Builtin = {
    uri: 'http://example.org/builtin',
    arity: 1,
    apply: () => true
  };
  const builtins = [dummyBuiltin];
  const triple: N3Triple = {
    subject: { type: 'IRI', value: 'a' },
    predicate: { type: 'IRI', value: 'b' },
    object: { type: 'Literal', value: '1' }
  };
  it('returns [{}] for empty patterns', () => {
    expect(matchAntecedent([], [triple], builtins)).toEqual([{}]);
  });
  it('matches a triple in data', () => {
    expect(matchAntecedent([triple], [triple], builtins)).toEqual([{ }]);
  });
  it('returns [] if no match', () => {
    const t2: N3Triple = { ...triple, object: { type: 'Literal', value: '2' } };
    expect(matchAntecedent([t2], [triple], builtins)).toEqual([]);
  });
  it('handles builtins', () => {
    const pattern: N3Triple = { ...triple, predicate: { type: 'IRI', value: dummyBuiltin.uri } };
    expect(matchAntecedent([pattern], [triple], builtins)).toEqual([{}]);
  });
});
