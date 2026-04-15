# Contributing to assert-guard

Thank you for your interest in contributing! assert-guard is open source and welcomes community contributions — especially new rules.

## Getting started

```bash
git clone https://github.com/qa-ashutosh/assert-guard.git
cd assert-guard
npm install
npm run build
npm test
```

## Adding a new rule

Each rule lives in `src/rules/` as its own TypeScript file. Here is the minimum shape:

```typescript
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { Rule, Violation } from '../types';

const rule: Rule = {
  name: 'your-rule-name',          // kebab-case, unique
  description: 'One sentence.',
  severity: 'warn',                // 'error' | 'warn' | 'info'
  hint: 'What the developer should do instead.',

  check(ast, filePath): Violation[] {
    const violations: Violation[] = [];
    traverse(ast, {
      // visit AST nodes here
    });
    return violations;
  },
};

export default rule;
```

Then register it in `src/rules/index.ts` and add a default severity to `DEFAULT_CONFIG`.

Every rule must have a corresponding test file in `tests/rules/`.

## Running tests

```bash
npm test              # run all tests
npm run test:coverage # with coverage report
```

## Code style

- TypeScript strict mode is enforced
- Run `npm run lint` before opening a PR
- Keep dependencies minimal — if the standard library can do it, prefer that

## Pull request checklist

- [ ] New rule has unit tests covering at least: one positive case, one negative (no false positive), and one edge case
- [ ] Rule is registered in `src/rules/index.ts`
- [ ] `CHANGELOG.md` entry added under `[Unreleased]`
- [ ] `npm test` passes locally

## Reporting bugs

Use the GitHub issue tracker with the bug report template.

## Suggesting rules

Open an issue using the rule request template. Include a code example of the anti-pattern and explain why it's harmful.
