import * as Types from '../n3logic/N3LogicTypes';

describe('N3LogicTypes', () => {
  it('exports all main types', () => {
    expect(Types).toHaveProperty('N3Term');
    expect(Types).toHaveProperty('N3Variable');
    expect(Types).toHaveProperty('N3Literal');
    expect(Types).toHaveProperty('N3BlankNode');
    expect(Types).toHaveProperty('N3IRI');
    expect(Types).toHaveProperty('N3Triple');
    expect(Types).toHaveProperty('N3Formula');
    expect(Types).toHaveProperty('N3Rule');
    expect(Types).toHaveProperty('N3Builtin');
    expect(Types).toHaveProperty('N3LogicDocument');
  });
});
