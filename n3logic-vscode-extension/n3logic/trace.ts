// trace.ts - Trace ID generator for debug logging

let traceCounter = 0;
export function newTraceId(): string {
  traceCounter += 1;
  return `TRACE-${Date.now()}-${traceCounter}`;
}
