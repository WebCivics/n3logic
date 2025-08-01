
/**
 * Extracts rules and quantifiers from N3/N3Logic text.
 * @param n3Text The N3/N3Logic text to parse.
 * @returns Array of rule objects with antecedent, consequent, and optional quantifiers.
 */
export function extractRules(n3Text: string): Array<{ antecedent: string, consequent: string, quantifiers?: string[] }> {
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
  // Improved regex: only match @forAll at the start of a line, followed by variables, ending with a dot
  const quantLineMatch = preprocessed.match(/^@forAll\s+([^\n.]*)\s*\./m);
  let rulesText = preprocessed;
  if (quantLineMatch) {
    quantifiers = quantLineMatch[1].trim().split(/\s+/).filter(Boolean);
    // Remove quantifier line from rules text
    rulesText = preprocessed.replace(/^@forAll[^\n.]*\s*\./m, '').trim();
  }

  // Use a regex to match { ... } => { ... } . blocks
  const ruleRegex = /(^|\n)[ \t]*\{([\s\S]*?)\}[ \t]*=>[ \t]*\{([\s\S]*?)\}[ \t]*\./gm;
  const rules: Array<{ antecedent: string, consequent: string, quantifiers?: string[] }> = [];
  let match: RegExpExecArray | null;
  while ((match = ruleRegex.exec(rulesText)) !== null) {
    if (typeof (global as any).debugLog === 'function') {
      (global as any).debugLog('[RuleExtractor] Matched rule block:', match[0]);
    }
    const antecedent = match[2].trim();
    const consequent = match[3].trim();
    if (typeof (global as any).debugLog === 'function') {
      (global as any).debugLog('[RuleExtractor] Extracted antecedent:', antecedent);
      (global as any).debugLog('[RuleExtractor] Extracted consequent:', consequent);
    }
    if (antecedent && consequent) {
      // Attach quantifiers only to the first rule (if present)
      if (quantifiers && rules.length === 0) {
        rules.push({ antecedent, consequent, quantifiers });
      } else {
        rules.push({ antecedent, consequent });
      }
    }
  }
  if (typeof (global as any).debugLog === 'function') {
    (global as any).debugLog('[RuleExtractor] Final extracted rules:', JSON.stringify(rules, null, 2));
  }
  return rules;
}
