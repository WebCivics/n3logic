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

// Helper: extract prefix mappings from N3 text
function extractPrefixes(n3Text: string): Record<string, string> {
  const prefixMap: Record<string, string> = {};
  const prefixRegex = /@prefix\s+(\w+):\s*<([^>]+)>\s*\./g;
  let match;
  while ((match = prefixRegex.exec(n3Text)) !== null) {
    prefixMap[match[1]] = match[2];
  }
  return prefixMap;
}

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
    debugTrace && debugTrace('[N3LogicParser][TRACE] Initializing parse loop');
    // Remove comments only (preserve newlines for rule extraction)
    const commentStripped = n3Text.replace(/#[^\n]*/g, '');
    // Extract prefix mappings from the input
    const prefixMap = extractPrefixes(n3Text);
    debugLog('[N3LogicParser][PREFIX] Extracted prefix map:', prefixMap);

    // --- Robust triple and rule extraction ---
    // 1. Split into statements at "." (dot) that are not inside braces or quotes
    // 2. For each statement, determine if it's a rule (contains "=>") or a triple
    // 3. Parse rules and triples separately, collecting all

    // Helper: split at top-level dots
    function splitStatements(input: string): string[] {
      const stmts: string[] = [];
      let buf = '';
      let inQuote = false;
      let braceDepth = 0;
      for (let i = 0; i < input.length; i++) {
        const c = input[i];
        if (c === '"') inQuote = !inQuote;
        if (!inQuote) {
          if (c === '{') braceDepth++;
          if (c === '}') braceDepth--;
        }
        if (c === '.' && !inQuote && braceDepth === 0) {
          if (buf.trim()) stmts.push(buf.trim());
          buf = '';
        } else {
          buf += c;
        }
      }
      if (buf.trim()) stmts.push(buf.trim());
      return stmts;
    }

    // Remove all @prefix statements for triple/rule parsing, but keep for prefixMap
    const lines = commentStripped.split(/\r?\n/);
    const nonPrefixLines = lines.filter(line => !/^\s*@prefix\b/.test(line));
    const nonPrefixText = nonPrefixLines.join(' ');
    const statements = splitStatements(nonPrefixText);
    debugLog('[N3LogicParser][SPLIT] Statements:', statements);

    const triples: N3Triple[] = [];
    const rules: N3Rule[] = [];

    for (const stmt of statements) {
      if (!stmt) continue;
      if (stmt.includes('=>')) {
        // Rule: split at =>, parse antecedent and consequent
        const ruleMatch = stmt.match(/\{(.+?)\}\s*=>\s*\{(.+?)\}/);
        if (ruleMatch) {
          // PATCH: Split antecedent and consequent blocks at dots to handle multiple triples
          const antecedentBlock = ruleMatch[1].trim();
          const consequentBlock = ruleMatch[2].trim();
          debugLog('[N3LogicParser][RULE] antecedent:', antecedentBlock, 'consequent:', consequentBlock);
          // Split at dots not in quotes or braces
          function splitRuleBlock(block: string): string[] {
            const stmts: string[] = [];
            let buf = '';
            let inQuote = false;
            let braceDepth = 0;
            for (let i = 0; i < block.length; i++) {
              const c = block[i];
              if (c === '"') inQuote = !inQuote;
              if (!inQuote) {
                if (c === '{') braceDepth++;
                if (c === '}') braceDepth--;
              }
              if (c === '.' && !inQuote && braceDepth === 0) {
                if (buf.trim()) stmts.push(buf.trim());
                buf = '';
              } else {
                buf += c;
              }
            }
            if (buf.trim()) stmts.push(buf.trim());
            return stmts;
          }
          const antecedentStmts = splitRuleBlock(antecedentBlock);
          const consequentStmts = splitRuleBlock(consequentBlock);
          debugLog('[N3LogicParser][RULE][PATCH] antecedentStmts:', antecedentStmts, 'consequentStmts:', consequentStmts);
          // Parse each triple in the antecedent and consequent
          const antecedentTriples = antecedentStmts.flatMap(stmt => this.parseTriples(stmt, true, prefixMap));
          const consequentTriples = consequentStmts.flatMap(stmt => this.parseTriples(stmt, true, prefixMap));
          // EXTRA DEBUG: Log all antecedent and consequent triples and their predicates
          debugLog('[N3LogicParser][RULE][DEBUG] Parsed antecedent triples:', JSON.stringify(antecedentTriples, null, 2));
          antecedentTriples.forEach((triple, idx) => {
            let predType = typeof triple.predicate === 'object' && triple.predicate !== null && 'type' in triple.predicate ? triple.predicate.type : typeof triple.predicate;
            let predValue = typeof triple.predicate === 'object' && triple.predicate !== null && 'value' in triple.predicate ? triple.predicate.value : triple.predicate;
            debugLog(`[N3LogicParser][RULE][DEBUG] Antecedent triple #${idx} predicate:`, triple.predicate, 'type:', predType, 'value:', predValue);
            if (predType === 'IRI' && typeof predValue === 'string' && predValue.startsWith('http')) {
              debugLog(`[N3LogicParser][RULE][DEBUG][CUSTOM BUILTIN] Antecedent triple #${idx} has custom builtin predicate:`, predValue);
            }
          });
          debugLog('[N3LogicParser][RULE][DEBUG] Parsed consequent triples:', JSON.stringify(consequentTriples, null, 2));
          consequentTriples.forEach((triple, idx) => {
            let predType = typeof triple.predicate === 'object' && triple.predicate !== null && 'type' in triple.predicate ? triple.predicate.type : typeof triple.predicate;
            let predValue = typeof triple.predicate === 'object' && triple.predicate !== null && 'value' in triple.predicate ? triple.predicate.value : triple.predicate;
            debugLog(`[N3LogicParser][RULE][DEBUG] Consequent triple #${idx} predicate:`, triple.predicate, 'type:', predType, 'value:', predValue);
          });
          rules.push({
            type: 'Rule',
            antecedent: { type: 'Formula', triples: antecedentTriples },
            consequent: { type: 'Formula', triples: consequentTriples }
          });
        } else {
          debugLog('[N3LogicParser][RULE][WARN] Could not parse rule statement:', stmt);
        }
      } else {
        // Triple: parse as normal
        const tripleCandidates = this.parseTriples(stmt, false, prefixMap);
        // EXTRA DEBUG: Log all parsed triples and their predicates
        tripleCandidates.forEach((triple, idx) => {
          debugLog(`[N3LogicParser][TRIPLE][DEBUG] Parsed triple #${idx}:`, JSON.stringify(triple));
          debugLog(`[N3LogicParser][TRIPLE][DEBUG] Triple #${idx} predicate:`, triple.predicate);
        });
        triples.push(...tripleCandidates);
      }
    }

    debugLog('N3LogicParser: Parsed triples:', JSON.stringify(triples, null, 2));
    debugLog('N3LogicParser: Parsed rules:', JSON.stringify(rules, null, 2));
    const builtins = this.parseBuiltins(commentStripped);
    debugLog('N3LogicParser: Parsed builtins:', JSON.stringify(builtins, null, 2));
    debugTrace && debugTrace('[N3LogicParser][TRACE] Parsing loop complete, triples:', triples, 'rules:', rules);
    return { triples, rules, builtins };
  }

  // Parse triples, supporting literals, variables, lists, blank nodes, multi-line, robustly
  private parseTriples(n3Text: string, allowNoDot = false, prefixMap: Record<string, string> = {}): N3Triple[] {
    debugTrace && debugTrace('[N3LogicParser] parseTriples called:', n3Text, allowNoDot);
    if (typeof n3Text !== 'string') {
      throw new TypeError('parseTriples: Input must be a string');
    }
    if (debugLog) debugLog('[TRACE][parseTriples] input:', JSON.stringify(n3Text));
    const triples: N3Triple[] = [];
    // Always use splitTriples for rule blocks (allowNoDot=true), to robustly split on dot, semicolon, or newline
    let statements: string[];
    let text = n3Text;
    // For rule blocks, remove outer braces but do NOT normalize whitespace
    if (text.startsWith('{') && text.endsWith('}')) {
      text = text.slice(1, -1);
    }
    if (debugLog) debugLog('[TRACE][parseTriples] Splitting rule block:', JSON.stringify(text));
    statements = splitTriples(text, debugLog);
    if (debugLog) debugLog('[TRACE][parseTriples] split statements:', JSON.stringify(statements));
    for (const stmt of statements) {
      if (!stmt) {
        if (debugLog) debugLog('[TRACE][parseTriples] Skipping empty statement');
        continue;
      }
      if (debugLog) debugLog('[TRACE][parseTriples] parsing statement:', JSON.stringify(stmt));
      // Improved regex: match <...> (full IRI), "..." (literal), or any non-whitespace sequence
      // Handles IRIs with : and #, and does not split inside <...>
      // PATCH: Ensure <...> is always a single token, even as predicate
      const tokens = (stmt.match(/<[^>]+>|"(?:[^"\\]|\\.)*"|\S+/g) || []).map((t) => t.trim());
      if (debugLog) debugLog('[TRACE][parseTriples] Tokenized terms:', JSON.stringify(tokens));
      if (tokens.length === 0) {
        if (debugLog) debugLog('[TRACE][parseTriples] Skipping: no tokens');
        continue;
      }
      if (tokens.length % 3 !== 0) {
        if (debugLog) debugLog('[TRACE][parseTriples] WARNING: tokens.length not multiple of 3:', tokens.length, tokens);
        // Enhanced debug: log problematic statement and tokens
        if (debugLog) debugLog('[TRACE][parseTriples][WARNING] Problematic statement:', stmt, 'Tokens:', tokens);
      }
      for (let i = 0; i + 2 < tokens.length; i += 3) {
        // Skip if any token is a rule/control symbol or lone parenthesis
        const t0 = tokens[i], t1 = tokens[i + 1], t2 = tokens[i + 2];
        if (debugLog) debugLog('[TRACE][parseTriples] Triple tokens:', t0, t1, t2);
        if ([t0, t1, t2].some((t) => t === '{' || t === '}' || t === '=>' || t === '' || t === '(' || t === ')')) {
          if (debugLog) debugLog('[TRACE][parseTriples] Skipping invalid triple tokens:', t0, t1, t2);
          continue;
        }
        try {
          const expandPrefixed = (term: string) => {
            // Expand any prefix:suffix where prefix is in prefixMap, suffix can be any non-space, non-colon sequence
            const m = term.match(/^([a-zA-Z_][\w-]*):([^\s]+)$/);
            if (m && prefixMap[m[1]]) {
              const expanded = `<${prefixMap[m[1]]}${m[2]}>`;
              if (debugLog) debugLog('[PREFIX][EXPAND] Expanding', term, 'to', expanded);
              return expanded;
            } else if (m && !prefixMap[m[1]]) {
              if (debugLog) debugLog('[PREFIX][EXPAND][FAIL] No prefix mapping for', m[1], 'in', term);
            }
            // Also log if term looks like a prefix:suffix but is not expanded
            if (/^[a-zA-Z_][\w-]*:[^\s]+$/.test(term) && !m) {
              if (debugLog) debugLog('[PREFIX][EXPAND][WARN] Term looks like prefix:suffix but did not match:', term);
            }
            return term;
          };
          const triple = {
            subject: this.parseTerm(expandPrefixed(t0)),
            predicate: this.parseTerm(expandPrefixed(t1)),
            object: this.parseTerm(expandPrefixed(t2)),
          };
          if (debugLog) debugLog('[TRACE][parseTriples] Parsed triple:', JSON.stringify(triple));
          // Extra debug: highlight custom builtin URIs
          if (triple.predicate && typeof triple.predicate === 'object' && 'value' in triple.predicate) {
            if (typeof triple.predicate.value === 'string' && triple.predicate.value.startsWith('http')) {
              if (debugLog) debugLog('[TRACE][parseTriples][CUSTOM BUILTIN PREDICATE]', triple.predicate.value, JSON.stringify(triple));
            }
            debugLog('[TRACE][parseTriples][PREDICATE TYPE]', triple.predicate && 'type' in triple.predicate ? triple.predicate.type : typeof triple.predicate, 'value:', triple.predicate && 'value' in triple.predicate ? triple.predicate.value : triple.predicate);
          }
          // Extra debug: log predicate type and value for custom builtin URIs
          if (triple.predicate && typeof triple.predicate === 'object' && 'value' in triple.predicate) {
            if (debugLog) debugLog('[TRACE][parseTriples] Predicate type:', triple.predicate.type, 'Predicate value:', triple.predicate.value);
          } else if (triple.predicate && typeof triple.predicate === 'object') {
            if (debugLog) debugLog('[TRACE][parseTriples] Predicate type:', triple.predicate.type, 'Predicate:', JSON.stringify(triple.predicate));
          }
          // Log the fully expanded triple for debug
          if (debugLog) debugLog('[TRACE][parseTriples][EXPANDED TRIPLE]', JSON.stringify(triple));
          triples.push(triple);
        } catch (err) {
          if (debugLog) debugLog('[TRACE][parseTriples] Failed to parse triple:', stmt, err);
          throw new Error(`parseTriples: Failed to parse triple '${stmt}': ${err instanceof Error ? err.message : err}`);
        }
      }
    }
    if (debugLog) debugLog('[TRACE][parseTriples] input string:', n3Text);
    if (debugLog) debugLog('[TRACE][parseTriples] output triples:', JSON.stringify(triples));
    // Log all triples at the end
    if (debugLog) debugLog('[TRACE][parseTriples][FINAL TRIPLES]', JSON.stringify(triples, null, 2));
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
      const iriTerm = { type: 'IRI', value: token.slice(1, -1) } as const;
      debugLog('[parseTerm][RETURN IRI]', token, JSON.stringify(iriTerm));
      return iriTerm;
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
      const varTerm = { type: 'Variable', value: token.slice(1) } as const;
      debugLog('[parseTerm][RETURN VAR]', token, JSON.stringify(varTerm));
      return varTerm;
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
  const fallbackIri = { type: 'IRI', value: token } as const;
  debugLog('[parseTerm][RETURN FALLBACK IRI]', token, JSON.stringify(fallbackIri));
  return fallbackIri;
  }

  // Parse rules, supporting nested formulas and quantifiers
  private parseRules(n3Text: string): N3Rule[] {
    debugTrace && debugTrace('[N3LogicParser] parseRules called:', n3Text);
    if (typeof n3Text !== 'string') {
      throw new TypeError('parseRules: Input must be a string');
    }
    const rules: N3Rule[] = [];
    const ruleBlocks = extractRules(n3Text);
    debugLog('[parseRules][TRACE] Extracted rule blocks:', JSON.stringify(ruleBlocks, null, 2));
    // Enhanced debug: log each rule block with index
    ruleBlocks.forEach((block, idx) => {
      debugLog(`[parseRules][TRACE][BLOCK ${idx}] antecedent:`, block.antecedent);
      debugLog(`[parseRules][TRACE][BLOCK ${idx}] consequent:`, block.consequent);
    });
    // Extract prefix map from n3Text
    const prefixMap = extractPrefixes(n3Text);
    ruleBlocks.forEach((block, idx) => {
      debugLog(`[parseRules][TRACE] Rule block #${idx}:`, JSON.stringify(block));
    });
    for (const { antecedent, consequent } of ruleBlocks) {
      try {
        // Always print antecedent and its split for debug
        debugLog('[parseRules][TRACE] antecedent string:', JSON.stringify(antecedent));
        debugLog('[parseRules][TRACE] consequent string:', JSON.stringify(consequent));
        // Parse the full antecedent and consequent block as a whole (allowNoDot=true), pass prefixMap
        const antecedentTriples = this.parseTriples(antecedent, true, prefixMap);
        const consequentTriples = this.parseTriples(consequent, true, prefixMap);
        debugLog('[parseRules][DEBUG][CUSTOM] Parsed rule antecedent triples:', JSON.stringify(antecedentTriples, null, 2));
        debugLog('[parseRules][DEBUG][CUSTOM] Parsed rule consequent triples:', JSON.stringify(consequentTriples, null, 2));
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
        // Log the fully parsed rule for debug
        debugLog('[parseRules][DEBUG][FINAL RULE]', JSON.stringify({ antecedent: antecedentFormula, consequent: consequentFormula }, null, 2));
      } catch (err) {
        throw new Error(`parseRules: Failed to parse rule: ${err instanceof Error ? err.message : err}`);
      }
    }
    // Log all rules at the end
    debugLog('[parseRules][DEBUG][FINAL RULES]', JSON.stringify(rules, null, 2));
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
