// TermTokenizer.ts
// Tokenizes a triple statement into subject, predicate, object terms, respecting quoted strings, lists, blank nodes, etc.
export function tokenizeTerms(stmt: string): string[] {
  const tokens: string[] = [];
  let buf = '';
  let inQuote = false;
  let quoteChar = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let escape = false;
  for (let i = 0; i < stmt.length; i++) {
    const c = stmt[i];
    if (escape) {
      buf += c;
      escape = false;
      continue;
    }
    if (c === '\\') {
      buf += c;
      escape = true;
      continue;
    }
    if (inQuote) {
      buf += c;
      if (c === quoteChar) {
        inQuote = false;
        quoteChar = '';
      }
      continue;
    }
    if (c === '"' || c === "'") {
      inQuote = true;
      quoteChar = c;
      buf += c;
      continue;
    }
    if (c === '(' && parenDepth === 0) {
      // Start of a list: capture the whole list as a single token
      let listBuf = '';
      let depth = 0;
      // Capture from this '(' to its matching ')'
      for (; i < stmt.length; i++) {
        const cc = stmt[i];
        listBuf += cc;
        if (cc === '(') depth++;
        if (cc === ')') depth--;
        if (depth === 0) break;
      }
      if (listBuf) tokens.push(listBuf.trim());
      buf = '';
      continue;
    }
    if (c === '(') parenDepth++;
    if (c === ')') parenDepth--;
    if (c === '[') bracketDepth++;
    if (c === ']') bracketDepth--;
    // Only split on whitespace at top level
    if (/\s/.test(c) && parenDepth === 0 && bracketDepth === 0 && !inQuote && buf) {
      tokens.push(buf);
      buf = '';
      // skip consecutive whitespace
      while (i + 1 < stmt.length && /\s/.test(stmt[i + 1])) i++;
    } else if (!/\s/.test(c) || inQuote || parenDepth > 0 || bracketDepth > 0) {
      buf += c;
    }
  }
  if (buf) tokens.push(buf);
  return tokens;
}
