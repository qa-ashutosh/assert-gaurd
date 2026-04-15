export type Severity = 'error' | 'warn' | 'info';

export interface Violation {
  rule: string;
  severity: Severity;
  message: string;
  file: string;
  line: number;
  column: number;
  hint: string;
}

export interface RuleResult {
  violations: Violation[];
}

export interface Rule {
  name: string;
  description: string;
  severity: Severity;
  hint: string;
  check(ast: import('@babel/types').File, filePath: string): Violation[];
}

export interface AssertGuardConfig {
  rules: Record<string, 'error' | 'warn' | 'info' | 'off'>;
  include?: string[];
  exclude?: string[];
  maxAssertionsPerTest?: number;
  reportFormat?: 'cli' | 'json' | 'html' | 'all';
  outputDir?: string;
  failOnWarnings?: boolean;
}

export interface ScanResult {
  files: number;
  rulesApplied: number;
  violations: Violation[];
  passed: number;
  errors: number;
  warnings: number;
  infos: number;
  durationMs: number;
  gateStatus: 'passed' | 'failed';
}

export interface ReporterOptions {
  result: ScanResult;
  config: AssertGuardConfig;
  outputDir: string;
}
