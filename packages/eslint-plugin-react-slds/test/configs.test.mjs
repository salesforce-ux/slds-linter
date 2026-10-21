import { ESLint } from 'eslint';
import foundationPlugin from '@salesforce-ux/eslint-plugin-slds';
import plugin from '../build/index.mjs';

describe('plugin configs', () => {
  it('keeps recommended scoped to JSX and TSX', () => {
    expect(plugin.configs.recommended).toHaveLength(1);
    expect(plugin.configs.recommended[0].files).toEqual(['**/*.{jsx,tsx}']);
  });

  it('re-exports the foundation CSS config as recommended-css', () => {
    expect(plugin.configs['recommended-css']).toBe(
      foundationPlugin.configs['flat/recommended-css'],
    );
  });

  it('uses the CSS rules for the selected foundation persona', () => {
    const cssRules = plugin.configs['recommended-css'][0].rules;

    if (process.env.TARGET_PERSONA === 'internal') {
      expect(cssRules['@salesforce-ux/slds/no-invalid-hook-property-usage']).toBe('warn');
    } else {
      expect(cssRules).not.toHaveProperty(
        '@salesforce-ux/slds/no-invalid-hook-property-usage',
      );
    }
  });

  it('lints JSX and CSS when both named configs are composed', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        ...plugin.configs.recommended,
        ...plugin.configs['recommended-css'],
      ],
    });

    const [jsxResult] = await eslint.lintText(
      '<div className="slds-container--medium" />',
      { filePath: 'example.jsx' },
    );
    const [cssResult] = await eslint.lintText(
      '.slds-button { color: red; }',
      { filePath: 'example.css' },
    );

    expect(jsxResult.messages.map(message => message.ruleId)).toContain(
      '@salesforce-ux/slds/enforce-bem-usage',
    );
    expect(cssResult.messages.map(message => message.ruleId)).toContain(
      '@salesforce-ux/slds/no-slds-class-overrides',
    );
    expect(jsxResult.messages).not.toContainEqual(
      expect.objectContaining({ fatal: true }),
    );
    expect(cssResult.messages).not.toContainEqual(
      expect.objectContaining({ fatal: true }),
    );
  });

});
