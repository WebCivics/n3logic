// RuleExtractor.ts
// Utility for extracting rules from N3/N3Logic text
import { N3Rule } from '../N3LogicTypes';

export function extractRules(n3Text: string): Array<{ antecedent: string, consequent: string }> {
  // Normalize line endings and whitespace for robust matching
  let preprocessed = n3Text.replace(/\r\n?/g, '\n');
  // Put every rule block on its own line to help regex matching
  preprocessed = preprocessed.replace(/\}\s*=>\s*\{/g, '\n} => {\n');
  preprocessed = preprocessed.replace(/\.(\s*)\{/g, '.\n{');
  // Allow for arbitrary whitespace, comments, and multiline rules
  // This regex matches { ... } => { ... } . blocks, including those with custom builtins or IRIs
  const ruleRegex = /\{([\s\S]*?)\}\s*=>\s*\{([\s\S]*?)\}\s*\./g;
  let match;
  const rules: Array<{ antecedent: string, consequent: string }> = [];
  while ((match = ruleRegex.exec(preprocessed)) !== null) {
    // Remove trailing dot from inside the block if present, and trim whitespace
    const antecedent = match[1].replace(/\s*\.$/, '').trim();
    const consequent = match[2].replace(/\s*\.$/, '').trim();
    // Only add non-empty rules
    if (antecedent && consequent) {
      rules.push({ antecedent, consequent });
    }
  }
  return rules;
}
