
# Problems in Failing Tests (as of Aug 1, 2025)

## 1. tests/builtins/N3LogicLogicBuiltins.test.ts
### Problem: log:or returns true if either is true (string and boolean cases)
- **Description:**
  - The test expects that `log:or(lit('x'), lit(''))` and `log:or(lit(''), lit('x'))` both return `true`.
  - The current implementation still returns `false` for `log:or(lit('x'), lit(''))` (or the reverse), which is incorrect.
  - Multiple attempts to fix the logic, value extraction, and symmetry have not resolved the issue.
- **Root Cause (as of Aug 1, 2025):**
  - The `isTruthy` function and value extraction logic have been refactored to treat both arguments identically and symmetrically, always using string comparison except for booleans.
  - Despite this, the test still fails, suggesting the issue may be deeper (possibly in the test harness, argument construction, or an unexpected mutation/side effect).
  - Debug output for the failing case confirms correct argument construction and value extraction, but the result is still incorrect.
- **Next Steps & Debug Recommendations:**
  - Add debug output in the test and in the `log:or` builtin to print the actual arguments, their extracted values, and the computed truthiness for each call.
  - Print the result of `isTruthy` for both arguments and the final result of `log:or`.
  - Check for any mutation or caching of arguments between calls.

## 2. tests/reasoner.test.ts
### Problem: N3LogicReasoner › supports custom builtins
- **Description:**
  - The test expects 3 inferred triples, but only 2 are produced.
  - The rule involving a custom builtin is not firing as expected.
- **Root Cause (as of Aug 1, 2025):**
  - The parser and rule extractor are robust and extract the rule, but the matcher or reasoner is not invoking the custom builtin as intended.
  - The matcher logic for builtins is under investigation to ensure the registered custom builtin is called for the triple with the custom predicate.
  - All code for custom builtin registration and merging is now robust and correct, but the matcher still does not find the custom predicate in the builtins list at match time.
  - This may be due to a scoping or timing issue, or an accidental overwrite of the builtins list.
- **Next Steps & Debug Recommendations:**
  - Add debug output in the matcher and reasoner to print the full builtins list (URIs) immediately before matching each triple.
  - Print the builtins list after every registration and ontology load.
  - Print the predicate URI being checked for a builtin match, and whether it is found in the builtins list.
  - Check for accidental overwrites or scoping issues with the builtins list between registration, ontology load, and reasoning.

