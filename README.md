# assert-guard

> A smart test quality gate — lint your test suite for anti-patterns, architectural violations, and bad practices.

[![CI](https://github.com/qa-ashutosh/assert-guard/actions/workflows/ci.yml/badge.svg)](https://github.com/qa-ashutosh/assert-guard/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/assert-guard.svg)](https://www.npmjs.com/package/assert-guard)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/node/v/assert-guard)](https://nodejs.org)

Most CI pipelines check whether tests **pass**. assert-guard checks whether your tests are **well written**.

It statically analyses your test files using an AST parser — no test runner needed, no dependencies on Cypress or Playwright — and enforces rules that a senior QA architect would enforce in a code review. Runs in under 2 seconds on most suites.

```
$ npx assert-guard --dir ./tests

  ▲ assert-guard  Test Quality Gate

  ✗ checkout.spec.ts  error  [no-hard-waits]     cy.wait(3000) — use waitFor()
  ⚠ cart.spec.ts      warn   [no-flaky-selectors] nth-child(2) — use data-testid
  ✗ login.spec.ts     error  [no-focused-tests]  it.only() skips all other tests

  38 passed   2 errors   1 warning

  ✗ Quality gate FAILED  Fix errors before merge · exit code 1
```

---

## Why this exists

Bad test code is invisible to standard CI. A suite can be green and still be full of:

- Hard waits that make tests slow and flaky
- `it.only()` left in by accident, silently skipping 200 other tests in CI
- Hardcoded passwords committed to version control
- Positional CSS selectors that break every time the DOM changes
- Conditional logic inside tests that makes failures non-deterministic

assert-guard catches all of this before it merges. Think of it as **ESLint, but for your test architecture**.

---

## Installation

```bash
# Run once without installing
npx assert-guard --dir ./tests

# Install globally
npm install -g assert-guard

# Install as a dev dependency (recommended for CI)
npm install --save-dev assert-guard
```

**Requirements:** Node.js ≥ 16

---

## Quick start

```bash
# 1. Generate a config file
npx assert-guard init

# 2. Scan your tests
npx assert-guard --dir ./tests

# 3. Generate an HTML report
npx assert-guard --dir ./tests --format html
```

---

## Commands

### `assert-guard scan` (default)

Scans test files and runs all active quality rules.

```bash
assert-guard [scan] [options]

Options:
  -d, --dir <path>       Directory to scan (default: ".")
  -c, --config <path>    Path to config file
  -f, --format <type>    Report format: cli | json | html | all  (default: "cli")
  -o, --output <path>    Output directory for reports (default: "./assert-guard-reports")
  --fail-on-warnings     Exit with code 1 if warnings are found
  --quiet                Show summary only, suppress per-file output
  -v, --version          Output the version number
```

**Examples:**

```bash
# Scan with default settings
assert-guard --dir ./tests

# Scan and produce all report formats
assert-guard --dir ./e2e --format all --output ./reports

# Strict mode — warnings also fail the gate
assert-guard --dir ./tests --fail-on-warnings

# Use a custom config path
assert-guard --dir ./tests --config ./config/ag.config.json
```

### `assert-guard init`

Scaffolds an `ag.config.json` in the current directory.

```bash
assert-guard init
```

### `assert-guard rules`

Lists all available built-in rules with their default severity.

```bash
assert-guard rules
```

---

## Configuration

Create `ag.config.json` in your project root (or run `assert-guard init`):

```json
{
  "rules": {
    "no-hard-waits": "error",
    "no-logic-in-tests": "error",
    "no-focused-tests": "error",
    "no-hardcoded-credentials": "error",
    "no-flaky-selectors": "warn",
    "single-assertion-focus": "warn",
    "test-isolation-check": "info"
  },
  "include": [
    "**/*.spec.{ts,js}",
    "**/*.test.{ts,js}",
    "**/*.cy.{ts,js}"
  ],
  "exclude": [
    "**/node_modules/**",
    "**/dist/**"
  ],
  "maxAssertionsPerTest": 5,
  "reportFormat": "cli",
  "outputDir": "./assert-guard-reports",
  "failOnWarnings": false
}
```

### Config options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rules` | object | see defaults | Rule name → severity (`"error"`, `"warn"`, `"info"`, `"off"`) |
| `include` | string[] | `["**/*.spec.*", "**/*.test.*", "**/*.cy.*"]` | Glob patterns for files to scan |
| `exclude` | string[] | `["**/node_modules/**", "**/dist/**"]` | Glob patterns to ignore |
| `maxAssertionsPerTest` | number | `5` | Threshold for `single-assertion-focus` |
| `reportFormat` | string | `"cli"` | `"cli"`, `"json"`, `"html"`, or `"all"` |
| `outputDir` | string | `"./assert-guard-reports"` | Where JSON/HTML reports are written |
| `failOnWarnings` | boolean | `false` | Treat warnings as errors for the exit code |

Config files are resolved in this order: `ag.config.json` → `.assert-guard.json` → `assert-guard.config.json`

---

## Built-in rules

### `no-hard-waits` · default: **error**

Flags hardcoded wait/sleep calls that make tests slow and flaky.

```typescript
// ✗ flagged
cy.wait(3000)
page.waitForTimeout(2000)
Thread.sleep(1000)

// ✔ ok
cy.wait('@apiRequest')         // alias-based wait
await page.waitForSelector()   // condition-based wait
```

---

### `no-logic-in-tests` · default: **error**

Detects conditional logic and loops inside test blocks. Tests must be linear and deterministic.

```typescript
// ✗ flagged
it('submits form', () => {
  if (isLoggedIn) {              // ← if/else
    cy.get('#submit').click()
  }
})

// ✔ ok
it('submits form when logged in', () => {
  loginAs('user@example.com')    // delegate to helper
  cy.get('#submit').click()
})
```

---

### `no-focused-tests` · default: **error**

Catches `.only()` and focused test aliases that silently skip your entire suite in CI.

```typescript
// ✗ flagged — all other tests are skipped
it.only('my test', () => { ... })
test.only('my test', () => { ... })
describe.only('suite', () => { ... })
fit('jasmine focused', () => { ... })

// ✔ ok
it('my test', () => { ... })
```

---

### `no-hardcoded-credentials` · default: **error**

Detects hardcoded passwords, tokens, and API keys in test files.

```typescript
// ✗ flagged
const password = 'S3cr3tP@ssw0rd'
cy.login({ apiKey: 'sk-live-abc123xyz' })

// ✔ ok
const password = process.env.TEST_PASSWORD
cy.login({ apiKey: Cypress.env('API_KEY') })
```

---

### `no-flaky-selectors` · default: **warn**

Flags positional CSS selectors, absolute XPath, and auto-generated class names that break when the DOM changes.

```typescript
// ✗ flagged
cy.get('li:nth-child(2)')         // positional
cy.get('//div/span[1]')           // XPath index
cy.get('.css-1a2b3c')             // generated class

// ✔ ok
cy.get('[data-testid="item-row"]')
cy.get('[aria-label="Submit"]')
page.getByRole('button', { name: 'Submit' })
```

---

### `single-assertion-focus` · default: **warn**

Warns when a single test block contains more assertions than the configured limit (default: 5). Long assertion lists usually mean the test is doing too much.

```typescript
// ✗ flagged (6 assertions, limit 5)
it('validates the whole page', () => {
  expect(title).toBe('Dashboard')
  expect(subtitle).toContain('Welcome')
  expect(navLinks).toHaveLength(4)
  expect(footer).toBeVisible()
  expect(logo).toHaveAttribute('src')
  expect(badge).toHaveText('New')      // ← over the limit
})

// ✔ ok — split into focused tests
it('shows correct title', () => { ... })
it('renders nav correctly', () => { ... })
```

Configure the limit in `ag.config.json`:
```json
{ "maxAssertionsPerTest": 8 }
```

---

### `test-isolation-check` · default: **info**

Detects shared `let` variables declared at `describe` scope that may leak state between tests.

```typescript
// ✗ flagged — userData persists across tests
describe('user suite', () => {
  let userData       // ← shared mutable state

  it('test A', () => { userData = { name: 'Alice' } })
  it('test B', () => { expect(userData.name).toBe('') }) // depends on test A
})

// ✔ ok
describe('user suite', () => {
  let userData
  beforeEach(() => { userData = { name: '' } })  // reset before each test
})
```

---

## Report formats

### CLI (default)

Coloured terminal output with per-file results, violation details, fix hints, and a summary. Designed to be readable in GitHub Actions logs.

### HTML

A self-contained single `.html` file with no external dependencies — opens directly in any browser.

```bash
assert-guard --dir ./tests --format html --output ./reports
open ./reports/assert-guard-report.html
```

### JSON

Machine-readable output for integration with dashboards, Slack bots, or custom tooling.

```bash
assert-guard --dir ./tests --format json
```

Output shape:
```json
{
  "version": "1.0.0",
  "timestamp": "2026-04-15T09:41:00.000Z",
  "summary": {
    "files": 42,
    "rulesApplied": 7,
    "passed": 38,
    "errors": 2,
    "warnings": 4,
    "gateStatus": "failed"
  },
  "violations": [
    {
      "rule": "no-hard-waits",
      "severity": "error",
      "message": "cy.wait(3000) detected — hard waits cause flaky tests",
      "file": "/tests/checkout.spec.ts",
      "line": 24,
      "column": 4,
      "hint": "Replace hard waits with waitFor() or intercept aliases"
    }
  ]
}
```

---

## CI/CD integration

### GitHub Actions

```yaml
- name: Test quality gate
  run: npx assert-guard --dir ./tests --format all
```

To fail the build on violations, assert-guard exits with code `1` when errors are found. GitHub Actions (and most CI systems) treat a non-zero exit code as a failure automatically.

### Adding to an existing workflow

```yaml
jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - name: Run assert-guard
        run: npx assert-guard --dir ./tests --format json --output ./reports
      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: assert-guard-report
          path: ./reports/
```

### npm scripts

```json
{
  "scripts": {
    "test:quality": "assert-guard --dir ./tests",
    "test:quality:strict": "assert-guard --dir ./tests --fail-on-warnings",
    "test:quality:report": "assert-guard --dir ./tests --format all --output ./reports"
  }
}
```

---

## Programmatic API

assert-guard can be used as a library in your own tooling:

```typescript
import {
  loadConfig,
  resolveFiles,
  runScan,
  writeHtmlReport,
} from 'assert-guard';

const config = loadConfig('./ag.config.json');
const files = await resolveFiles('./tests', config);
const result = runScan(files, config);

console.log(`Gate: ${result.gateStatus}`);
console.log(`Errors: ${result.errors}`);

if (result.gateStatus === 'failed') {
  writeHtmlReport(result, './reports');
  process.exit(1);
}
```

### API reference

#### `loadConfig(path?: string): AssertGuardConfig`
Loads config from a file path or auto-discovers `ag.config.json`. Falls back to defaults.

#### `resolveFiles(dir: string, config: AssertGuardConfig): Promise<string[]>`
Resolves all test files matching the include/exclude globs.

#### `runScan(files: string[], config: AssertGuardConfig): ScanResult`
Runs all active rules against the provided files. Synchronous.

#### `writeHtmlReport(result: ScanResult, outputDir: string): string`
Writes a self-contained HTML report. Returns the output file path.

#### `writeJsonReport(result: ScanResult, outputDir: string): string`
Writes a JSON results file. Returns the output file path.

---

## Supported frameworks

assert-guard is framework-agnostic. It parses your test files as JavaScript/TypeScript AST and applies rules that work across:

- **Cypress** — detects `cy.wait()`, `cy.get()` outside POM, etc.
- **Playwright** — detects `page.waitForTimeout()`, locator patterns
- **Jest** — detects focused tests, assertion counts, shared state
- **Mocha / Jasmine** — detects `fit()`, `fdescribe()`, logic in test blocks
- **WebdriverIO** — detects `browser.pause()`, XPath selectors

Files with `.spec.ts`, `.spec.js`, `.test.ts`, `.test.js`, `.cy.ts`, and `.cy.js` extensions are included by default. Customise with the `include` config option.

---

## Roadmap

The free tier will always include all current built-in rules. Planned additions:

- `page-object-enforced` — detect raw locator calls outside POM classes
- `no-sleep-in-hooks` — catch hard waits inside `beforeEach`/`afterAll`
- `require-test-description` — enforce meaningful test names (no `'test 1'`, `'TODO'`)
- `no-console-in-tests` — flag `console.log` left in test files
- SARIF output format for GitHub Code Scanning integration
- VS Code extension for inline rule highlighting

Have a rule idea? [Open an issue](https://github.com/qa-ashutosh/assert-guard/issues/new?template=rule_request.md).

---

## Contributing

Contributions are welcome — especially new rules. See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- How to add a new rule (step-by-step with a template)
- Running tests locally
- PR checklist

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

<p align="center">
  Built by a QA architect, for QA engineers who care about test quality at scale.
</p>
