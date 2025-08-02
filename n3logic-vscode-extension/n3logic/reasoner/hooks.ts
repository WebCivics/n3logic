import { debugTrace } from './debug';
// Plugin and hook management for N3LogicReasoner
export class HookManager {
  private hooks: Record<string, Array<(...args: any[]) => void>> = {};

  on(hookName: string, callback: (...args: any[]) => void): void {
    debugTrace && debugTrace('[hooks][TRACE] on/registerHook called:', { hookName, callback });
    if (!this.hooks[hookName]) this.hooks[hookName] = [];
    this.hooks[hookName].push(callback);
    debugTrace && debugTrace('[hooks][TRACE] on/registerHook finished:', { hookName, count: this.hooks[hookName].length });
  }

  runHook(hookName: string, ...args: any[]): void {
    debugTrace && debugTrace('[hooks][TRACE] runHook called:', { hookName, args });
    if (!this.hooks[hookName]) {
      debugTrace && debugTrace('[hooks][TRACE] runHook: no hooks registered for', hookName);
      return;
    }
    for (const cb of this.hooks[hookName]) {
      debugTrace && debugTrace('[hooks][TRACE] runHook: firing hook', { hookName, cb });
      try { cb(...args); } catch (e) { debugTrace && debugTrace('[hooks][TRACE] runHook: hook error', e); }
    }
    debugTrace && debugTrace('[hooks][TRACE] runHook finished:', { hookName });
  }
}
