// N3LogicParser.ts
// Parses N3/N3Logic documents into triples, rules, and built-ins (npm package version)
import { N3LogicDocument, N3Triple, N3Rule, N3Builtin, N3Formula, N3Quantifier, N3Term, N3Variable, N3Literal, N3BlankNode, N3IRI, N3List, N3ForAll, N3Exists } from './N3LogicTypes';

export class N3LogicParser {

  parse(n3Text: string): N3LogicDocument {
    if (typeof n3Text !== 'string') {
      throw new TypeError('N3LogicParser.parse: Input must be a string');
    }
    // Remove comments and normalize whitespace
    const cleaned = n3Text.replace(/#[^\n]*/g, '').replace(/\s+/g, ' ').trim();
    try {
      return {
        triples: this.parseTriples(cleaned),
        rules: this.parseRules(cleaned),
        builtins: this.parseBuiltins(cleaned)
      };
    } catch (err) {
      throw new Error(`N3LogicParser.parse: Failed to parse input. ${err instanceof Error ? err.message : err}`);
    }
  }

  // Parse triples, supporting literals, variables, lists, blank nodes, multi-line, robustly
  private parseTriples(n3Text: string): N3Triple[] {
    if (typeof n3Text !== 'string') {
      throw new TypeError('parseTriples: Input must be a string');
    }
    const triples: N3Triple[] = [];
    // Tokenize by splitting on "." at top-level (not inside quotes, parens, or brackets)
    let statements: string[] = [];
    let buf = '';
    let inQuote = false;
    let parenDepth = 0;
    let bracketDepth = 0;
    for (let i = 0; i < n3Text.length; i++) {
      const c = n3Text[i];
      if (c === '"') inQuote = !inQuote;
      if (!inQuote) {
        if (c === '(') parenDepth++;
        if (c === ')') parenDepth--;
        if (c === '[') bracketDepth++;
        if (c === ']') bracketDepth--;
      }
      if (c === '.' && !inQuote && parenDepth === 0 && bracketDepth === 0) {
        statements.push(buf.trim());
        buf = '';
      } else {
        buf += c;
      }
    }
    if (buf.trim()) statements.push(buf.trim());
    for (const stmt of statements) {
      if (!stmt) continue;
      // Tokenize subject, predicate, object, handling quoted literals, lists, blank nodes
      const tokens = [];
      let buffer = '';
      let inQ = false;
      let pDepth = 0;
      let bDepth = 0;
      for (let i = 0; i < stmt.length; i++) {
        const c = stmt[i];
        if (c === '"') {
          buffer += c;
          if (!inQ) {
            inQ = true;
          } else {
            // End of quoted literal
            inQ = false;
            // Look ahead for datatype or language
            let j = i + 1;
            let extra = '';
            while (j < stmt.length && /[\^@<a-zA-Z0-9:_\-]/.test(stmt[j])) {
              extra += stmt[j];
              j++;
            }
            if (extra) {
              buffer += extra;
              i = j - 1;
            }
          }
          continue;
        }
        if (!inQ) {
          if (c === '(') pDepth++;
          if (c === ')') pDepth--;
          if (c === '[') bDepth++;
          if (c === ']') bDepth--;
        }
        if (!inQ && pDepth === 0 && bDepth === 0 && /\s/.test(c)) {
          if (buffer) {
            tokens.push(buffer);
            buffer = '';
          }
        } else {
          buffer += c;
        }
      }
      if (buffer) tokens.push(buffer);
      if (tokens.length === 3) {
        try {
          triples.push({
            subject: this.parseTerm(tokens[0]),
            predicate: this.parseTerm(tokens[1]),
            object: this.parseTerm(tokens[2])
          });
        } catch (err) {
          throw new Error(`parseTriples: Failed to parse triple '${stmt}': ${err instanceof Error ? err.message : err}`);
        }
      }
    }
    return triples;
  }

  // Parse a term: IRI, literal, variable, blank node, list
  private parseTerm(token: string): N3Term {
    if (typeof token !== 'string') {
      throw new TypeError('parseTerm: Token must be a string');
    }
    token = token.trim();
    if (!token) {
      throw new Error('parseTerm: Empty token');
    }
    if (token.startsWith('<') && token.endsWith('>')) {
      return { type: 'IRI', value: token.slice(1, -1) } as N3IRI;
    } else if (token.startsWith('"')) {
      // Literal with optional datatype or language
      const litMatch = token.match(/^"([^"]*)"(?:\^\^<([^>]+)>|@([a-zA-Z\-]+))?/);
      if (litMatch) {
        return {
          type: 'Literal',
          value: litMatch[1],
          datatype: litMatch[2],
          language: litMatch[3]
        } as N3Literal;
      } else {
        throw new Error(`parseTerm: Invalid literal format: '${token}'`);
      }
    } else if (token.startsWith('?')) {
      if (token.length < 2) throw new Error('parseTerm: Variable name missing after ?');
      return { type: 'Variable', value: token.slice(1) } as N3Variable;
    } else if (token.startsWith('_:')) {
      if (token.length < 3) throw new Error('parseTerm: Blank node id missing after _:');
      return { type: 'BlankNode', value: token.slice(2) } as N3BlankNode;
    } else if (token.startsWith('(') && token.endsWith(')')) {
      // List: (a b c)
      const inner = token.slice(1, -1).trim();
      if (!inner) return { type: 'List', elements: [] } as N3List;
      const elements = inner.split(/\s+/).map(t => this.parseTerm(t));
      return { type: 'List', elements } as N3List;
    }
  // Fallback: treat as IRI (even if not <...>), to support builtins and prefixed names
  return { type: 'IRI', value: token } as N3IRI;
  }

  // Parse rules, supporting nested formulas and quantifiers
  private parseRules(n3Text: string): N3Rule[] {
    if (typeof n3Text !== 'string') {
      throw new TypeError('parseRules: Input must be a string');
    }
    const rules: N3Rule[] = [];
    // Robustly match { ... } => { ... } . blocks, including multiline and indented
    const ruleRegex = /\{([\s\S]*?)\}\s*=>\s*\{([\s\S]*?)\}\s*\./g;
    let match;
    while ((match = ruleRegex.exec(n3Text)) !== null) {
      try {
        // Normalize whitespace in rule bodies
        const antecedentText = match[1].replace(/\s+/g, ' ').trim();
        const consequentText = match[2].replace(/\s+/g, ' ').trim();
        const antecedent = this.parseFormula(antecedentText);
        const consequent = this.parseFormula(consequentText);
        rules.push({
          type: 'Rule',
          antecedent,
          consequent
        });
      } catch (err) {
        throw new Error(`parseRules: Failed to parse rule '${match[0]}': ${err instanceof Error ? err.message : err}`);
      }
    }
    // Quantifiers: ForAll, Exists (simple support)
    const forallRegex = /@forAll\s+((?:\?[\w]+\s*)+)\./g;
    while ((match = forallRegex.exec(n3Text)) !== null) {
      // Not directly attached to rules, but can be used for context
      // (Advanced: attach to formulas if needed)
    }
    const existsRegex = /@forSome\s+((?:\?[\w]+\s*)+)\./g;
    while ((match = existsRegex.exec(n3Text)) !== null) {
      // Not directly attached to rules, but can be used for context
    }
    return rules;
  }

  // Parse a formula (set of triples, possibly with quantifiers)
  private parseFormula(text: string): N3Formula {
    if (typeof text !== 'string') {
      throw new TypeError('parseFormula: Input must be a string');
    }
    // Support for nested formulas and quantifiers is basic here
    let triples: N3Triple[] = [];
    try {
      triples = this.parseTriples(text);
    } catch (err) {
      throw new Error(`parseFormula: Failed to parse triples in formula: ${err instanceof Error ? err.message : err}`);
    }
    // Quantifier detection (simple)
    const quantifiers: N3Quantifier[] = [];
    const forallRegex = /@forAll\s+((?:\?[\w]+\s*)+)\./g;
    let match;
    while ((match = forallRegex.exec(text)) !== null) {
      const vars = match[1].trim().split(/\s+/).map(v => ({ type: 'Variable', value: v.replace(/^\?/, '') } as N3Variable));
      quantifiers.push({ type: 'ForAll', variables: vars, formula: { type: 'Formula', triples } } as N3ForAll);
    }
    const existsRegex = /@forSome\s+((?:\?[\w]+\s*)+)\./g;
    while ((match = existsRegex.exec(text)) !== null) {
      const vars = match[1].trim().split(/\s+/).map(v => ({ type: 'Variable', value: v.replace(/^\?/, '') } as N3Variable));
      quantifiers.push({ type: 'Exists', variables: vars, formula: { type: 'Formula', triples } } as N3Exists);
    }
    return { type: 'Formula', triples, quantifiers: quantifiers.length ? quantifiers : undefined };
  }

  // Parse builtins (as before)
  private parseBuiltins(n3Text: string): N3Builtin[] {
    const builtins: N3Builtin[] = [];
    const builtinUris = [
      'http://www.w3.org/2000/10/swap/math#greaterThan',
      'http://www.w3.org/2000/10/swap/math#lessThan',
      'http://www.w3.org/2000/10/swap/string#concatenation',
      'http://www.w3.org/2000/10/swap/log#implies',
    ];
    for (const uri of builtinUris) {
      if (n3Text.includes(`<${uri}>`)) {
        builtins.push({
          uri,
          arity: 2,
          apply: () => { throw new Error('Built-in not implemented'); },
          description: 'Stub built-in'
        });
      }
    }
    return builtins;
  }
}
