

# Problems in Failing Tests (as of Aug 1, 2025)

## 1. tests/builtins/N3LogicLogicBuiltins.test.ts
### Problem: log:or returns true if either is true (string and boolean cases)
- **Description:**
  - The test expects that `log:or(lit('x'), lit(''))` and `log:or(lit(''), lit('x'))` both return `true`.
  - The current implementation still returns `false` for these cases, which is incorrect.
  - Multiple attempts to fix the logic, value extraction, and symmetry have not resolved the issue, and the number of failing tests has increased.
- **Current Diagnosis:**
  - The `isTruthy` function and value extraction logic have been refactored for symmetry and correct string/boolean handling.
  - Despite this, the test still fails, and deep debug output inside `log:or` is not appearing in the logs, suggesting the builtin may not be invoked at all.
  - Additional matcher and builtin debug output is missing, indicating a possible issue with matcher-to-builtin mapping or registration.
- **Hypotheses:**
  - The matcher may not be mapping the predicate URI to the builtin function, so `log:or` is never called.
  - There could be a scoping, registration, or timing issue with the builtins list.
  - The test harness or argument construction may be faulty, but debug output suggests arguments are constructed as expected.
- **Next Steps:**
  1. Add a top-level debug statement at the entry of the `log:or` function to confirm invocation.
  2. Add debug output in the matcher before invoking any builtin, logging the function name and arguments.
  3. Print the builtins list and predicate URI at match time.
  4. Check for accidental overwrites or scoping issues with the builtins list.

## 2. tests/reasoner.test.ts
### Problem: N3LogicReasoner › supports custom builtins
- **Description:**
  - The test expects 3 inferred triples, but only 2 are produced. The rule involving a custom builtin is not firing.
- **Current Diagnosis:**
  - The parser and rule extractor are robust, but the matcher or reasoner is not invoking the custom builtin.
  - The matcher does not find the custom predicate in the builtins list at match time, despite correct registration.
- **Hypotheses:**
  - The builtins list may be overwritten or not merged correctly after registration or ontology load.
  - There may be a timing or scoping issue with when builtins are available to the matcher.
- **Next Steps:**
  1. Add debug output in the matcher and reasoner to print the full builtins list (URIs) before matching each triple.
  2. Print the builtins list after every registration and ontology load.
  3. Print the predicate URI being checked for a builtin match, and whether it is found.
  4. Check for accidental overwrites or scoping issues with the builtins list.

## 3. General Observations
- **Debug Output:**
  - The absence of expected debug output from `log:or` and `isTruthy` strongly suggests the builtin is not being called, pointing to a matcher or registration issue rather than a logic bug in the builtin itself.
  - Additional failures in forward chaining and plugin/hook support may indicate a broader issue with triple matching or builtin invocation, not just with `log:or`.
- **Other Failing Tests:**
  - The number of failing tests has increased, suggesting that recent changes have introduced new issues or exposed latent ones.

## 4. Action Plan
- Instrument matcher and builtin registration with deep debug output at every stage (registration, ontology load, match time, and invocation).
- Confirm builtin invocation paths and log all arguments and results.
- Investigate builtins list scoping and timing.
- Re-run tests and analyze logs for builtin invocation and matching.

---

**Note:**
Recent changes have not only failed to resolve the original issues but have also increased the number of failing tests. The next round of debugging must focus on maximum traceability and verification of matcher-to-builtin mapping, registration, and invocation, with explicit logging at every step.

