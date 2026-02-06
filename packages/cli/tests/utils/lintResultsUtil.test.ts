import { jest } from '@jest/globals';

describe('lintResultsUtil', () => {
  const originalLog = console.log;

  beforeEach(() => {
    jest.resetModules();
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalLog;
  });

  it('replaceNamespaceinRules removes @salesforce-ux prefix', async () => {
    const mod = await import('../../src/utils/lintResultsUtil');
    expect(mod.replaceNamespaceinRules('@salesforce-ux/slds/r1')).toBe('slds/r1');
    expect(mod.replaceNamespaceinRules('slds/r1')).toBe('slds/r1');
  });

  it('replaceNamespaceinRules falls back to N/A when id is undefined', async () => {
    const mod = await import('../../src/utils/lintResultsUtil');
    expect(mod.replaceNamespaceinRules(undefined as any)).toBe('N/A');
  });

  it('parseText parses JSON and ensures trailing period', async () => {
    const mod = await import('../../src/utils/lintResultsUtil');

    expect(mod.parseText('plain')).toBe('plain.');
    expect(mod.parseText('with.')).toBe('with.');
    expect(mod.parseText(JSON.stringify({ message: 'hi' }))).toBe('hi.');
    // JSON without a message falls back to stringified JSON
    expect(mod.parseText(JSON.stringify({ foo: 'bar' }))).toBe('{"foo":"bar"}.');
  });

  it('printLintResults prints a table and returns summary', async () => {
    const newLine = jest.fn();
    const success = jest.fn();

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { newLine, success },
    }));

    await jest.unstable_mockModule('../../src/utils/editorLinkUtil', () => ({
      createClickableLineCol: () => 'LINK',
    }));

    const { printLintResults } = await import('../../src/utils/lintResultsUtil');

    const summary = printLintResults([
      {
        filePath: '/abs/a.css',
        messages: [
          // error fixable
          { severity: 2, message: 'm', ruleId: 'slds/r1', line: 1, column: 2, fix: {} },
          // warning fixable
          { severity: 1, message: 'w', ruleId: 'slds/r2', line: 2, column: 3, fix: {} },
          // unknown severity (neither error nor warning)
          { severity: 0, message: 'n', ruleId: 'slds/r3', line: 3, column: 4 },
          // missing line/column and missing ruleId
          { severity: 2, message: 'no-loc', line: undefined, column: undefined }
        ]
      } as any
    ], {
      editor: 'vscode'
    });

    expect(summary.totalErrors).toBe(2);
    expect(summary.totalWarnings).toBe(1);
    expect(summary.fixableErrors).toBe(1);
    expect(summary.fixableWarnings).toBe(1);

    expect(newLine).toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
  });

  it('printLintResults prints success when there are no messages', async () => {
    const newLine = jest.fn();
    const success = jest.fn();

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { newLine, success },
    }));

    const { printLintResults } = await import('../../src/utils/lintResultsUtil');

    const summary = printLintResults([
      { filePath: '/abs/a.css', messages: [] } as any
    ]);

    expect(summary.totalErrors).toBe(0);
    expect(summary.totalWarnings).toBe(0);
    expect(success).toHaveBeenCalledWith('No SLDS Violations found.');
  });

  it('printLintResults safely ignores results with missing messages', async () => {
    const newLine = jest.fn();
    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { newLine, success: jest.fn() },
    }));

    const { printLintResults } = await import('../../src/utils/lintResultsUtil');

    const summary = printLintResults([
      { filePath: '/abs/a.css' } as any
    ]);

    expect(summary.totalErrors).toBe(0);
    expect(summary.totalWarnings).toBe(0);
  });

  it('printLintResults prints warning summary when there are only warnings (and none fixable)', async () => {
    const newLine = jest.fn();
    const success = jest.fn();

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { newLine, success },
    }));

    await jest.unstable_mockModule('../../src/utils/editorLinkUtil', () => ({
      createClickableLineCol: () => 'LINK',
    }));

    const { printLintResults } = await import('../../src/utils/lintResultsUtil');

    const summary = printLintResults([
      {
        // no filePath => exercise absolutePath '' and Unknown file fallback
        messages: [
          { severity: 1, message: 'w', ruleId: 'slds/r1', line: 1, column: 1 },
        ]
      } as any
    ]);

    expect(summary.totalErrors).toBe(0);
    expect(summary.totalWarnings).toBe(1);
    expect(summary.fixableErrors).toBe(0);
    expect(summary.fixableWarnings).toBe(0);

    expect(newLine).toHaveBeenCalled();
    expect(success).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
  });

  it('printLintResults prints error summary when there is exactly one error', async () => {
    const newLine = jest.fn();

    await jest.unstable_mockModule('../../src/utils/logger', () => ({
      Logger: { newLine, success: jest.fn() },
    }));

    await jest.unstable_mockModule('../../src/utils/editorLinkUtil', () => ({
      createClickableLineCol: () => 'LINK',
    }));

    const { printLintResults } = await import('../../src/utils/lintResultsUtil');

    const summary = printLintResults([
      {
        filePath: '/abs/a.css',
        messages: [
          { severity: 2, message: 'e', ruleId: 'slds/r1', line: 1, column: 1 },
        ]
      } as any
    ]);

    expect(summary.totalErrors).toBe(1);
    expect(summary.totalWarnings).toBe(0);
    expect(summary.fixableErrors).toBe(0);
    expect(summary.fixableWarnings).toBe(0);
  });

  it('toSarifResult maps fields correctly', async () => {
    const mod = await import('../../src/utils/lintResultsUtil');

    const out = mod.toSarifResult(
      { filePath: '/abs/a.css' } as any,
      { ruleId: 'slds/r1', message: 'm', line: 1, column: 2, endColumn: 3, severity: 2 } as any
    );

    expect(out.level).toBe('error');
    expect(out.ruleId).toBe('slds/r1');
    expect(out.startLine).toBe(1);
    expect(out.startColumn).toBe(2);
    expect(out.endColumn).toBe(3);    
  });

  it('toSarifResult keeps endColumn when missing', async () => {
    const mod = await import('../../src/utils/lintResultsUtil');
    const out = mod.toSarifResult(
      { filePath: '/abs/a.css' } as any,
      { ruleId: 'slds/r1', message: 'm', line: 1, column: 2, severity: 1 } as any,
    );
    expect(out.level).toBe('warning');
    expect(out.endColumn).toBe(2);
  });

  it('toCSVRow maps fields correctly', async()=>{
    const mod = await import('../../src/utils/lintResultsUtil');

    const out = mod.toCSVRow(
      { filePath: '/abs/a.css' } as any,
      { ruleId: 'slds/r1', message: 'm', line: 1, column: 2, endColumn: 3, severity: 2 } as any
    );

    expect(out['Rule ID']).toBe('slds/r1');
    expect(out['Start Line']).toBe(1);
    expect(out['Start Column']).toBe(2);
    expect(out['End Column']).toBe(3);
    expect(out['Severity']).toBe('error');
  })

  it('toCSVRow keeps endColumn when missing', async()=>{
    const mod = await import('../../src/utils/lintResultsUtil');

    const out = mod.toCSVRow(
      { filePath: '/abs/a.css' } as any,
      { ruleId: 'slds/r1', message: 'm', line: 1, column: 2, severity: 1 } as any
    );

    expect(out['Rule ID']).toBe('slds/r1');
    expect(out['Start Line']).toBe(1);
    expect(out['Start Column']).toBe(2);
    expect(out['End Column']).toBe(2);
    expect(out['Severity']).toBe('warning');
  })
});
