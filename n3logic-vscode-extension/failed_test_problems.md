# Problems in Failing Tests

## 1. tests/builtins/N3LogicLogicBuiltins.test.ts
### Problem: log:or returns true if either is true (string and boolean cases)
- **Description:**
  - The test expects that `log:or(lit('x'), lit(''))` and `log:or(lit(''), lit('x'))` both return `true`.
  - The current implementation still returns `false` for `log:or(lit('x'), lit(''))` (or the reverse), which is incorrect.
  - Multiple attempts to fix the logic, value extraction, and symmetry have not resolved the issue.
- **Root Cause (as of Aug 1, 2025):**
  - The `isTruthy` function and value extraction logic have been refactored to treat both arguments identically and symmetrically, always using string comparison except for booleans.
  - Despite this, the test still fails, suggesting the issue may be deeper (possibly in the test harness, argument construction, or an unexpected mutation/side effect).
  - Debug output for the failing case should be analyzed to determine the actual values and truthiness being computed at runtime.

## 2. tests/reasoner.test.ts
### Problem: N3LogicReasoner › supports custom builtins
- **Description:**
  - The test expects 3 inferred triples, but only 2 are produced.
  - The rule involving a custom builtin is not firing as expected.
- **Root Cause (as of Aug 1, 2025):**
  - The parser and rule extractor are now robust and extract the rule, but the matcher or reasoner is not invoking the custom builtin as intended.
  - The matcher logic for builtins is under investigation to ensure the registered custom builtin is called for the triple with the custom predicate.
  - This may be due to issues in builtin triple matching, argument binding, or builtin registration in the reasoner.

