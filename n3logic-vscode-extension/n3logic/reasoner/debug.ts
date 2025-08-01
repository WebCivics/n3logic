// Debug utilities for N3LogicReasoner

let DEBUG = false;
let DEBUG_LEVEL = 1; // 0=none, 1=error, 2=warn, 3=info, 4=trace

function getDebugLevel(): number {
  if (typeof process !== 'undefined' && process.env && process.env.N3LOGIC_DEBUG_LEVEL) {
    const lvl = parseInt(process.env.N3LOGIC_DEBUG_LEVEL, 10);
    if (!isNaN(lvl)) return lvl;
  }
  return DEBUG_LEVEL;
}

export function setDebug(debug: boolean, level?: number) {
  DEBUG = debug;
  if (typeof level === 'number') DEBUG_LEVEL = level;
  debugInfo('Debug mode set to', debug, 'level', DEBUG_LEVEL);
}

export function debugError(...args: any[]) {
  if (DEBUG && getDebugLevel() >= 1) console.error('[N3LogicReasoner][ERROR]', ...args);
}
export function debugWarn(...args: any[]) {
  if (DEBUG && getDebugLevel() >= 2) console.warn('[N3LogicReasoner][WARN]', ...args);
}
export function debugInfo(...args: any[]) {
  if (DEBUG && getDebugLevel() >= 3) console.info('[N3LogicReasoner][INFO]', ...args);
}
export function debugTrace(...args: any[]) {
  if (DEBUG && getDebugLevel() >= 4) console.debug('[N3LogicReasoner][TRACE]', ...args);
}

export function debugLog(...args: any[]) {
  if (DEBUG) console.debug('[N3LogicReasoner][DEBUG]', ...args);
}
