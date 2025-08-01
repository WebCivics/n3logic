// Dummy value exports for test compatibility (with Value suffix)
const N3TermValue = {};
const N3VariableValue = {};
const N3LiteralValue = {};
const N3BlankNodeValue = {};
const N3IRIValue = {};
const N3TripleValue = {};
const N3FormulaValue = {};
const N3QuantifierValue = {};
const N3ForAllValue = {};
const N3ExistsValue = {};
const N3RuleValue = {};
const N3BuiltinValue = {};
const N3LogicDocumentValue = {};
const N3ListValue = {};
const N3StatementValue = {};
const N3BindingsValue = {};
const N3ReasonerValue = {};

// Default export for compatibility with Types.default
const Types = {
  N3Term: N3TermValue,
  N3Variable: N3VariableValue,
  N3Literal: N3LiteralValue,
  N3BlankNode: N3BlankNodeValue,
  N3IRI: N3IRIValue,
  N3Triple: N3TripleValue,
  N3Formula: N3FormulaValue,
  N3Quantifier: N3QuantifierValue,
  N3ForAll: N3ForAllValue,
  N3Exists: N3ExistsValue,
  N3Rule: N3RuleValue,
  N3Builtin: N3BuiltinValue,
  N3LogicDocument: N3LogicDocumentValue,
  N3List: N3ListValue,
  N3Statement: N3StatementValue,
  N3Bindings: N3BindingsValue,
  N3Reasoner: N3ReasonerValue,
};
export default Types;
// Named value exports for test compatibility
export const N3Term = Types.N3Term;
export const N3Variable = Types.N3Variable;
export const N3Literal = Types.N3Literal;
export const N3BlankNode = Types.N3BlankNode;
export const N3IRI = Types.N3IRI;
export const N3Triple = Types.N3Triple;
export const N3Formula = Types.N3Formula;
export const N3Quantifier = Types.N3Quantifier;
export const N3ForAll = Types.N3ForAll;
export const N3Exists = Types.N3Exists;
export const N3Rule = Types.N3Rule;
export const N3Builtin = Types.N3Builtin;
export const N3LogicDocument = Types.N3LogicDocument;
export const N3List = Types.N3List;
export const N3Statement = Types.N3Statement;
export const N3Bindings = Types.N3Bindings;
export const N3Reasoner = Types.N3Reasoner;
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
