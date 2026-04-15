import { parse } from '@babel/parser';
import rule from '../../src/rules/no-focused-tests';

function parseCode(code: string) {
  return parse(code, { sourceType: 'module', plugins: ['typescript'] });
}

describe('no-focused-tests', () => {
  it('flags it.only()', () => {
    const ast = parseCode(`it.only('my test', () => {})`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(1);
  });

  it('flags test.only()', () => {
    const ast = parseCode(`test.only('my test', () => {})`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(1);
  });

  it('flags describe.only()', () => {
    const ast = parseCode(`describe.only('suite', () => {})`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(1);
  });

  it('flags fit()', () => {
    const ast = parseCode(`fit('focused', () => {})`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(1);
  });

  it('does not flag regular it()', () => {
    const ast = parseCode(`it('normal test', () => {})`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });

  it('does not flag describe()', () => {
    const ast = parseCode(`describe('suite', () => {})`);
    expect(rule.check(ast, 'test.spec.ts')).toHaveLength(0);
  });
});
