// TripleTokenizer.ts
// Utility for splitting N3/N3Logic text into triple statements, robust to quoted literals, lists, blank nodes, etc.
import { N3Triple } from '../N3LogicTypes';

export function tokenizeTriples(n3Text: string): string[] {
  const statements: string[] = [];
  let buf = '';
  let inQuote = false;
  let quoteChar = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let escape = false;
  for (let i = 0; i < n3Text.length; i++) {
    const c = n3Text[i];
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
    if (c === '(') parenDepth++;
    if (c === ')') parenDepth--;
    if (c === '[') bracketDepth++;
    if (c === ']') bracketDepth--;
    if (c === '.' && parenDepth === 0 && bracketDepth === 0) {
      if (buf.trim()) statements.push(buf.trim());
      buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim()) statements.push(buf.trim());
  return statements;
}
