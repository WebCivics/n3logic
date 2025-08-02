
/**
 * Extracts rules and quantifiers from N3/N3Logic text.
 * @param n3Text The N3/N3Logic text to parse.
 * @returns Array of rule objects with antecedent, consequent, and optional quantifiers.
 */
import { debugTrace } from '../reasoner/debug';
export function extractRules(n3Text: string): Array<{ antecedent: string, consequent: string, quantifiers?: string[] }> {
  debugTrace && debugTrace('[RuleExtractor] extractRules called:', n3Text);
  if (typeof (global as any).debugLog === 'function') {
    (global as any).debugLog('[RuleExtractor][TRACE] Raw input:', n3Text);
  }
  // Normalize line endings and remove comments
  let preprocessed = n3Text.replace(/\r\n?/g, '\n');
  preprocessed = preprocessed.replace(/#[^\n]*/g, '');
  preprocessed = preprocessed.trim();
  if (typeof (global as any).debugLog === 'function') {
    (global as any).debugLog('[RuleExtractor][TRACE] Preprocessed input:', preprocessed);
  }

  // State machine to extract { ... } => { ... } . rule blocks robustly
  const rules: Array<{ antecedent: string, consequent: string, quantifiers?: string[] }> = [];
  let i = 0;
  while (i < preprocessed.length) {
    // Find first '{'
    if (preprocessed[i] === '{') {
      if (typeof (global as any).debugLog === 'function') {
        (global as any).debugLog(`[RuleExtractor][TRACE] Found '{{' at index ${i}`);
      }
      let anteStart = i + 1;
      let depth = 1;
      let j = anteStart;
      while (j < preprocessed.length && depth > 0) {
        if (preprocessed[j] === '{') depth++;
        else if (preprocessed[j] === '}') depth--;
        j++;
      }
      if (typeof (global as any).debugLog === 'function') {
        (global as any).debugLog(`[RuleExtractor][TRACE] Antecedent block: [${anteStart}, ${j - 1}], depth=${depth}`);
      }
      if (depth !== 0) {
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog('[RuleExtractor][ERROR] Unbalanced braces in antecedent');
        }
        break; // Unbalanced braces
      }
      const antecedent = preprocessed.slice(anteStart, j - 1).trim();
      if (typeof (global as any).debugLog === 'function') {
        (global as any).debugLog('[RuleExtractor][TRACE] Extracted antecedent:', antecedent);
      }
      // Look for '=>' after closing '}'
      let k = j;
      while (k < preprocessed.length && /\s/.test(preprocessed[k])) k++;
      if (preprocessed.slice(k, k + 2) !== '=>') { 
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog(`[RuleExtractor][TRACE] No '=>' found after antecedent at index ${k}`);
        }
        i = j; continue; 
      }
      k += 2;
      while (k < preprocessed.length && /\s/.test(preprocessed[k])) k++;
      if (preprocessed[k] !== '{') { 
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog(`[RuleExtractor][TRACE] No '{{' found after '=>' at index ${k}`);
        }
        i = k; continue; 
      }
      let consStart = k + 1;
      depth = 1;
      let l = consStart;
      while (l < preprocessed.length && depth > 0) {
        if (preprocessed[l] === '{') depth++;
        else if (preprocessed[l] === '}') depth--;
        l++;
      }
      if (typeof (global as any).debugLog === 'function') {
        (global as any).debugLog(`[RuleExtractor][TRACE] Consequent block: [${consStart}, ${l - 1}], depth=${depth}`);
      }
      if (depth !== 0) {
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog('[RuleExtractor][ERROR] Unbalanced braces in consequent');
        }
        break; // Unbalanced braces
      }
      const consequent = preprocessed.slice(consStart, l - 1).trim();
      if (typeof (global as any).debugLog === 'function') {
        (global as any).debugLog('[RuleExtractor][TRACE] Extracted consequent:', consequent);
      }
      // Look for trailing dot
      let m = l;
      while (m < preprocessed.length && /\s/.test(preprocessed[m])) m++;
      if (preprocessed[m] !== '.') { 
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog(`[RuleExtractor][TRACE] No trailing dot after consequent at index ${m}`);
        }
        i = m; continue; 
      }
      if (antecedent && consequent) {
        if (typeof (global as any).debugLog === 'function') {
          (global as any).debugLog('[RuleExtractor][TRACE] Pushing rule:', { antecedent, consequent });
        }
        rules.push({ antecedent, consequent });
      }
      i = m + 1;
    } else {
      i++;
    }
  }
  if (typeof (global as any).debugLog === 'function') {
    (global as any).debugLog('[RuleExtractor] Final extracted rules (state machine):', JSON.stringify(rules, null, 2));
  }
  return rules;
  if (typeof (global as any).debugLog === 'function') {
    (global as any).debugLog('[RuleExtractor] Raw input:', n3Text);
    (global as any).debugLog('[RuleExtractor] Preprocessed input:', preprocessed);
  }

  // (Old balanced-brace extraction removed; now handled by regex above)
}
