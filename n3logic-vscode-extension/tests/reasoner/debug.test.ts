import { jest } from '@jest/globals';
// Use global jest object
// Jest globals are available automatically in ESM mode
import { setDebug, debugLog } from '../../n3logic/reasoner/debug';

describe('debugLog and setDebug', () => {
  it('should not log when DEBUG is false', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
  setDebug(false);
  debugLog('should not log');
  expect(spy).toHaveBeenCalled();
  spy.mockRestore();
  });

  it('should log when DEBUG is true', () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    setDebug(true);
    debugLog('should log');
    expect(spy).toHaveBeenCalled();
    setDebug(false);
    spy.mockRestore();
  });
});
