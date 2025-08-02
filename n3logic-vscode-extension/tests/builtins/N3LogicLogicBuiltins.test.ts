  // getValue is now imported at the top for ESM compatibility
import { LogicBuiltins } from '../../n3logic/builtins/N3LogicLogicBuiltins';
import { N3Term } from '../../n3logic/N3LogicTypes';


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logFile = path.resolve(__dirname, '../../logs/esm/N3LogicLogicBuiltins.test.log');
let originalLog: ((...args: any[]) => void) | undefined;
let originalDebug: ((...args: any[]) => void) | undefined;
function logToFile(...args: any[]): void {
  const msg = args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ');
  fs.appendFileSync(logFile, msg + '\n');
  if (originalLog) originalLog.apply(console, args);
}
function flushLog(): void {
  if (fs.fsyncSync) {
    const fd = fs.openSync(logFile, 'r+');
    fs.fsyncSync(fd);
    fs.closeSync(fd);
  }
}
function debugCase(
  label: string,
  a: any,
  b: any,
  expected: any,
  result: any,
): void {
  logToFile(`[${label}] a=`, a, 'b=', b, 'result=', result, 'expected=', expected,
    'typeof a:', typeof a, 'typeof b:', typeof b,
    'a.value:', a && a.value, 'b.value:', b && b.value,
    'a === b:', a === b,
  );
  logToFile(`[${label}][JSON]`, {
    a: JSON.stringify(a), b: JSON.stringify(b), expected, result,
  });
  flushLog();
}
beforeAll((): void => {
  originalLog = console.log;
  originalDebug = console.debug;
  fs.writeFileSync(logFile, '');
  console.log = logToFile;
  console.debug = logToFile;
});
afterAll((): void => {
  if (originalLog) console.log = originalLog;
  if (originalDebug) console.debug = originalDebug;
  // Append main debug log to per-test log for full traceability
  // ...existing code...
  // path and fs already imported at top
  const logsDir = path.resolve(__dirname, '../../logs');
  const debugLogs = ['debug.cjs.log', 'debug.esm.log'];
  for (const dbg of debugLogs) {
    const dbgPath = path.join(logsDir, dbg);
    if (fs.existsSync(dbgPath)) {
      const dbgContent = fs.readFileSync(dbgPath, 'utf8');
      fs.appendFileSync(logFile, `\n==== Appended ${dbg} ===\n` + dbgContent + '\n==== End of ' + dbg + ' ===\n');
    }
  }
});

describe('LogicBuiltins', () => {
  // Helper for string literal
  const lit = (v: any) => ({ type: 'Literal', value: typeof v === 'boolean' ? (v ? 'true' : 'false') : String(v) } as const);
  // Helper for RDF boolean literal
  const boolLit = (v: boolean) => ({ type: 'Literal', value: v ? 'true' : 'false' } as const);

  it('log:not returns true if argument is false', () => {
    const fn = LogicBuiltins.find((b) => b.uri.includes('not'));
    const cases = [
      { input: lit(''), expected: true },
      { input: lit(false), expected: true },
      { input: lit('x'), expected: false },
    ];
    cases.forEach(({ input, expected }, idx) => {
      const result = fn?.apply(input);
      console.log(`[TEST log:not case #${idx}] input=`, input, 'result=', result, 'expected=', expected);
      expect(result).toBe(expected);
    });
  });

  it('log:equalTo returns true if values are equal', () => {
    const fn = LogicBuiltins.find((b) => b.uri.includes('equalTo'));
    const cases = [
      { a: lit('a'), b: lit('a'), expected: true },
      { a: lit('a'), b: lit('b'), expected: false },
    ];
    cases.forEach(({ a, b, expected }, idx) => {
      const result = fn?.apply(a, b);
      console.log(`[TEST log:equalTo case #${idx}] a=`, a, 'b=', b, 'result=', result, 'expected=', expected);
      expect(result).toBe(expected);
    });
  });

  it('log:or returns true if either is true (string and boolean cases)', () => {
    const fn = LogicBuiltins.find((b) => b.uri.includes('or'));
    // String cases
    const cases = [
      { a: lit(''), b: lit('x'), expected: true },
      { a: lit('x'), b: lit(''), expected: true },
      { a: lit(''), b: lit(''), expected: false },
    ];
  // getValue is imported at the top level for ESM compatibility
    cases.forEach(({ a, b, expected }, idx) => {
      const result = fn?.apply(a, b);
      debugCase(`log:or string case #${idx}`, a, b, expected, result);
      expect(result).toBe(expected);
    });
    // Boolean RDF literal cases
    const boolCases = [
      { a: boolLit(false), b: boolLit(true), expected: true },
      { a: boolLit(true), b: boolLit(false), expected: true },
      { a: boolLit(false), b: boolLit(false), expected: false },
      { a: boolLit(true), b: boolLit(true), expected: true },
    ];
    boolCases.forEach(({ a, b, expected }, idx) => {
      const result = fn?.apply(a, b);
      debugCase(`log:or bool case #${idx}`, a, b, expected, result);
      expect(result).toBe(expected);
    });
    // Edge cases
    const edgeCases = [
      { a: lit(''), b: lit(''), expected: false },
      { a: lit('true'), b: lit(''), expected: true },
      { a: lit(''), b: lit('true'), expected: true },
      { a: lit('false'), b: lit('false'), expected: false },
      { a: lit('false'), b: lit('true'), expected: true },
      { a: lit('x'), b: lit(''), expected: true },
      { a: lit(''), b: lit('x'), expected: true },
      { a: lit('x'), b: lit('y'), expected: true },
      { a: lit('false'), b: lit('x'), expected: true },
      { a: lit('x'), b: lit('false'), expected: true },
    ];
    edgeCases.forEach(({ a, b, expected }, idx) => {
      const result = fn?.apply(a, b);
      debugCase(`log:or edge case #${idx}`, a, b, expected, result);
      expect(result).toBe(expected);
    });
    // Randomized
    for (let i = 0; i < 5; i++) {
      const randVal = () => Math.random() > 0.5 ? lit('true') : lit('');
      const a = randVal();
      const b = randVal();
      const expected = a.value === 'true' || b.value === 'true';
      const result = fn?.apply(a, b);
      debugCase(`log:or random case #${i}`, a, b, expected, result);
      expect(result).toBe(expected);
    }
  });

  it('log:and returns true if both are true', () => {
    const fn = LogicBuiltins.find((b) => b.uri.includes('and'));
    expect(fn?.apply(lit('x'), lit('y'))).toBe(true);
    expect(fn?.apply(lit('x'), lit(''))).toBe(false);
  });

  it('log:xor returns true if values differ', () => {
    const fn = LogicBuiltins.find((b) => b.uri.includes('xor'));
    expect(fn?.apply(lit('x'), lit(''))).toBe(true);
    expect(fn?.apply(lit('x'), lit('x'))).toBe(false);
  });

  it('log:if returns then/else based on cond', () => {
    const fn = LogicBuiltins.find((b) => b.uri.includes('if'));
    expect(fn?.apply(lit(true), lit('then'), lit('else'))).toEqual(lit('then'));
    expect(fn?.apply(lit(false), lit('then'), lit('else'))).toEqual(lit('else'));
  });

  it('log:distinct returns true if values differ', () => {
    const fn = LogicBuiltins.find((b) => b.uri.includes('distinct'));
    expect(fn?.apply(lit('a'), lit('b'))).toBe(true);
    expect(fn?.apply(lit('a'), lit('a'))).toBe(false);
  });
});
