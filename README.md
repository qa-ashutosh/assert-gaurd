<div align="center">

<br />

<h1>▲ assert-guard</h1>

<p><strong>The test quality gate your CI pipeline is missing.</strong></p>

<p>
Lint your test suite for anti-patterns, flaky selectors, hard waits,<br/>
and architectural violations — before they silently break your pipeline.
</p>

<br />

[![npm](https://img.shields.io/npm/v/%40ashforge%2Fassert-guard?style=flat-square&logo=npm)](https://www.npmjs.com/package/@ashforge/assert-guard)
[![CI](https://img.shields.io/github/actions/workflow/status/qa-ashutosh/assert-guard/ci.yml?style=flat-square&label=CI)](https://github.com/qa-ashutosh/assert-guard/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/node/v/%40ashforge%2Fassert-guard?style=flat-square)](https://nodejs.org)
[![Coverage](https://img.shields.io/badge/rule_coverage-92%25-brightgreen?style=flat-square)](https://github.com/qa-ashutosh/assert-guard)

<br />

<p><code>npx @ashforge/assert-guard --dir ./tests</code></p>

<br />

</div>

---

<div align="center">
<h3>Your CI checks if tests <em>pass</em>. &nbsp;assert-guard checks if tests are <em>well written</em>.</h3>
</div>

---

<br />

## The Problem

A green CI pipeline tells you tests ran. It tells you nothing about test quality.

Every test suite silently accumulates debt:

- `cy.wait(3000)` scattered throughout — tests that pass on fast machines, fail on slow ones
- `it.only()` committed by accident — **silently skipping 200 other tests in CI, every single run**
- Hardcoded passwords and API keys committed to version control
- `nth-child(2)` selectors that shatter every time a designer rearranges a list
- `if/else` logic inside test blocks making failures impossible to diagnose

None of this shows up in your test results. All of it costs you time.

assert-guard catches it at the gate.

<br />

---

## How It Works

```
  Your test files   →   AST parser     →   Rule engine   →   Report   →   Exit code
  *.spec.ts             @babel/parser      7 built-in        CLI          0 / 1
  *.test.js             no test            rules             JSON         for CI
  *.cy.ts               runner needed      pluggable         HTML
```

assert-guard parses your test files as an Abstract Syntax Tree — the same technique ESLint uses. No test runner required. No Cypress. No Playwright. Just your files and a set of rules that encode what a senior QA architect would flag in a code review.

**Scans 40+ files in under 2 seconds.**

<br />

---

## Terminal Output

```
  ▲ assert-guard  Test Quality Gate
  ────────────────────────────────────────────────────

  ✔ auth.spec.ts
  ✔ homepage.spec.ts
  ✗ checkout.spec.ts
     [no-hard-waits]  error  line 24
     → cy.wait(3000) detected — replace with waitFor() or intercept alias
  ⚠ cart.spec.ts
     [no-flaky-selectors]  warn  line 55
     → nth-child(2) positional selector — use data-testid instead
  ✗ login.spec.ts
     [no-focused-tests]  error  line 8
     → it.only() skips all other tests in CI — remove before merge
  ✔ payment.spec.ts

  ────────────────────────────────────────────────────

  38 passed   2 errors   1 warning   0 info
  Duration  1.24s   42 files · 7 rules · 504 checks

  ✗ Quality gate FAILED  Fix errors before merge · exit code 1
```

<br />

---

## Built-in Rules

<br />

| Rule | Default | What it catches |
|------|:-------:|-----------------|
| `no-hard-waits` | **error** | `cy.wait(3000)` · `page.waitForTimeout()` · `Thread.sleep()` |
| `no-focused-tests` | **error** | `it.only()` · `test.only()` · `describe.only()` · `fit()` |
| `no-hardcoded-credentials` | **error** | passwords · API keys · tokens committed to test files |
| `no-logic-in-tests` | **error** | `if/else` · `for` loops · `try/catch` inside test blocks |
| `no-flaky-selectors` | **warn** | `nth-child()` · absolute XPath · auto-generated CSS classes |
| `single-assertion-focus` | **warn** | test blocks exceeding the assertion limit (default: 5) |
| `test-isolation-check` | **info** | shared `let` state at `describe` scope that leaks between tests |

<br />

> **error** → blocks merge · exits with code `1`  
> **warn** → advisory · visible in report  
> **info** → informational · never fails the gate

<br />

---

## Quick Start

**Zero config. Run it right now:**

```bash
npx @ashforge/assert-guard --dir ./tests
```

**Install as a dev dependency (recommended for CI):**

```bash
npm install --save-dev @ashforge/assert-guard
```

**Install globally:**

```bash
npm install -g @ashforge/assert-guard
```

**Requirements:** Node.js ≥ 16

**Add to your npm scripts:**

```json
{
  "scripts": {
    "test:quality":        "assert-guard --dir ./tests",
    "test:quality:strict": "assert-guard --dir ./tests --fail-on-warnings",
    "test:quality:report": "assert-guard --dir ./tests --format html --output ./reports"
  }
}
```

**Generate a config file:**

```bash
assert-guard init
```

<br />

---

## Commands

### `assert-guard scan` (default)

```
assert-guard [scan] [options]

Options:
  -d, --dir <path>        Directory to scan                    (default: ".")
  -c, --config <path>     Path to config file
  -f, --format <type>     cli | json | html | all              (default: "cli")
  -o, --output <path>     Output directory for reports
  --fail-on-warnings      Exit 1 if warnings are found
  --quiet                 Summary only, suppress per-file output
  -v, --version           Print version
  -h, --help              Show help
```

**Examples:**

```bash
# Scan a directory
assert-guard --dir ./tests

# Generate all report formats
assert-guard --dir ./e2e --format all --output ./reports

# Strict mode — warnings also fail the gate
assert-guard --dir ./tests --fail-on-warnings

# Custom config path
assert-guard --dir ./tests --config ./config/ag.config.json
```

### `assert-guard init`
Scaffolds an `ag.config.json` in the current directory.

### `assert-guard rules`
Lists all available built-in rules with their default severity.

<br />

---

## Configuration

`ag.config.json` — place in your project root (or run `assert-guard init`):

```json
{
  "rules": {
    "no-hard-waits":             "error",
    "no-focused-tests":          "error",
    "no-hardcoded-credentials":  "error",
    "no-logic-in-tests":         "error",
    "no-flaky-selectors":        "warn",
    "single-assertion-focus":    "warn",
    "test-isolation-check":      "info"
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

Every rule accepts: `"error"` · `"warn"` · `"info"` · `"off"`

Config is auto-discovered in this order: `ag.config.json` → `.assert-guard.json` → `assert-guard.config.json`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `rules` | object | see defaults | Rule name → severity level |
| `include` | string[] | `["**/*.spec.*", "**/*.test.*", "**/*.cy.*"]` | Glob patterns to scan |
| `exclude` | string[] | `["**/node_modules/**", "**/dist/**"]` | Glob patterns to ignore |
| `maxAssertionsPerTest` | number | `5` | Threshold for `single-assertion-focus` |
| `reportFormat` | string | `"cli"` | Output format: `cli`, `json`, `html`, or `all` |
| `outputDir` | string | `"./assert-guard-reports"` | Where JSON/HTML reports are written |
| `failOnWarnings` | boolean | `false` | Treat warnings as gate failures |

<br />

---

## Rule Details

<details>
<summary><strong>no-hard-waits</strong> — Hard waits are the #1 cause of flaky tests</summary>

<br />

Flags `cy.wait(N)`, `page.waitForTimeout()`, `Thread.sleep()` and similar hardcoded pause calls.

```typescript
// ✗ Flagged as error
cy.wait(3000)
page.waitForTimeout(2000)
Thread.sleep(1000)

// ✔ Correct approach
cy.wait('@apiRequest')               // alias-based — waits for the actual network event
await page.waitForSelector('.modal') // condition-based — deterministic
await expect(locator).toBeVisible()  // Playwright assertion with built-in retry
```
</details>

<details>
<summary><strong>no-focused-tests</strong> — The silent CI killer</summary>

<br />

Catches `.only()` and focused test aliases that silently skip your entire suite in CI.

```typescript
// ✗ Flagged as error — all other tests silently skipped in CI
it.only('my test', () => { ... })
test.only('my test', () => { ... })
describe.only('suite', () => { ... })
fit('jasmine focused', () => { ... })

// ✔ Correct
it('my test', () => { ... })
```

> A single `it.only()` committed to main silently skips your entire test suite in CI. Your pipeline stays green. Everything is broken.

</details>

<details>
<summary><strong>no-logic-in-tests</strong> — Tests must be deterministic</summary>

<br />

Detects `if/else`, `for` loops, and `try/catch` inside test blocks.

```typescript
// ✗ Flagged as error
it('submits the form', () => {
  if (isLoggedIn) { cy.get('#submit').click() }
})

// ✔ Correct
it('submits form when authenticated', () => {
  loginAs('user@example.com')
  cy.get('[data-testid="submit-btn"]').click()
})
```
</details>

<details>
<summary><strong>no-hardcoded-credentials</strong> — Security risk in plain sight</summary>

<br />

Detects hardcoded passwords, API keys, and tokens in test files.

```typescript
// ✗ Flagged as error
const password = 'S3cr3tP@ssw0rd'
cy.login({ apiKey: 'sk-live-abc123xyz' })

// ✔ Correct
const password = process.env.TEST_PASSWORD
cy.login({ apiKey: Cypress.env('API_KEY') })
```
</details>

<details>
<summary><strong>no-flaky-selectors</strong> — Selectors that break on every deploy</summary>

<br />

Flags positional CSS, absolute XPath, and auto-generated class names.

```typescript
// ✗ Flagged as warning
cy.get('li:nth-child(2)')
cy.get('//div/span[1]')
cy.get('.css-1a2b3c')

// ✔ Correct
cy.get('[data-testid="cart-item-first"]')
page.getByRole('button', { name: 'Checkout' })
```
</details>

<details>
<summary><strong>single-assertion-focus</strong> — Tests should verify one thing</summary>

<br />

Warns when a test block exceeds the configured assertion limit (default: 5).

```typescript
// ✗ Flagged — 6 assertions, limit 5
it('validates the whole page', () => {
  expect(title).toBe('Dashboard')
  expect(subtitle).toContain('Welcome')
  expect(navLinks).toHaveLength(4)
  expect(footer).toBeVisible()
  expect(logo).toHaveAttribute('src')
  expect(badge).toHaveText('New')    // ← over the limit
})

// ✔ Correct — split into focused tests
it('shows correct page title', () => { ... })
it('renders navigation correctly', () => { ... })
```

Adjust the threshold: `"maxAssertionsPerTest": 8` in `ag.config.json`

</details>

<details>
<summary><strong>test-isolation-check</strong> — Shared state causes order-dependent failures</summary>

<br />

Detects `let` variables at `describe` scope that may carry state between tests.

```typescript
// ✗ Flagged
describe('user suite', () => {
  let userData
  it('A', () => { userData = { name: 'Alice' } })
  it('B', () => { expect(userData.name).toBe('') }) // depends on A
})

// ✔ Correct
describe('user suite', () => {
  let userData
  beforeEach(() => { userData = { name: '' } })
})
```
</details>

<br />

---

## Report Formats

### CLI (default)
Coloured terminal output designed to be scannable in GitHub Actions logs. Every violation includes a precise fix hint inline.

### HTML
A self-contained single `.html` file. No CDN. No external dependencies. Opens offline in any browser.

```bash
assert-guard --dir ./tests --format html
open ./assert-guard-reports/assert-guard-report.html
```

### JSON
Machine-readable output for dashboards, Slack bots, and custom integrations.

```bash
assert-guard --dir ./tests --format json
```

```json
{
  "version": "1.0.0",
  "summary": { "files": 42, "errors": 2, "warnings": 4, "gateStatus": "failed" },
  "violations": [
    {
      "rule": "no-hard-waits",
      "severity": "error",
      "file": "/tests/checkout.spec.ts",
      "line": 24,
      "hint": "Replace with waitFor() or an intercept alias"
    }
  ]
}
```

<br />

---

## CI/CD Integration

```yaml
- name: Test quality gate
  run: npx @ashforge/assert-guard --dir ./tests
```

assert-guard exits `1` on errors — every CI system treats non-zero exit codes as a build failure automatically.

**Full workflow with report artifact:**

```yaml
jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20.x' }
      - run: npm ci
      - run: npx @ashforge/assert-guard --dir ./tests --format all --output ./reports
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: assert-guard-report
          path: ./reports/
```

<br />

---

## Programmatic API

assert-guard ships full TypeScript declarations and works as a library:

```typescript
import { loadConfig, resolveFiles, runScan, writeHtmlReport } from '@ashforge/assert-guard';

const config = loadConfig('./ag.config.json');
const files  = await resolveFiles('./tests', config);
const result = runScan(files, config);

if (result.gateStatus === 'failed') {
  writeHtmlReport(result, './reports');
  process.exit(1);
}
```

| Function | Description |
|----------|-------------|
| `loadConfig(path?)` | Loads config file or falls back to defaults |
| `resolveFiles(dir, config)` | Resolves test files matching include/exclude globs |
| `runScan(files, config)` | Runs all active rules. Synchronous. |
| `writeHtmlReport(result, dir)` | Writes self-contained HTML report, returns path |
| `writeJsonReport(result, dir)` | Writes JSON results file, returns path |

<br />

---

## Framework Support

Framework-agnostic — no test runner installation required.

| Framework | Detected patterns |
|-----------|-------------------|
| **Cypress** | `cy.wait(N)` · positional selectors · `it.only()` |
| **Playwright** | `page.waitForTimeout()` · XPath locators |
| **Jest** | focused tests · assertion counts · shared state |
| **Mocha / Jasmine** | `fit()` · `fdescribe()` · logic in test blocks |
| **WebdriverIO** | `browser.pause()` · XPath selectors |
| **Vitest** | same patterns as Jest |

<br />

---

## Roadmap

- `page-object-enforced` — flag raw locator calls outside POM classes
- `no-sleep-in-hooks` — catch hard waits inside `beforeEach` / `afterAll`
- `require-test-description` — enforce meaningful test names
- `no-console-in-tests` — flag `console.log` left in test files
- SARIF output for GitHub Code Scanning
- VS Code extension for inline rule highlighting

[Open a rule request →](https://github.com/qa-ashutosh/assert-guard/issues/new?template=rule_request.md)

<br />

---

## Contributing

```bash
git clone https://github.com/qa-ashutosh/assert-guard.git
cd assert-guard && npm install && npm run build && npm test
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the rule authoring guide and PR checklist.

<br />

---

## License

[MIT](LICENSE) © [Ashutosh Parihar](https://github.com/qa-ashutosh)

<br />

---

<div align="center">

<p>
  <a href="https://www.npmjs.com/package/@ashforge/assert-guard"><strong>npm</strong></a> &nbsp;·&nbsp;
  <a href="https://github.com/qa-ashutosh/assert-guard"><strong>GitHub</strong></a> &nbsp;·&nbsp;
  <a href="https://github.com/qa-ashutosh/assert-guard/issues"><strong>Issues</strong></a> &nbsp;·&nbsp;
  <a href="CHANGELOG.md"><strong>Changelog</strong></a>
</p>

<br />

<p><em>Built by a QA architect. For engineers who treat test quality as a first-class concern.</em></p>

<br />

<p>If assert-guard caught a bug in your test suite, saved you a broken CI run,<br/>or just made your codebase a little cleaner —<br/><strong><a href="https://github.com/qa-ashutosh/assert-guard">a ★ on GitHub</a> means more than you think.</strong></p>

<br />

</div>