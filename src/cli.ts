#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { loadConfig, generateDefaultConfig } from './engine/config';
import { resolveFiles } from './engine/resolver';
import { runScan } from './engine/scanner';
import { renderHeader, renderSummary } from './reporter/cli-reporter';
import { writeJsonReport } from './reporter/json-reporter';
import { writeHtmlReport } from './reporter/html-reporter';

const pkg = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8'),
) as { version: string };

const program = new Command();

program
  .name('assert-guard')
  .description('A smart test quality gate — lint your test suite for anti-patterns and bad practices.')
  .version(pkg.version, '-v, --version');

program
  .command('scan', { isDefault: true })
  .description('Scan test files and run quality checks')
  .option('-d, --dir <path>', 'Directory to scan', '.')
  .option('-c, --config <path>', 'Path to config file')
  .option('-f, --format <type>', 'Report format: cli, json, html, all', 'cli')
  .option('-o, --output <path>', 'Output directory for reports', './assert-guard-reports')
  .option('--fail-on-warnings', 'Exit with code 1 if warnings are found')
  .option('--quiet', 'Only show summary, suppress per-file output')
  .action(async (opts: {
    dir: string;
    config?: string;
    format: string;
    output: string;
    failOnWarnings?: boolean;
    quiet?: boolean;
  }) => {
    renderHeader();

    const config = loadConfig(opts.config);
    if (opts.failOnWarnings) config.failOnWarnings = true;
    if (opts.format) config.reportFormat = opts.format as 'cli' | 'json' | 'html' | 'all';

    const scanDir = path.resolve(opts.dir);
    if (!fs.existsSync(scanDir)) {
      console.error(chalk.red(`  Error: Directory not found: ${scanDir}`));
      process.exit(1);
    }

    console.log(chalk.dim(`  Resolving files in ${scanDir}...`));
    const files = await resolveFiles(scanDir, config);

    if (files.length === 0) {
      console.log(chalk.yellow('  No test files found. Check your --dir and include/exclude config.'));
      process.exit(0);
    }

    console.log(chalk.dim(`  Found ${files.length} files · ${Object.keys(config.rules ?? {}).length} rules active\n`));

    if (!opts.quiet) {
      console.log(chalk.dim('  ' + '─'.repeat(50)));
    }

    const result = runScan(files, config);

    renderSummary(result);

    const fmt = opts.format;

    if (fmt === 'json' || fmt === 'all') {
      const p = writeJsonReport(result, opts.output);
      console.log(chalk.dim(`  JSON report → `) + chalk.green(path.relative(process.cwd(), p)));
    }

    if (fmt === 'html' || fmt === 'all') {
      const p = writeHtmlReport(result, opts.output);
      console.log(chalk.dim(`  HTML report → `) + chalk.green(path.relative(process.cwd(), p)));
    }

    if (fmt === 'json' || fmt === 'html' || fmt === 'all') console.log();

    process.exit(result.gateStatus === 'failed' ? 1 : 0);
  });

program
  .command('init')
  .description('Generate a default ag.config.json in the current directory')
  .action(() => {
    const dest = path.resolve(process.cwd(), 'ag.config.json');
    if (fs.existsSync(dest)) {
      console.log(chalk.yellow('  ag.config.json already exists — skipping.'));
      process.exit(0);
    }
    fs.writeFileSync(dest, generateDefaultConfig(), 'utf-8');
    console.log(chalk.green('  ✔ ag.config.json created'));
    console.log(chalk.dim('  Edit it to customise rules, include/exclude paths, and report format.'));
  });

program
  .command('rules')
  .description('List all available built-in rules')
  .action(() => {
    const { BUILT_IN_RULES, DEFAULT_CONFIG } = require('./rules');
    console.log();
    console.log(chalk.hex('#AFA9EC').bold('  Built-in rules\n'));
    for (const rule of BUILT_IN_RULES) {
      const level = DEFAULT_CONFIG[rule.name] ?? 'off';
      const badge =
        level === 'error' ? chalk.red('error') :
        level === 'warn'  ? chalk.yellow('warn ') :
        level === 'info'  ? chalk.blue('info ') : chalk.dim('off  ');
      console.log(`  ${badge}  ${chalk.bold(rule.name)}`);
      console.log(chalk.dim(`         ${rule.description}`));
    }
    console.log();
  });

program.parse(process.argv);
