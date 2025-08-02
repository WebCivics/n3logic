import { resolveSubjectVals, resolveObjectVals } from '../../../n3logic/reasoner/matcher/patternMatching';

import { N3Triple, N3Term } from '../../../n3logic/N3LogicTypes';

describe('matcher/patternMatching', () => {
  const triple: N3Triple = {
    subject: { type: 'Variable', value: 'x' },
    predicate: { type: 'IRI', value: 'p' },
    object: { type: 'Variable', value: 'y' }
  };
  const data: N3Triple[] = [
    { subject: { type: 'IRI', value: 'a' }, predicate: { type: 'IRI', value: 'p' }, object: { type: 'Literal', value: '1' } },
    { subject: { type: 'IRI', value: 'b' }, predicate: { type: 'IRI', value: 'p' }, object: { type: 'Literal', value: '2' } }
  ];
  it('resolveSubjectVals returns all possible values for unbound variable', () => {
    const res = resolveSubjectVals(triple, {}, data);
    expect(res.vals.length).toBe(2);
    expect(res.varName).toBe('x');
  });
  it('resolveObjectVals returns all possible values for unbound variable', () => {
    const res = resolveObjectVals(triple, {}, data);
    expect(res.vals.length).toBe(2);
    expect(res.varName).toBe('y');
  });
  it('returns bound value if variable is bound', () => {
    const res = resolveSubjectVals(triple, { x: { type: 'IRI', value: 'a' } }, data);
    expect(res.vals).toEqual([{ type: 'IRI', value: 'a' }]);
    expect(res.varName).toBe('x');
  });
});
