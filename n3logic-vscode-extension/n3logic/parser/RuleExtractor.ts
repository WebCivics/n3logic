
/**
 * Extracts rules and quantifiers from N3/N3Logic text.
 * @param n3Text The N3/N3Logic text to parse.
 * @returns Array of rule objects with antecedent, consequent, and optional quantifiers.
 */
import { debugTrace } from '../reasoner/debug';
export function extractRules(n3Text: string): Array<{ antecedent: string, consequent: string, quantifiers?: string[] }> {
  debugTrace && debugTrace('[RuleExtractor] extractRules called:', n3Text);
  // Normalize line endings
  let preprocessed = n3Text.replace(/\r\n?/g, '\n');
  // Remove comments
  preprocessed = preprocessed.replace(/#[^\n]*/g, '');
  // Remove trailing whitespace (preserve indentation for regex)
  preprocessed = preprocessed.split('\n').map(line => line.replace(/[ \t]+$/, '')).join('\n');
  preprocessed = preprocessed.trim();
  if (typeof (global as any).debugLog === 'function') {
    (global as any).debugLog('[RuleExtractor] Raw input:', n3Text);
    (global as any).debugLog('[RuleExtractor] Preprocessed input:', preprocessed);
  }

  // Extract quantifier line if present (e.g., @forAll ?x .)
  let quantifiers: string[] | undefined = undefined;
  const quantLineMatch = preprocessed.match(/^@forAll\s+([^\n.]*)\s*\./m);
  let rulesText = preprocessed;
  if (quantLineMatch) {
    quantifiers = quantLineMatch[1].trim().split(/\s+/).filter(Boolean);
    rulesText = preprocessed.replace(/^@forAll[^\n.]*\s*\./m, '').trim();
  }

  // Balanced-brace, non-regex rule extraction
  const rules: Array<{ antecedent: string, consequent: string, quantifiers?: string[] }> = [];
  let i = 0;
  while (i < rulesText.length) {
    // Find first '{'
    if (rulesText[i] === '{') {
      let startAnte = i + 1;
      let depth = 1;
      let j = startAnte;
      while (j < rulesText.length && depth > 0) {
        if (rulesText[j] === '{') depth++;
        else if (rulesText[j] === '}') depth--;
        j++;
      }
      if (depth !== 0) {
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog('[RuleExtractor][DEBUG] Unbalanced braces in antecedent');
        }
        break;
      }
      const antecedent = rulesText.slice(startAnte, j - 1).trim();
      // Look for '=>' after closing '}'
      let k = j;
      while (k < rulesText.length && /\s/.test(rulesText[k])) k++;
      if (rulesText.slice(k, k + 2) !== '=>') {
        i = j;
        continue;
      }
      k += 2;
      // Find next '{' for consequent
      while (k < rulesText.length && /\s/.test(rulesText[k])) k++;
      if (rulesText[k] !== '{') {
        i = k;
        continue;
      }
      let startCons = k + 1;
      depth = 1;
      let l = startCons;
      while (l < rulesText.length && depth > 0) {
        if (rulesText[l] === '{') depth++;
        else if (rulesText[l] === '}') depth--;
        l++;
      }
      if (depth !== 0) {
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog('[RuleExtractor][DEBUG] Unbalanced braces in consequent');
        }
        break;
      }
      const consequent = rulesText.slice(startCons, l - 1).trim();
      // Look for trailing dot
      let m = l;
      while (m < rulesText.length && /\s/.test(rulesText[m])) m++;
      if (rulesText[m] !== '.') {
        i = m;
        continue;
      }
      // Debug output for each rule
      if (typeof (global as any).debugLog === 'function') {
        (global as any).debugLog('[RuleExtractor][DEBUG] Extracted antecedent:', antecedent);
        (global as any).debugLog('[RuleExtractor][DEBUG] Extracted consequent:', consequent);
      }
      // Split on dot for triples
      const antecedentSplit = antecedent.split(/\s*\.\s*/).map(s => s.trim()).filter(Boolean).join(' . ');
      const consequentSplit = consequent.split(/\s*\.\s*/).map(s => s.trim()).filter(Boolean).join(' . ');
      if (typeof (global as any).debugLog === 'function') {
        (global as any).debugLog('[RuleExtractor][DEBUG] antecedentSplit:', antecedentSplit);
        (global as any).debugLog('[RuleExtractor][DEBUG] consequentSplit:', consequentSplit);
      }
      if (antecedentSplit && consequentSplit) {
        if (quantifiers && rules.length === 0) {
          rules.push({ antecedent: antecedentSplit, consequent: consequentSplit, quantifiers });
        } else {
          rules.push({ antecedent: antecedentSplit, consequent: consequentSplit });
        }
      }
      i = m + 1;
    } else {
      i++;
    }
  }
  if (typeof (global as any).debugLog === 'function') {
    (global as any).debugLog('[RuleExtractor] Final extracted rules:', JSON.stringify(rules, null, 2));
  }
  return rules;
}
