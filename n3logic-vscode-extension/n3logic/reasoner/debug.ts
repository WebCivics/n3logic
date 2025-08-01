// Debug utilities for N3LogicReasoner

// Removed circular import. Do not import from './reasoner/debug' here.

let DEBUG = false;
let DEBUG_LEVEL = 1; // 0=none, 1=error, 2=warn, 3=info, 4=trace

// --- Enhanced logging: write to separate log files for CJS and ESM ---
import * as fs from 'fs';
import * as path from 'path';
let logFilePath: string | null = null;
function getLogFilePath() {
  if (logFilePath) return logFilePath;
  // Detect CJS or ESM by env or global
  let mode = 'unknown';
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.JEST_WORKER_ID !== undefined) {
      // Jest sets this for both, but we can use NODE_OPTIONS or a custom env
      if (process.env.N3LOGIC_TEST_MODE === 'esm') mode = 'esm';
      else mode = 'cjs';
    }
  }
  // Fallback: check for import.meta (ESM)
  // Not reliable in CJS, so prefer env
  const logsDir = path.resolve(__dirname, '../../logs');
  if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
  logFilePath = path.join(logsDir, `debug.${mode}.log`);
  return logFilePath;
}

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
  if (DEBUG) {
    console.debug('[N3LogicReasoner][DEBUG]', ...args);
    // Write to log file as well
    try {
      const logPath = getLogFilePath();
      const msg = `[${new Date().toISOString()}] [N3LogicReasoner][DEBUG] ` + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n';
      fs.appendFileSync(logPath, msg, 'utf8');
    } catch (e) {
      // Ignore file errors
    }
  }
}
