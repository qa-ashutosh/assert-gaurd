module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/cli.ts'],
  coverageThreshold: { 'src/rules/': { lines: 80 } },
  coverageReporters: ['text', 'lcov'],
};
