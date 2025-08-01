// Debug support
import { debugTrace } from './reasoner/debug';
let DEBUG = false;
function debugLog(...args: any[]) {
  // Always print debug output for test diagnosis
  debugTrace && debugTrace('[N3LogicParser]', ...args);
  if (typeof console !== 'undefined' && typeof console.log === 'function') {
    console.log('[N3LogicParser]', ...args);
  }
}
// N3LogicParser.ts
// Parses N3/N3Logic documents into triples, rules, and built-ins (robust version)

import { N3LogicDocument, N3Triple, N3Rule, N3Builtin, N3Term } from './N3LogicTypes';
import { tokenizeTriples } from './parser/TripleTokenizer';
import { extractRules } from './parser/RuleExtractor';
import { tokenizeTerms } from './parser/TermTokenizer';
import { splitTriples } from './parser/TripleSplitter';

export class N3LogicParser {
  setDebug(debug: boolean) {
    DEBUG = debug;
    debugTrace && debugTrace('[N3LogicParser] setDebug called:', debug);
    debugLog('Debug mode set to', debug);
  }

  parse(n3Text: string): N3LogicDocument {
    debugTrace && debugTrace('[N3LogicParser] parse called:', n3Text);
    debugLog('Parsing input', n3Text);
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
        builtins,
      };
    } catch (err) {
      debugLog('Failed to parse input', err);
      throw new Error(`N3LogicParser.parse: Failed to parse input. ${err instanceof Error ? err.message : err}`);
    }
  }

  // Parse triples, supporting literals, variables, lists, blank nodes, multi-line, robustly
  private parseTriples(n3Text: string, allowNoDot = false): N3Triple[] {
    debugTrace && debugTrace('[N3LogicParser] parseTriples called:', n3Text, allowNoDot);
    if (typeof n3Text !== 'string') {
      throw new TypeError('parseTriples: Input must be a string');
    }
    const triples: N3Triple[] = [];
    // Always use splitTriples for rule blocks (allowNoDot=true), to robustly split on dot, semicolon, or newline
    let statements: string[];
    let text = n3Text.trim();
    if (allowNoDot) {
      if (text.startsWith('{') && text.endsWith('}')) {
        text = text.slice(1, -1).trim();
      }
      debugLog('parseTriples: Splitting rule block:', text);
      statements = splitTriples(text, debugLog);
      debugLog('parseTriples: splitTriples returned:', JSON.stringify(statements));
    } else {
      statements = tokenizeTriples(text);
    }
    for (const stmt of statements) {
      if (!stmt) continue;
      debugLog('parseTriples: Tokenizing statement:', stmt);
      // Use a regex that matches <...> as a single token, even with # or :
      const tokens = (stmt.match(/<[^>]+>|"[^"]*"|\S+/g) || []).map((t) => t.trim());
      debugLog('parseTriples: Tokenized terms:', JSON.stringify(tokens));
      for (let i = 0; i + 2 < tokens.length; i += 3) {
        // Skip if any token is a rule/control symbol or lone parenthesis
        const t0 = tokens[i], t1 = tokens[i + 1], t2 = tokens[i + 2];
        debugLog('parseTriples: Triple tokens:', t0, t1, t2);
        if ([t0, t1, t2].some((t) => t === '{' || t === '}' || t === '=>' || t === '' || t === '(' || t === ')')) {
          debugLog('parseTriples: Skipping invalid triple tokens');
          continue;
        }
        try {
          const triple = {
            subject: this.parseTerm(t0),
            predicate: this.parseTerm(t1),
            object: this.parseTerm(t2),
          };
          debugLog('parseTriples: Parsed triple:', JSON.stringify(triple));
          // Extra debug: log predicate type and value for custom builtin URIs
          if (triple.predicate && typeof triple.predicate === 'object' && 'value' in triple.predicate) {
            debugLog('parseTriples: Predicate type:', triple.predicate.type, 'Predicate value:', triple.predicate.value);
          } else if (triple.predicate && typeof triple.predicate === 'object') {
            debugLog('parseTriples: Predicate type:', triple.predicate.type, 'Predicate:', JSON.stringify(triple.predicate));
          }
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
    debugTrace && debugTrace('[N3LogicParser] parseTerm called:', token);
    if (typeof token !== 'string') {
      throw new TypeError('parseTerm: Token must be a string');
    }
    token = token.trim();
    if (!token) {
      throw new Error('parseTerm: Empty token');
    }
    if (token.startsWith('<') && token.endsWith('>')) {
      return { type: 'IRI', value: token.slice(1, -1) };
    } else if (token.startsWith('"')) {
      // Literal with optional datatype or language
      const litMatch = token.match(/^"([^"]*)"(?:\^\^<([^>]+)>|@([a-zA-Z\-]+))?/);
      if (litMatch) {
        return {
          type: 'Literal',
          value: litMatch[1],
          datatype: litMatch[2],
          language: litMatch[3],
        };
      } else {
        throw new Error(`parseTerm: Invalid literal format: '${token}'`);
      }
    } else if (token.startsWith('?')) {
      if (token.length < 2) throw new Error('parseTerm: Variable name missing after ?');
      return { type: 'Variable', value: token.slice(1) };
    } else if (token.startsWith('_:')) {
      if (token.length < 3) throw new Error('parseTerm: Blank node id missing after _:');
      return { type: 'BlankNode', value: token.slice(2) };
    } else if (token.startsWith('(') && token.endsWith(')')) {
      // List: (a b c)
      const inner = token.slice(1, -1).trim();
      if (!inner) return { type: 'List', elements: [] };
      const elements = inner.split(/\s+/).map((t) => this.parseTerm(t));
      return { type: 'List', elements };
    }
    // Fallback: treat as IRI (even if not <...>), to support builtins and prefixed names
    return { type: 'IRI', value: token };
  }

  // Parse rules, supporting nested formulas and quantifiers
  private parseRules(n3Text: string): N3Rule[] {
    debugTrace && debugTrace('[N3LogicParser] parseRules called:', n3Text);
    if (typeof n3Text !== 'string') {
      throw new TypeError('parseRules: Input must be a string');
    }
    const rules: N3Rule[] = [];
    const ruleBlocks = extractRules(n3Text);
    for (const { antecedent, consequent } of ruleBlocks) {
      try {
        // Always print antecedent and its split for debug
        if (typeof console !== 'undefined' && typeof console.log === 'function') {
          console.log('[parseRules][DEBUG] antecedent string:', JSON.stringify(antecedent));
        }
        const splitAntecedent = antecedent.split(/\s*\.\s*/).map((s) => s.trim()).filter(Boolean);
        if (typeof console !== 'undefined' && typeof console.log === 'function') {
          console.log('[parseRules][DEBUG] splitAntecedent statements:', JSON.stringify(splitAntecedent));
        }
        const antecedentTriples = this.parseTriples(antecedent, true);
        const consequentTriples = this.parseTriples(consequent, true);
        debugLog('Parsed rule antecedent triples:', JSON.stringify(antecedentTriples, null, 2));
        debugLog('Parsed rule consequent triples:', JSON.stringify(consequentTriples, null, 2));
        // Extra: flag any triple whose predicate matches a known or custom builtin URI
        const builtinPattern = /#|custom#|math#|string#|log#|type#|other#/;
        antecedentTriples.forEach((triple, idx) => {
          if (triple.predicate && typeof triple.predicate === 'object' && 'value' in triple.predicate && builtinPattern.test(triple.predicate.value)) {
            debugLog(`[parseRules][DEBUG][BUILTIN] Antecedent triple #${idx} predicate matches builtin pattern:`, triple.predicate.value, JSON.stringify(triple));
          }
        });
        consequentTriples.forEach((triple, idx) => {
          if (triple.predicate && typeof triple.predicate === 'object' && 'value' in triple.predicate && builtinPattern.test(triple.predicate.value)) {
            debugLog(`[parseRules][DEBUG][BUILTIN] Consequent triple #${idx} predicate matches builtin pattern:`, triple.predicate.value, JSON.stringify(triple));
          }
        });
        const antecedentFormula = { type: 'Formula' as const, triples: antecedentTriples };
        const consequentFormula = { type: 'Formula' as const, triples: consequentTriples };
        rules.push({
          type: 'Rule',
          antecedent: antecedentFormula,
          consequent: consequentFormula,
        });
      } catch (err) {
        throw new Error(`parseRules: Failed to parse rule: ${err instanceof Error ? err.message : err}`);
      }
    }
    return rules;
  }

  // Parse builtins (stub, can be extended)
  private parseBuiltins(n3Text: string): N3Builtin[] {
    debugTrace && debugTrace('[N3LogicParser] parseBuiltins called:', n3Text);
    // Example: extract known builtins by URI
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
          description: 'Stub built-in',
        });
      }
    }
    return builtins;
  }
}
