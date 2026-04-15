import { parse } from '@babel/parser';
import fs from 'fs';
import type { Rule, ScanResult, AssertGuardConfig, Violation } from '../types';
import { getRulesForConfig } from '../rules';

const PARSE_PLUGINS = [
  'typescript',
  'jsx',
  'decorators-legacy',
  'classProperties',
  'dynamicImport',
  'optionalChaining',
  'nullishCoalescingOperator',
] as const;

export function parseFile(filePath: string): import('@babel/types').File | null {
  try {
    const code = fs.readFileSync(filePath, 'utf-8');
    return parse(code, {
      sourceType: 'module',
      plugins: [...PARSE_PLUGINS],
      errorRecovery: true,
    });
  } catch {
    return null;
  }
}

export function scanFile(filePath: string, rules: Rule[]): Violation[] {
  const ast = parseFile(filePath);
  if (!ast) return [];

  const violations: Violation[] = [];
  for (const rule of rules) {
    try {
      violations.push(...rule.check(ast, filePath));
    } catch {
      // Rule failure should never crash the scan
    }
  }
  return violations;
}

export function runScan(files: string[], config: AssertGuardConfig): ScanResult {
  const start = Date.now();
  const rules = getRulesForConfig(config.rules ?? {}, config.maxAssertionsPerTest);
  const allViolations: Violation[] = [];
  let passed = 0;

  for (const file of files) {
    const violations = scanFile(file, rules);
    allViolations.push(...violations);
    if (violations.length === 0) passed++;
  }

  const errors = allViolations.filter(v => v.severity === 'error').length;
  const warnings = allViolations.filter(v => v.severity === 'warn').length;
  const infos = allViolations.filter(v => v.severity === 'info').length;

  const gateStatus =
    errors > 0 || (config.failOnWarnings && warnings > 0) ? 'failed' : 'passed';

  return {
    files: files.length,
    rulesApplied: rules.length,
    violations: allViolations,
    passed,
    errors,
    warnings,
    infos,
    durationMs: Date.now() - start,
    gateStatus,
  };
}
