// TripleSplitter.ts
// Robustly splits a block of N3/N3Logic text into triple statements, not splitting inside quotes or parens.

/**
 * Splits a block of N3/N3Logic text into triple statements.
 * Handles dot+space, dot, semicolon, or newline at top level, not inside quotes or brackets.
 * @param text The N3/N3Logic text block to split
 * @param debugLog Optional debug function for diagnostics
 */
export function splitTriples(text: string, debugLog?: (...args: any[]) => void): string[] {
  if (debugLog) debugLog('[TRACE][splitTriples] input:', JSON.stringify(text));
  const statements: string[] = [];
  let buf = '', inQuote = false, quoteChar = '', parenDepth = 0, bracketDepth = 0, iriDepth = 0, escape = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (debugLog) debugLog(`[TRACE][splitTriples] char[${i}] = '${c}', buf='${buf}', iriDepth=${iriDepth}, parenDepth=${parenDepth}, bracketDepth=${bracketDepth}, inQuote=${inQuote}`);
    if (escape) { buf += c; escape = false; continue; }
    if (c === '\\') { buf += c; escape = true; continue; }
    if (inQuote) {
      buf += c;
      if (c === quoteChar) { inQuote = false; quoteChar = ''; }
      continue;
    }
    if (c === '"' || c === "'") { inQuote = true; quoteChar = c; buf += c; continue; }
    if (c === '<') iriDepth++;
    if (c === '>') iriDepth = Math.max(0, iriDepth - 1);
    if (c === '(') parenDepth++;
    if (c === ')') parenDepth--;
    if (c === '[') bracketDepth++;
    if (c === ']') bracketDepth--;
    // Always split on dot (.), semicolon (;), or newline (\n) at top level, not inside IRI, quotes, parens, or brackets
    if (iriDepth === 0 && !inQuote && parenDepth === 0 && bracketDepth === 0 && (c === '.' || c === ';' || c === '\n')) {
      if (debugLog) debugLog(`[TRACE][splitTriples] splitting at char '${c}', buf before split:`, JSON.stringify(buf));
      if (buf.trim().length > 0) {
        if (debugLog) debugLog('[TRACE][splitTriples] Found triple statement:', JSON.stringify(buf.trim()));
        statements.push(buf.trim());
      } else {
        if (debugLog) debugLog('[TRACE][splitTriples] Skipping empty/whitespace-only buffer:', JSON.stringify(buf));
      }
      buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim().length > 0) {
    if (debugLog) debugLog('[TRACE][splitTriples] Found final triple statement:', JSON.stringify(buf.trim()));
    statements.push(buf.trim());
  } else {
    if (debugLog) debugLog('[TRACE][splitTriples] Skipping final empty/whitespace-only buffer:', JSON.stringify(buf));
  }
  if (debugLog) debugLog('[TRACE][splitTriples] output statements:', JSON.stringify(statements));
  return statements;
}
