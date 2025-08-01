// debug.cjs.ts
// CJS version: use global __dirname
import fs from 'fs';
import path from 'path';

let DEBUG = false;
let DEBUG_LEVEL = 4;

let logFilePath: string | null = null;
function getLogFilePath() {
  if (logFilePath) return logFilePath;
  let mode = 'cjs';
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
  if (process.env.JEST_WORKER_ID !== undefined || DEBUG && getDebugLevel() >= 4) {
    if (typeof console !== 'undefined') {
      if (typeof console.debug === 'function') console.debug('[N3LogicReasoner][TRACE]', ...args);
      if (typeof console.log === 'function') console.log('[N3LogicReasoner][TRACE]', ...args);
    }
    try {
      const logPath = getLogFilePath();
      const msg = `[${new Date().toISOString()}] [N3LogicReasoner][TRACE] ` + args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n';
      fs.appendFileSync(logPath, msg, 'utf8');
    } catch (e) {}
  }
}

export function debugLog(...args: any[]) {
  if (process.env.JEST_WORKER_ID !== undefined || DEBUG) {
    if (typeof console !== 'undefined') {
      if (typeof console.debug === 'function') console.debug('[N3LogicReasoner][DEBUG]', ...args);
      if (typeof console.log === 'function') console.log('[N3LogicReasoner][DEBUG]', ...args);
    }
    try {
      const logPath = getLogFilePath();
      const msg = `[${new Date().toISOString()}] [N3LogicReasoner][DEBUG] ` + args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') + '\n';
      fs.appendFileSync(logPath, msg, 'utf8');
    } catch (e) {}
  }
}
