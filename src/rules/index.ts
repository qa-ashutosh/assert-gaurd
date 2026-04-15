import type { Rule } from '../types';
import noHardWaits from './no-hard-waits';
import noLogicInTests from './no-logic-in-tests';
import noFlakySelectors from './no-flaky-selectors';
import { createRule as createAssertionRule } from './single-assertion-focus';
import noFocusedTests from './no-focused-tests';
import noHardcodedCredentials from './no-hardcoded-credentials';
import testIsolationCheck from './test-isolation-check';

export const BUILT_IN_RULES: Rule[] = [
  noHardWaits,
  noLogicInTests,
  noFlakySelectors,
  createAssertionRule(5),
  noFocusedTests,
  noHardcodedCredentials,
  testIsolationCheck,
];

export const DEFAULT_CONFIG: Record<string, 'error' | 'warn' | 'info' | 'off'> = {
  'no-hard-waits': 'error',
  'no-logic-in-tests': 'error',
  'no-focused-tests': 'error',
  'no-hardcoded-credentials': 'error',
  'no-flaky-selectors': 'warn',
  'single-assertion-focus': 'warn',
  'test-isolation-check': 'info',
};

export function getRulesForConfig(
  configRules: Record<string, 'error' | 'warn' | 'info' | 'off'>,
  maxAssertions?: number,
): Rule[] {
  const merged = { ...DEFAULT_CONFIG, ...configRules };
  const active: Rule[] = [];

  for (const rule of BUILT_IN_RULES) {
    const level = merged[rule.name];
    if (!level || level === 'off') continue;

    if (rule.name === 'single-assertion-focus' && maxAssertions) {
      active.push({ ...createAssertionRule(maxAssertions), severity: level });
    } else {
      active.push({ ...rule, severity: level });
    }
  }

  return active;
}
