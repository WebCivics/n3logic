import { jest } from '@jest/globals';
// Jest globals are available automatically in ESM mode
/* eslint-env jest */
import { N3LogicAIAgentHelper } from '../n3logic/N3LogicAIAgentHelper';

import path from 'path';
import { fileURLToPath } from 'url';
let __filename: string;
let __dirname: string;
try {
  // Only works in ESM
  // eslint-disable-next-line no-eval
  const metaUrl = eval('import.meta.url');
  __filename = fileURLToPath(metaUrl);
  __dirname = path.dirname(__filename);
} catch {
  // Fallback for CJS
  // @ts-ignore
  __filename = typeof __filename !== 'undefined' ? __filename : '';
  // @ts-ignore
  __dirname = typeof __dirname !== 'undefined' ? __dirname : '';
}

describe('N3LogicAIAgentHelper', () => {
  it('returns capabilities summary', () => {
    const caps = N3LogicAIAgentHelper.getCapabilities();
    expect(caps).toHaveProperty('types');
    expect(caps).toHaveProperty('extensibility');
    expect(caps).toHaveProperty('reasoning');
  });

  it('exampleRegisterBuiltin does not throw', () => {
    const reasoner: any = { registerBuiltin: jest.fn() };
    expect(() => N3LogicAIAgentHelper.exampleRegisterBuiltin(reasoner)).not.toThrow();
    expect(reasoner.registerBuiltin).toHaveBeenCalled();
  });

  it('examplePlugin does not throw', () => {
  const reasoner: any = { on: jest.fn(), use: jest.fn((fn: any) => fn(reasoner)) };
    expect(() => N3LogicAIAgentHelper.examplePlugin(reasoner)).not.toThrow();
  });

  it('exampleHook does not throw', () => {
    const reasoner: any = { on: jest.fn() };
    expect(() => N3LogicAIAgentHelper.exampleHook(reasoner)).not.toThrow();
    expect(reasoner.on).toHaveBeenCalled();
  });
});
