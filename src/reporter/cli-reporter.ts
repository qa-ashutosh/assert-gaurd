import chalk from 'chalk';
import path from 'path';
import type { ScanResult, Violation } from '../types';

const SEP = chalk.dim('─'.repeat(52));

function severityIcon(severity: string): string {
  switch (severity) {
    case 'error': return chalk.red('✗');
    case 'warn':  return chalk.yellow('⚠');
    case 'info':  return chalk.blue('◦');
    default:      return ' ';
  }
}

function severityLabel(severity: string): string {
  switch (severity) {
    case 'error': return chalk.red('error');
    case 'warn':  return chalk.yellow('warn ');
    case 'info':  return chalk.blue('info ');
    default:      return severity;
  }
}

function formatViolation(v: Violation): void {
  const rel = path.relative(process.cwd(), v.file);
  const loc = chalk.dim(`${rel}:${v.line}:${v.column}`);
  const icon = severityIcon(v.severity);
  const label = severityLabel(v.severity);
  const rule = chalk.dim(`[${v.rule}]`);

  console.log(`  ${icon} ${label}  ${loc}`);
  console.log(`     ${rule} ${v.message}`);
  console.log(chalk.dim(`     → ${v.hint}`));
  console.log();
}

export function renderHeader(): void {
  console.log();
  console.log(
    chalk.hex('#AFA9EC').bold('  ▲ assert-guard') +
    chalk.dim('  Test Quality Gate'),
  );
  console.log(chalk.dim('  ' + '─'.repeat(50)));
  console.log();
}

export function renderFileResult(file: string, violations: Violation[]): void {
  const rel = path.relative(process.cwd(), file);
  if (violations.length === 0) {
    console.log(`  ${chalk.green('✔')} ${chalk.dim(rel)}`);
  } else {
    const hasError = violations.some(v => v.severity === 'error');
    const icon = hasError ? chalk.red('✗') : chalk.yellow('⚠');
    console.log(`  ${icon} ${rel}`);
    for (const v of violations) {
      const loc = chalk.dim(`line ${v.line}`);
      const label = severityLabel(v.severity);
      console.log(`     ${severityIcon(v.severity)} ${label}  ${chalk.dim(`[${v.rule}]`)} ${loc}`);
      console.log(chalk.dim(`        → ${v.hint}`));
    }
  }
}

export function renderSummary(result: ScanResult): void {
  console.log();
  console.log(chalk.dim('  ' + '─'.repeat(50)));
  console.log();

  if (result.violations.length > 0) {
    const byFile = new Map<string, Violation[]>();
    for (const v of result.violations) {
      if (!byFile.has(v.file)) byFile.set(v.file, []);
      byFile.get(v.file)!.push(v);
    }

    console.log(chalk.bold('  Violations\n'));
    for (const [, violations] of byFile) {
      for (const v of violations) formatViolation(v);
    }
    console.log(SEP);
    console.log();
  }

  const passStr = chalk.green(`${result.passed} passed`);
  const errStr = result.errors > 0 ? chalk.red(`${result.errors} errors`) : chalk.dim(`${result.errors} errors`);
  const warnStr = result.warnings > 0 ? chalk.yellow(`${result.warnings} warnings`) : chalk.dim(`${result.warnings} warnings`);
  const infoStr = chalk.blue(`${result.infos} info`);

  console.log(`  ${passStr}   ${errStr}   ${warnStr}   ${infoStr}`);
  console.log(
    `  ${chalk.dim('Duration')}  ${(result.durationMs / 1000).toFixed(2)}s` +
    chalk.dim(`   ${result.files} files · ${result.rulesApplied} rules`),
  );
  console.log();

  if (result.gateStatus === 'failed') {
    console.log(chalk.red.bold('  ✗ Quality gate FAILED') + chalk.dim('  Fix errors before merge · exit code 1'));
  } else {
    console.log(chalk.green.bold('  ✔ Quality gate PASSED') + chalk.dim('  All checks clear · exit code 0'));
  }
  console.log();
}
