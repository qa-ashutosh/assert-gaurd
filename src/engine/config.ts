import fs from 'fs';
import path from 'path';
import type { AssertGuardConfig } from '../types';
import { DEFAULT_CONFIG } from '../rules';

const CONFIG_FILE_NAMES = [
  'ag.config.json',
  '.assert-guard.json',
  'assert-guard.config.json',
];

export const DEFAULT_FULL_CONFIG: AssertGuardConfig = {
  rules: DEFAULT_CONFIG,
  include: ['**/*.spec.{ts,js}', '**/*.test.{ts,js}', '**/*.cy.{ts,js}'],
  exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'],
  maxAssertionsPerTest: 5,
  reportFormat: 'cli',
  outputDir: './assert-guard-reports',
  failOnWarnings: false,
};

export function loadConfig(configPath?: string): AssertGuardConfig {
  const searchPaths = configPath
    ? [configPath]
    : CONFIG_FILE_NAMES.map(f => path.resolve(process.cwd(), f));

  for (const p of searchPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<AssertGuardConfig>;
        return {
          ...DEFAULT_FULL_CONFIG,
          ...parsed,
          rules: { ...DEFAULT_FULL_CONFIG.rules, ...(parsed.rules ?? {}) },
        };
      } catch (err) {
        console.error(`[assert-guard] Failed to parse config at ${p}:`, err);
      }
    }
  }

  return DEFAULT_FULL_CONFIG;
}

export function generateDefaultConfig(): string {
  return JSON.stringify(
    {
      rules: DEFAULT_CONFIG,
      include: DEFAULT_FULL_CONFIG.include,
      exclude: DEFAULT_FULL_CONFIG.exclude,
      maxAssertionsPerTest: 5,
      reportFormat: 'cli',
      outputDir: './assert-guard-reports',
      failOnWarnings: false,
    },
    null,
    2,
  );
}
