import path from 'path';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { destroy, lint, report } from '../../src/executor';

async function readStream(stream: NodeJS.ReadableStream): Promise<string> {
  let output = '';
  for await (const chunk of stream) output += chunk;
  return output;
}

describe('React report integration', () => {
  it.each(['jsx', 'tsx'])('reports a %s violation with its rule description', async (extension) => {
    const directory = await mkdtemp(path.join(process.cwd(), 'slds-react-report-'));
    const filePath = path.join(directory, `component.${extension}`);

    try {
      await writeFile(filePath, '<div className="slds-container--medium" />', 'utf8');

      const lintResults = await lint({ directory });
      const reportStream = await report({ format: 'sarif' }, lintResults);
      const sarif = JSON.parse(await readStream(reportStream));
      const run = sarif.runs[0];

      expect(lintResults).toHaveLength(1);
      expect(lintResults[0].messages).toEqual(expect.arrayContaining([
        expect.objectContaining({
          ruleId: '@salesforce-ux/slds/enforce-bem-usage',
          line: 1,
          column: 17,
        }),
      ]));
      expect(run.tool.driver.rules).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'slds/enforce-bem-usage',
          shortDescription: expect.objectContaining({ text: expect.not.stringMatching(/^--$/) }),
        }),
      ]));
      expect(run.results).toEqual(expect.arrayContaining([
        expect.objectContaining({
          ruleId: 'slds/enforce-bem-usage',
          locations: expect.arrayContaining([
            expect.objectContaining({
              physicalLocation: expect.objectContaining({
                region: expect.objectContaining({ startLine: 1, startColumn: 17 }),
              }),
            }),
          ]),
        }),
      ]));
    } finally {
      await destroy();
      await rm(directory, { recursive: true, force: true });
    }
  });
});
