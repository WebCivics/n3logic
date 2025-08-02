import * as logging from '../../../n3logic/reasoner/matcher/logging';

describe('matcher/logging', () => {
  it('exports matcherDebug, matcherTrace, matcherWarn, matcherError, logPatternsAndData', () => {
    expect(typeof logging.matcherDebug).toBe('function');
    expect(typeof logging.matcherTrace).toBe('function');
    expect(typeof logging.matcherWarn).toBe('function');
    expect(typeof logging.matcherError).toBe('function');
    expect(typeof logging.logPatternsAndData).toBe('function');
  });
  it('logPatternsAndData does not throw', () => {
    expect(() => logging.logPatternsAndData([], [], [])).not.toThrow();
  });
});
