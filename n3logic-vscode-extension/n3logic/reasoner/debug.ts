// Debug utilities for N3LogicReasoner
let DEBUG = false;
export function setDebug(debug: boolean) {
  DEBUG = debug;
  debugLog('Debug mode set to', debug);
}
export function debugLog(...args: any[]) {
  if (DEBUG) {
    console.debug('[N3LogicReasoner]', ...args);
  }
}
