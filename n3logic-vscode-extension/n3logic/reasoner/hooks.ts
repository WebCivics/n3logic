// Plugin and hook management for N3LogicReasoner
export class HookManager {
  private hooks: Record<string, Array<(...args: any[]) => void>> = {};

  on(hookName: string, callback: (...args: any[]) => void): void {
    if (!this.hooks[hookName]) this.hooks[hookName] = [];
    this.hooks[hookName].push(callback);
  }

  runHook(hookName: string, ...args: any[]): void {
    if (this.hooks[hookName]) {
      for (const cb of this.hooks[hookName]) {
        try { cb(...args); } catch (e) { /* ignore hook errors */ }
      }
    }
  }
}
