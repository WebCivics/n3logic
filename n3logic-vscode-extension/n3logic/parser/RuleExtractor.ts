// RuleExtractor.ts
// Utility for extracting rules from N3/N3Logic text
import { N3Rule } from '../N3LogicTypes';

export function extractRules(n3Text: string): Array<{ antecedent: string, consequent: string }> {
  // Normalize line endings
  let preprocessed = n3Text.replace(/\r\n?/g, '\n');
  // Remove comments
  preprocessed = preprocessed.replace(/#[^\n]*/g, '');
  // Trim each line to remove leading/trailing whitespace and indentation
  preprocessed = preprocessed.split('\n').map(line => line.trim()).join('\n');
  preprocessed = preprocessed.trim();
  if (typeof (global as any).debugLog === 'function') {
    (global as any).debugLog('[RuleExtractor] Raw input:', n3Text);
    (global as any).debugLog('[RuleExtractor] Preprocessed input:', preprocessed);
  }
  // Use a regex to match { ... } => { ... } . blocks, tolerant of whitespace/newlines
  const ruleRegex = /\{([\s\S]*?)\}\s*=>\s*\{([\s\S]*?)\}\s*\./g;
  const rules: Array<{ antecedent: string, consequent: string }> = [];
  let match;
  while ((match = ruleRegex.exec(preprocessed)) !== null) {
    if (typeof (global as any).debugLog === 'function') {
      (global as any).debugLog('[RuleExtractor] Matched rule block:', match[0]);
    }
    const antecedent = match[1].replace(/\s*\.$/, '').trim();
    const consequent = match[2].replace(/\s*\.$/, '').trim();
    if (typeof (global as any).debugLog === 'function') {
      (global as any).debugLog('[RuleExtractor] Extracted antecedent:', antecedent);
      (global as any).debugLog('[RuleExtractor] Extracted consequent:', consequent);
    }
    if (antecedent && consequent) {
      rules.push({ antecedent, consequent });
    }
  }
  if (typeof (global as any).debugLog === 'function') {
    (global as any).debugLog('[RuleExtractor] Final extracted rules:', JSON.stringify(rules, null, 2));
  }
  return rules;
}
