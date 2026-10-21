import { ESLint } from 'eslint';
import sldsPlugin from '@salesforce-ux/eslint-plugin-slds';
import reactSldsPlugin from '@salesforce-ux/eslint-plugin-react-slds';
import { DEFAULT_ESLINT_CONFIG_PATH } from '../../src/services/config.resolver';

describe('default ESLint config', () => {
  it('uses the existing SLDS plugin for CSS and HTML', async () => {
    const eslint = new ESLint({
      overrideConfigFile: DEFAULT_ESLINT_CONFIG_PATH,
      cwd: process.cwd(),
    });

    const [cssConfig, htmlConfig, cssResult, htmlResult] = await Promise.all([
      eslint.calculateConfigForFile('component.css'),
      eslint.calculateConfigForFile('component.html'),
      eslint.lintText('.slds-button { background: red; }', { filePath: 'component.css' }),
      eslint.lintText('<div class="slds-action-overflow--touch"></div>', { filePath: 'component.html' }),
    ]);

    expect(cssConfig?.plugins?.['@salesforce-ux/slds']).toBe(sldsPlugin);
    expect(htmlConfig?.plugins?.['@salesforce-ux/slds']).toBe(sldsPlugin);
    expect(cssResult[0].messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: '@salesforce-ux/slds/no-slds-class-overrides' }),
    ]));
    expect(htmlResult[0].messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ ruleId: '@salesforce-ux/slds/no-deprecated-classes-slds2' }),
    ]));
  });

  it('uses the React SLDS plugin for JSX and TSX', async () => {
    const eslint = new ESLint({
      overrideConfigFile: DEFAULT_ESLINT_CONFIG_PATH,
      cwd: process.cwd(),
    });

    const extensionChecks = await Promise.all(['jsx', 'tsx'].map(async (extension) => {
      const filePath = `component.${extension}`;
      const [config, result] = await Promise.all([
        eslint.calculateConfigForFile(filePath),
        eslint.lintText('<div className="slds-container--medium" />', { filePath }),
      ]);

      return { config, result };
    }));

    for (const { config, result } of extensionChecks) {
      expect(config?.plugins?.['@salesforce-ux/slds']).toBe(reactSldsPlugin);
      expect(result[0].messages).toEqual(expect.arrayContaining([
        expect.objectContaining({ ruleId: '@salesforce-ux/slds/enforce-bem-usage' }),
      ]));
    }
  });
});
