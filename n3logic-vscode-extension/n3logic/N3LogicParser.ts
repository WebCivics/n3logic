// Debug support
let DEBUG = false;
function debugLog(...args: any[]) {
  if (DEBUG) {
    console.debug('[N3LogicParser]', ...args);
  }
}
// N3LogicParser.ts
// Parses N3/N3Logic documents into triples, rules, and built-ins (npm package version)
import { N3LogicDocument, N3Triple, N3Rule, N3Builtin, N3Formula, N3Quantifier, N3Term, N3Variable, N3Literal, N3BlankNode, N3IRI, N3List, N3ForAll, N3Exists } from './N3LogicTypes';
import { tokenizeTriples } from './parser/TripleTokenizer';
import { extractRules } from './parser/RuleExtractor';
import { tokenizeTerms } from './parser/TermTokenizer';
import { splitTriples } from './parser/TripleSplitter';

export class N3LogicParser {
  /**
   * Enable or disable debug logging for this parser instance.
   */
  setDebug(debug: boolean) {
    DEBUG = debug;
    debugLog('Debug mode set to', debug);
  }

  parse(n3Text: string): N3LogicDocument {
    debugLog('Parsing input', n3Text);
    debugLog('N3LogicParser: Raw input:', n3Text);
    if (typeof n3Text !== 'string') {
      debugLog('Input is not a string');
      throw new TypeError('N3LogicParser.parse: Input must be a string');
    }
    // Remove comments only (preserve newlines for rule extraction)
    const commentStripped = n3Text.replace(/#[^\n]*/g, '');
    // For triples, normalize whitespace (old behavior)
    const cleaned = commentStripped.replace(/\s+/g, ' ').trim();
    try {
      const triples = this.parseTriples(cleaned);
      debugLog('N3LogicParser: Parsed triples:', JSON.stringify(triples, null, 2));
      // For rules and builtins, use comment-stripped but newline-preserved text
      const rules = this.parseRules(commentStripped);
      debugLog('N3LogicParser: Parsed rules:', JSON.stringify(rules, null, 2));
      const builtins = this.parseBuiltins(commentStripped);
      debugLog('N3LogicParser: Parsed builtins:', JSON.stringify(builtins, null, 2));
      return {
        triples,
        rules,
        builtins
      };
    } catch (err) {
      debugLog('Failed to parse input', err);
      throw new Error(`N3LogicParser.parse: Failed to parse input. ${err instanceof Error ? err.message : err}`);
    }
  }

  // Parse triples, supporting literals, variables, lists, blank nodes, multi-line, robustly
  private parseTriples(n3Text: string, allowNoDot = false): N3Triple[] {
    if (typeof n3Text !== 'string') {
      throw new TypeError('parseTriples: Input must be a string');
    }
    const triples: N3Triple[] = [];
    // If allowNoDot, split on semicolons or newlines as well as dots
    let statements: string[];
    if (allowNoDot) {
      // Remove outer braces if present
      let text = n3Text.trim();
      if (text.startsWith('{') && text.endsWith('}')) {
        text = text.slice(1, -1).trim();
      }
      debugLog('parseTriples: Splitting rule block:', text);
      statements = splitTriples(text, debugLog);
      debugLog('parseTriples: splitTriples returned:', JSON.stringify(statements));
    } else {
      statements = tokenizeTriples(n3Text);
    }
    for (const stmt of statements) {
      if (!stmt) continue;
      debugLog('parseTriples: Tokenizing statement:', stmt);
      const tokens = tokenizeTerms(stmt);
      debugLog('parseTriples: Tokenized terms:', JSON.stringify(tokens));
      for (let i = 0; i + 2 < tokens.length; i += 3) {
        // Skip if any token is a rule/control symbol or lone parenthesis
        const t0 = tokens[i], t1 = tokens[i + 1], t2 = tokens[i + 2];
        debugLog('parseTriples: Triple tokens:', t0, t1, t2);
        if ([t0, t1, t2].some(t => t === '{' || t === '}' || t === '=>' || t === '' || t === '(' || t === ')')) {
          debugLog('parseTriples: Skipping invalid triple tokens');
          continue;
        }
        try {
          const triple = {
            subject: this.parseTerm(t0),
            predicate: this.parseTerm(t1),
            object: this.parseTerm(t2)
          };
          debugLog('parseTriples: Parsed triple:', JSON.stringify(triple));
          triples.push(triple);
        } catch (err) {
          debugLog('parseTriples: Failed to parse triple:', stmt, err);
          throw new Error(`parseTriples: Failed to parse triple '${stmt}': ${err instanceof Error ? err.message : err}`);
        }
      }
    }
    debugLog('parseTriples: Final parsed triples:', JSON.stringify(triples));
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
    const ruleBlocks = extractRules(n3Text);
    for (const { antecedent, consequent } of ruleBlocks) {
      try {
        const antecedentTriples = this.parseTriples(antecedent, true);
        const consequentTriples = this.parseTriples(consequent, true);
        debugLog('Parsed rule antecedent triples:', JSON.stringify(antecedentTriples, null, 2));
        debugLog('Parsed rule consequent triples:', JSON.stringify(consequentTriples, null, 2));
        const antecedentFormula = { type: "Formula" as const, triples: antecedentTriples };
        const consequentFormula = { type: "Formula" as const, triples: consequentTriples };
        rules.push({
          type: 'Rule',
          antecedent: antecedentFormula,
          consequent: consequentFormula
        });
      } catch (err) {
        throw new Error(`parseRules: Failed to parse rule: ${err instanceof Error ? err.message : err}`);
      }
    }
    // Quantifiers: ForAll, Exists (simple support)
    const forallRegex = /@forAll\s+((?:\?[\w]+\s*)+)\./g;
    let match;
    while ((match = forallRegex.exec(n3Text)) !== null) {
      // Not directly attached to rules, but can be used for context
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
