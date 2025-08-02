// matcher/logging.ts - Logging and debugging helpers for matcher
import { debugLog as baseDebugLog, debugTrace, debugWarn, debugError } from '../debug';

export function matcherDebug(...args: any[]) { baseDebugLog('[MATCHER][DEBUG]', ...args); }
export function matcherTrace(...args: any[]) { debugTrace('[MATCHER][TRACE]', ...args); }
export function matcherWarn(...args: any[]) { debugWarn('[MATCHER][WARN]', ...args); }
export function matcherError(...args: any[]) { debugError('[MATCHER][ERROR]', ...args); }

export function logPatternsAndData(patterns: any[], data: any[], builtins: any[]) {
  matcherTrace('logPatternsAndData called');
  matcherDebug('Builtins available at match time:', builtins ? builtins.map((b: any) => b.uri) : builtins);
  patterns.forEach((pattern: any, idx: number) => {
    matcherTrace(`Pattern #${idx}:`, pattern);
    matcherDebug(`Pattern #${idx}:`, JSON.stringify(pattern));
    matcherDebug(`Pattern #${idx} predicate:`, pattern.predicate);
  });
  data.forEach((triple: any, idx: number) => {
    matcherTrace(`Data triple #${idx}:`, triple);
    matcherDebug(`Data triple #${idx}:`, JSON.stringify(triple));
    matcherDebug(`Data triple #${idx} predicate:`, triple.predicate);
  });
  matcherDebug('Patterns:', JSON.stringify(patterns, null, 2));
  matcherDebug('Data:', JSON.stringify(data, null, 2));
  matcherDebug('Builtin URIs:', Array.isArray(builtins) ? builtins.map((b: any) => b.uri) : builtins);
  matcherTrace('logPatternsAndData complete');
}
