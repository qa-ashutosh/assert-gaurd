import path from 'path';
import fs from 'fs';
import os from 'os';
import { runScan } from '../../src/engine/scanner';
import type { AssertGuardConfig } from '../../src/types';

const DEFAULT_CONFIG: AssertGuardConfig = {
  rules: {
    'no-hard-waits': 'error',
    'no-focused-tests': 'error',
    'no-flaky-selectors': 'warn',
    'no-logic-in-tests': 'error',
    'single-assertion-focus': 'warn',
    'test-isolation-check': 'info',
    'no-hardcoded-credentials': 'error',
  },
  maxAssertionsPerTest: 5,
};

function writeTempFile(content: string, name = 'temp.spec.ts'): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ag-test-'));
  const file = path.join(dir, name);
  fs.writeFileSync(file, content, 'utf-8');
  return file;
}

describe('runScan', () => {
  it('returns gateStatus passed for clean files', () => {
    const file = writeTempFile(`
      describe('suite', () => {
        it('does something', () => {
          expect(true).toBe(true);
        });
      });
    `);
    const result = runScan([file], DEFAULT_CONFIG);
    expect(result.errors).toBe(0);
    expect(result.gateStatus).toBe('passed');
  });

  it('returns gateStatus failed when errors exist', () => {
    const file = writeTempFile(`cy.wait(3000)`);
    const result = runScan([file], DEFAULT_CONFIG);
    expect(result.errors).toBeGreaterThan(0);
    expect(result.gateStatus).toBe('failed');
  });

  it('counts files correctly', () => {
    const f1 = writeTempFile(`it('a', () => {})`, 'a.spec.ts');
    const f2 = writeTempFile(`it('b', () => {})`, 'b.spec.ts');
    const result = runScan([f1, f2], DEFAULT_CONFIG);
    expect(result.files).toBe(2);
  });

  it('returns durationMs as a number', () => {
    const file = writeTempFile(`it('ok', () => {})`);
    const result = runScan([file], DEFAULT_CONFIG);
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('respects failOnWarnings config', () => {
    const file = writeTempFile(`cy.get('li:nth-child(2)')`);
    const result = runScan([file], { ...DEFAULT_CONFIG, failOnWarnings: true });
    expect(result.gateStatus).toBe('failed');
  });
});
