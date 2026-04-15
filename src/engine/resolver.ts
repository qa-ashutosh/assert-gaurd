import glob from 'fast-glob';
import path from 'path';
import type { AssertGuardConfig } from '../types';

export async function resolveFiles(
  dir: string,
  config: AssertGuardConfig,
): Promise<string[]> {
  const include = (config.include ?? ['**/*.spec.{ts,js}', '**/*.test.{ts,js}', '**/*.cy.{ts,js}']).map(
    p => path.join(dir, p).replace(/\\/g, '/'),
  );

  const exclude = (config.exclude ?? ['**/node_modules/**', '**/dist/**']).map(
    p => path.join(dir, p).replace(/\\/g, '/'),
  );

  const files = await glob(include, {
    ignore: exclude,
    absolute: true,
    onlyFiles: true,
  });

  return files.sort();
}
