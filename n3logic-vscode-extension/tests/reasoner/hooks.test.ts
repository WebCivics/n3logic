import { describe, it, expect, jest } from '@jest/globals';
import { HookManager } from '../../n3logic/reasoner/hooks';

describe('HookManager', () => {
  it('registers and runs hooks', () => {
    const manager = new HookManager();
    const spy = jest.fn();
    manager.on('test', spy);
    manager.runHook('test', 1, 2);
    expect(spy).toHaveBeenCalledWith(1, 2);
  });

  it('does not fail if no hooks registered', () => {
    const manager = new HookManager();
    expect(() => manager.runHook('none')).not.toThrow();
  });

  it('ignores errors in hooks', () => {
    const manager = new HookManager();
    manager.on('err', () => { throw new Error('fail'); });
    expect(() => manager.runHook('err')).not.toThrow();
  });
});
