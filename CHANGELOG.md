# Changelog

All notable changes to assert-guard are documented here.

This project follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

_Nothing yet._

---

## [1.0.0] — 2026-04-15

### Added

- **Core rule engine** — AST-based scanner using `@babel/parser` with TypeScript and JSX support
- **7 built-in rules** covering the most common test anti-patterns:
  - `no-hard-waits` (error) — flags `cy.wait(N)`, `Thread.sleep()`, `page.waitForTimeout()`
  - `no-logic-in-tests` (error) — detects `if/else`, `for` loops, and `try/catch` inside test blocks
  - `no-focused-tests` (error) — catches `it.only()`, `test.only()`, `fit()`, `fdescribe()`
  - `no-hardcoded-credentials` (error) — detects hardcoded passwords, tokens, and API keys
  - `no-flaky-selectors` (warn) — flags `nth-child()`, absolute XPath, and generated CSS class selectors
  - `single-assertion-focus` (warn) — warns when a test block exceeds the configured assertion limit
  - `test-isolation-check` (info) — detects shared `let` state declared at describe scope
- **CLI commands**: `scan`, `init`, `rules`
- **Three report formats**: `cli` (coloured terminal), `json`, `html` (self-contained single file)
- **Quality gate exit codes**: exits `1` on errors (or warnings when `failOnWarnings: true`), `0` on pass
- **`ag.config.json` config file** — customise rules, include/exclude globs, assertion limits, output directory
- **`assert-guard init`** — scaffolds a default config file
- **`assert-guard rules`** — lists all available rules with their default severity
- **GitHub Actions workflows** — CI (test + build on Node 18/20) and npm publish on release
- **Full TypeScript** — ships with `.d.ts` declarations for use as a library
- **Programmatic API** — all core functions exported from the main entry point

### Rules detail

| Rule | Default | Catches |
|------|---------|---------|
| `no-hard-waits` | error | `cy.wait(N)`, `Thread.sleep()`, `waitForTimeout()` |
| `no-logic-in-tests` | error | `if`, `for`, `for..of`, `try/catch` inside `it()`/`test()` |
| `no-focused-tests` | error | `it.only`, `test.only`, `describe.only`, `fit`, `fdescribe` |
| `no-hardcoded-credentials` | error | hardcoded passwords, tokens, API keys in test files |
| `no-flaky-selectors` | warn | positional CSS, absolute XPath, generated class names |
| `single-assertion-focus` | warn | more than N assertions per test (default N=5) |
| `test-isolation-check` | info | shared `let` state in `describe` scope |

---

[Unreleased]: https://github.com/qa-ashutosh/assert-guard/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/qa-ashutosh/assert-guard/releases/tag/v1.0.0
