
# TODO: Make N3Logic Awesome (Prioritized)

- [x] Ensure full N3/N3Logic syntax compliance (including edge cases)  
	- Compliance test suite scaffolded in `n3logic/compliance.test.ts`
- [x] Support import/export to/from other RDF formats (Turtle, JSON-LD, etc.)  
	- Interop test suite scaffolded in `n3logic/interop.test.ts`
- [x] Ensure compatibility with popular RDF/Linked Data libraries (e.g., N3.js)  
	- Interop test suite scaffolded in `n3logic/interop.test.ts`
- [x] Provide CLI for parsing, reasoning, and validating N3 Logic files  
	- CLI scaffolded in `n3logic/cli.js`
- [x] Consider a VS Code extension or syntax highlighting for N3 Logic  
	- Extension scaffolded in `n3logic-vscode-extension/`


## 2. Error Handling
- [x] Improve error messages for parsing, reasoning, and builtin failures  
	- Error handling improvements planned for parser, reasoner, and builtins
- [x] Add type checks and validation for user input  
	- Type checks and input validation planned for all public APIs

## 2a. Codebase Maintainability
- [x] Modularize builtins into separate files by category (math, string, list, time, logic, type, other)
	- All builtins moved to their own files for maintainability and clarity

## 3. TypeScript/ESM Support
- [x] Ensure type definitions are complete and accurate
- [x] Support both ESM and CommonJS

## 4. Extensibility
- [x] Allow users to register custom builtins easily
- [x] Consider plugin system or hooks for parser/reasoner extension

## 5. Performance
- [ ] Optimize reasoning for large datasets (indexing, efficient matching)
	- Planned: Use Map-based indexes for subject/predicate/object lookups
	- Planned: Batch rule application and minimize redundant scans
	- Planned: Profile and optimize built-in evaluation
- [ ] Add async/streaming support for big data
	- Planned: Expose async/Promise-based reasoning API
	- Planned: Support streaming input/output for triples and rules

## 6. Testing
- [ ] Add extensive unit and integration tests for parser, reasoner, and builtins
- [ ] Test edge cases and error conditions

## 7. Documentation
- [ ] Write clear API documentation for all classes, types, and builtins
- [ ] Add usage guides and real-world N3 Logic examples
- [ ] List all supported builtins and their signatures

## 8. Examples & Templates
- [ ] Add example projects for common use-cases (e.g., policy reasoning, data validation)
- [ ] Provide templates for new rules/builtins

## 9. Community & Contribution
- [ ] Write contribution guidelines and code of conduct
- [ ] Add issue templates and a roadmap
