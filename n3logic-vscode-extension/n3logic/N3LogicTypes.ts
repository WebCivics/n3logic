// N3LogicTypes.ts
// Types and interfaces for N3Logic reasoning engine (npm package version)
export type N3Term = string | N3Variable | N3Literal | N3BlankNode | N3IRI | N3Formula | N3List;
// List support for N3 Logic
export interface N3List {
  type: 'List';
  elements: N3Term[];
}
// Statement with optional graph/context
export interface N3Statement {
  subject: N3Term;
  predicate: N3Term;
  object: N3Term;
  graph?: N3Term;
}
// Environment for variable bindings
export type N3Bindings = Record<string, N3Term>;
// Reasoner interface for N3 Logic
export interface N3Reasoner {
  addTriple(triple: N3Triple): void;
  addRule(rule: N3Rule): void;
  addBuiltin(builtin: N3Builtin): void;
  infer(): void;
  getTriples(): N3Triple[];
  getRules(): N3Rule[];
  getBuiltins(): N3Builtin[];
  query(formula: N3Formula, bindings?: N3Bindings): N3Bindings[];
}

export interface N3Variable {
  type: 'Variable';
  value: string;
}

export interface N3Literal {
  type: 'Literal';
  value: string;
  datatype?: string;
  language?: string;
}

export interface N3BlankNode {
  type: 'BlankNode';
  value: string;
}

export interface N3IRI {
  type: 'IRI';
  value: string;
}

export interface N3Triple {
  subject: N3Term;
  predicate: N3Term;
  object: N3Term;
}

export interface N3Formula {
  type: 'Formula';
  triples: N3Triple[];
  quantifiers?: N3Quantifier[];
}

export type N3Quantifier = N3ForAll | N3Exists;

export interface N3ForAll {
  type: 'ForAll';
  variables: N3Variable[];
  formula: N3Formula;
}

export interface N3Exists {
  type: 'Exists';
  variables: N3Variable[];
  formula: N3Formula;
}

export interface N3Rule {
  type: 'Rule';
  antecedent: N3Formula;
  consequent: N3Formula;
}

export interface N3Builtin {
  uri: string;
  arity: number;
  apply: (...args: N3Term[]) => boolean | N3Term | N3Term[];
  description?: string;
}

export interface N3LogicDocument {
  triples: N3Triple[];
  rules: N3Rule[];
  builtins?: N3Builtin[];
}
