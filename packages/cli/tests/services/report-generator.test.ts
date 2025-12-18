import { jest } from '@jest/globals';
import { Readable, Writable } from 'stream';

const minimalLintResult: any = {
  filePath: 'a.css',
  messages: [
    { line: 1, column: 1, endColumn: 2, message: 'msg', ruleId: 'slds/my-rule', severity: 2 }
  ],
  errorCount: 1,
  warningCount: 0,
  fixableErrorCount: 0,
  fixableWarningCount: 0,
  fatalErrorCount: 0,
  suppressedMessages: [],
  usedDeprecatedRules: [],
};

describe('ReportGenerator', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('generateSarifReport does nothing when outputPath is not provided', async () => {
    const mkdir = jest.fn();
    const writeFile = jest.fn<(...args: any[]) => Promise<void>>();
    await jest.unstable_mockModule('fs/promises', () => ({
      default: { mkdir },
      writeFile,
    }));

    const { ReportGenerator } = await import('../../src/services/report-generator');

    await ReportGenerator.generateSarifReport([minimalLintResult], {
      toolName: 'tool',
      toolVersion: '1.0.0'
    });

    expect(mkdir).not.toHaveBeenCalled();
    expect(writeFile).not.toHaveBeenCalled();
  });

  it('generateSarifReport builds report, processes artifacts, mkdirs, and writes to stream', async () => {
    const mkdir = jest
      .fn<(...args: any[]) => Promise<void>>()
      .mockResolvedValue(undefined);
    await jest.unstable_mockModule('fs/promises', () => ({
      default: { mkdir },
      writeFile: jest.fn(),
    }));

    const createWriteStream = jest.fn(() => {
      const stream = new Writable();
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      (stream as any)._write = function (_c: any, _e: any, cb: any) { cb(); };
      return stream;
    });

    await jest.unstable_mockModule('fs', () => ({
      createWriteStream,
    }));

    class FakeJsonStream extends Readable {
      constructor() {
        super();
      }
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      _read() {}
      pipe(dest: any) {
        process.nextTick(() => dest.emit('finish'));
        return dest;
      }
    }

    await jest.unstable_mockModule('json-stream-stringify', () => ({
      JsonStreamStringify: FakeJsonStream,
    }));

    const processArtifacts = jest
      .fn<(...args: any[]) => Promise<void>>()
      .mockResolvedValue(undefined);
    await jest.unstable_mockModule('../../src/services/artifact-processor', () => ({
      processArtifacts,
    }));

    // Keep internals lightweight
    await jest.unstable_mockModule('node-sarif-builder', () => {
      class SarifBuilder {
        runs: any[] = [];
        addRun(run: any) { this.runs.push(run); }
        buildSarifOutput() { return { runs: this.runs }; }
      }
      class SarifRunBuilder {
        run: any;
        constructor(_cfg: any) {
          this.run = { artifacts: [{}], tool: { driver: {} }, properties: {} };
        }
        initSimple(_cfg: any) { return this; }
        addRule(_r: any) {}
        addResult(_r: any) {}
      }
      class SarifResultBuilder {
        initSimple(_cfg: any) { return this; }
      }
      class SarifRuleBuilder {
        initSimple(_cfg: any) { return this; }
      }
      return { SarifBuilder, SarifRunBuilder, SarifResultBuilder, SarifRuleBuilder };
    });

    await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
      getRuleDescription: () => 'desc',
    }));

    await jest.unstable_mockModule('../../src/utils/lintResultsUtil', () => ({
      parseText: (s: string) => s,
      replaceNamespaceinRules: (s: string) => s,
      transformedResults: () => ({})
    }));

    const { ReportGenerator } = await import('../../src/services/report-generator');

    await ReportGenerator.generateSarifReport([minimalLintResult], {
      outputPath: 'out/sarif.json',
      toolName: 'tool',
      toolVersion: '1.0.0'
    });

    expect(mkdir).toHaveBeenCalled();
    expect(createWriteStream).toHaveBeenCalledWith('out/sarif.json');
    expect(processArtifacts).toHaveBeenCalled();
  });

  it('generateSarifReportStream returns a readable stream', async () => {
    await jest.unstable_mockModule('node-sarif-builder', () => {
      class SarifBuilder { addRun() {} buildSarifOutput() { return { runs: [] }; } }
      class SarifRunBuilder {
        run: any;
        constructor() { this.run = { tool: { driver: {} }, properties: {}, artifacts: [] }; }
        initSimple() { return this; }
        addRule() {}
        addResult() {}
      }
      class SarifResultBuilder { initSimple() { return this; } }
      class SarifRuleBuilder { initSimple() { return this; } }
      return { SarifBuilder, SarifRunBuilder, SarifResultBuilder, SarifRuleBuilder };
    });

    class FakeJsonStream extends Readable {
      constructor() { super(); }
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      _read() {}
    }

    await jest.unstable_mockModule('json-stream-stringify', () => ({
      JsonStreamStringify: FakeJsonStream,
    }));

    await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
      getRuleDescription: () => 'desc',
    }));

    await jest.unstable_mockModule('../../src/utils/lintResultsUtil', () => ({
      parseText: (s: string) => s,
      replaceNamespaceinRules: (s: string) => s,
      transformedResults: () => ({})
    }));

    const { ReportGenerator } = await import('../../src/services/report-generator');

    const stream = await ReportGenerator.generateSarifReportStream([minimalLintResult], {
      toolName: 'tool',
      toolVersion: '1.0.0'
    });

    expect(stream).toBeInstanceOf(Readable);
  });

  it('buildSarifReport handles messages with missing ruleId (fallback N/A path)', async () => {
    await jest.unstable_mockModule('node-sarif-builder', () => {
      class SarifBuilder { addRun() {} buildSarifOutput() { return { runs: [] }; } }
      class SarifRunBuilder {
        run: any;
        constructor() { this.run = { tool: { driver: {} }, properties: {}, artifacts: [] }; }
        initSimple() { return this; }
        addRule() {}
        addResult() {}
      }
      class SarifResultBuilder { initSimple() { return this; } }
      class SarifRuleBuilder { initSimple() { return this; } }
      return { SarifBuilder, SarifRunBuilder, SarifResultBuilder, SarifRuleBuilder };
    });

    await jest.unstable_mockModule('../../src/services/config.resolver', () => ({
      getRuleDescription: () => 'desc',
    }));

    await jest.unstable_mockModule('../../src/utils/lintResultsUtil', () => ({
      parseText: (s: string) => s,
      replaceNamespaceinRules: (s: string) => s,
      transformedResults: () => ({})
    }));

    const { ReportGenerator } = await import('../../src/services/report-generator');

    await expect(
      ReportGenerator.buildSarifReport([
        {
          filePath: 'a.css',
          messages: [{ message: 'x', line: 1, column: 1 }]
        } as any
      ], { toolName: 'tool', toolVersion: '1.0.0' })
    ).resolves.toBeDefined();
  });
});
