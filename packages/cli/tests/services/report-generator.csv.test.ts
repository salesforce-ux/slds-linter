import { jest } from '@jest/globals';

describe('CsvReportGenerator', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('generateCsvString converts results and returns string', async () => {
    await jest.unstable_mockModule('export-to-csv', () => ({
      mkConfig: () => ({ mocked: true }),
      generateCsv: () => (rows: any[]) => rows,
      asString: (data: any) => `csv:${Array.isArray(data) ? data.length : 0}`,
    }));

    await jest.unstable_mockModule('../../src/utils/lintResultsUtil', () => ({
      parseText: (s: string) => s,
      replaceNamespaceinRules: (s: string) => s,
      toSarifResult: () => ({}),
      toCSVRow: () => ({})
    }));

    const { CsvReportGenerator } = await import('../../src/services/report-generator');

    const csv = CsvReportGenerator.generateCsvString([
      {
        filePath: '/abs/a.css',
        messages: [
          { message: 'hello', ruleId: 'slds/r1', line: 1, column: 2, endLine: 3, endColumn: 4 }
        ]
      } as any
    ]);

    expect(csv).toBe('csv:1');
  });

  it('generate writes to slds-linter-report.csv and returns path', async () => {
    const writeFile = jest.fn<(...args: any[]) => Promise<void>>().mockResolvedValue(undefined);

    await jest.unstable_mockModule('fs/promises', () => ({
      writeFile,
      default: {},
    }));

    await jest.unstable_mockModule('export-to-csv', () => ({
      mkConfig: () => ({ mocked: true }),
      generateCsv: () => (rows: any[]) => rows,
      asString: () => 'csv-data',
    }));

    await jest.unstable_mockModule('../../src/utils/lintResultsUtil', () => ({
      parseText: (s: string) => s,
      replaceNamespaceinRules: (s: string) => s,
      toSarifResult: () => ({}),
      toCSVRow: () => ({}),
    }));

    const { CsvReportGenerator } = await import('../../src/services/report-generator');

    const outPath = await CsvReportGenerator.generate([
      {
        filePath: '/abs/a.css',
        messages: [
          { message: 'hello', ruleId: 'slds/r1', line: 1, column: 2 }
        ]
      } as any
    ]);

    expect(outPath).toContain('slds-linter-report.csv');
    expect(writeFile).toHaveBeenCalled();
  });
  
});
