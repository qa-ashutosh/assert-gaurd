import fs from 'fs';
import path from 'path';
import type { ScanResult } from '../types';

export function writeJsonReport(result: ScanResult, outputDir: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const outPath = path.join(outputDir, 'assert-guard-results.json');
  const payload = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    summary: {
      files: result.files,
      rulesApplied: result.rulesApplied,
      passed: result.passed,
      errors: result.errors,
      warnings: result.warnings,
      infos: result.infos,
      durationMs: result.durationMs,
      gateStatus: result.gateStatus,
    },
    violations: result.violations,
  };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf-8');
  return outPath;
}
