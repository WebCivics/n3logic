// TripleSplitter.ts
// Robustly splits a block of N3/N3Logic text into triple statements, not splitting inside quotes or parens.

/**
 * Splits a block of N3/N3Logic text into triple statements.
 * Handles dot+space, dot, semicolon, or newline at top level, not inside quotes or brackets.
 * @param text The N3/N3Logic text block to split
 * @param debugLog Optional debug function for diagnostics
 */
export function splitTriples(text: string, debugLog?: (...args: any[]) => void): string[] {
  const statements: string[] = [];
  let buf = '', inQuote = false, quoteChar = '', parenDepth = 0, bracketDepth = 0, iriDepth = 0, escape = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
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
    // Split on dot+space, dot, semicolon, or newline at top level, not inside IRI, quotes, parens, or brackets
    if (iriDepth === 0 && !inQuote && parenDepth === 0 && bracketDepth === 0 &&
        ((c === '.' && text[i+1] === ' ') ||
         c === '.' ||
         c === ';' ||
         c === '\n')) {
      if (buf.trim()) {
        if (debugLog) debugLog('splitTriples: Found triple statement:', buf.trim());
        statements.push(buf.trim());
      }
      buf = '';
      if (c === '.' && text[i+1] === ' ') i++;
    } else {
      buf += c;
    }
  }
  if (buf.trim()) {
    if (debugLog) debugLog('splitTriples: Found triple statement:', buf.trim());
    statements.push(buf.trim());
  }
  if (debugLog) debugLog('splitTriples: All split statements:', JSON.stringify(statements, null, 2));
  return statements;
}
