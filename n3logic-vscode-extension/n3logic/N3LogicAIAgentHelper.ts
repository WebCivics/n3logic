// N3LogicAIAgentHelper.ts
// Helper for AI Agents to comprehend and utilize the N3Logic NPM package capabilities

import * as N3Logic from './index';

/**
 * N3LogicAIAgentHelper provides a high-level overview and programmatic access
 * to the capabilities, extensibility points, and usage patterns of the N3Logic package.
 * Intended for AI agents, LLMs, and automation tools.
 */
export class N3LogicAIAgentHelper {
  /**
   * Returns a summary of the N3Logic package's main features and extensibility points.
   */
  static getCapabilities(): Record<string, any> {
    return {
      types: Object.keys(N3Logic),
      extensibility: {
        registerBuiltin: 'Register custom builtins for reasoning',
        usePlugin: 'Register plugins to extend or observe the reasoner',
        onHook: 'Attach hooks to reasoning lifecycle events',
      },
      reasoning: 'Forward chaining, built-in evaluation, quantifier and formula support',
      parser: 'Full N3/N3Logic syntax, robust error handling',
      builtins: 'Modular, extensible, covers math, string, list, time, logic, type, and more',
      interop: 'Import/export RDF formats, compatible with N3.js',
      cli: 'Parse, reason, and validate N3 Logic files from the command line',
      vscode: 'Syntax highlighting extension for N3 Logic',
    };
  }

  /**
   * Example: Register a custom builtin
   */
  static exampleRegisterBuiltin(reasoner: any) {
    reasoner.registerBuiltin({
      uri: 'http://example.org/custom#alwaysTrue',
      arity: 1,
      description: 'Always returns true',
      apply: () => true
    });
  }

  /**
   * Example: Use a plugin to log reasoning steps
   */
  static examplePlugin(reasoner: any) {
    reasoner.use((r: any) => {
      r.on('afterRuleApplied', (rule: any, triple: any, bindings: any) => {
        console.log('Rule applied:', rule, triple, bindings);
      });
    });
  }

  /**
   * Example: Attach a hook to observe reasoning
   */
  static exampleHook(reasoner: any) {
    reasoner.on('afterReason', (triples: any) => {
      console.log('Reasoning complete. Triples:', triples);
    });
  }
}

// Usage: See README and API docs for more details.
