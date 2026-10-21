import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

const ruleId = '@salesforce-ux/slds/lwc-token-to-slds-hook';

async function lint(code, fix = false) {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{
      ...plugin.configs.recommended[0],
      rules: {[ruleId]: 'error'},
    }],
    fix,
  });
  const [result] = await eslint.lintText(code, {filePath: 'component.tsx'});
  return result;
}

async function lintRecommended(code, fix = false) {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: plugin.configs.recommended,
    fix,
  });
  const [result] = await eslint.lintText(code, {filePath: 'component.tsx'});
  return result;
}

const messages = result => result.messages.filter(message =>
  ['errorWithNoRecommendation', 'errorWithReplacement', 'errorWithStyleHooks'].includes(message.messageId),
);

describe('lwc-token-to-slds-hook', () => {
  it.each([
    'calc(var(--lwc-brandDark)',
    'var(--lwc-brandDark, var(--lwc-brandPrimaryTransparent)',
    '((var(--lwc-brandDark)',
    'var(--lwc-brandDark) /*',
  ])('fails closed for malformed CSS values: %s', async value => {
    const result = await lint(`const View = () => <div style={{color: '${value}'}} />;`, true);

    expect(result.messages).toHaveLength(0);
    expect(result.output).toBeUndefined();
  });

  it('reports and fixes LWC var calls in direct inline style values', async () => {
    const result = await lint(
      "const View = () => <div style={{ color: 'var(--lwc-brandDark)', background: `var(--lwc-brandPrimaryTransparent)` }} />;",
      true,
    );

    expect(result.messages).toHaveLength(0);
    expect(result.output).toBe(
      "const View = () => <div style={{ color: 'var(--slds-g-color-accent-dark-1, var(--lwc-brandDark))', background: `transparent` }} />;",
    );
  });

  it('resolves lexical const style objects and safe TypeScript wrappers', async () => {
    const result = await lint(`
      const styles = ({
        color: 'var(--lwc-brandDark)',
        background: \`var(--lwc-brandPrimaryTransparent)\`,
      } as const) satisfies Record<string, string>;
      const View = () => <div style={styles!} />;
    `, true);

    expect(result.messages).toHaveLength(0);
    expect(result.output).toContain("color: 'var(--slds-g-color-accent-dark-1, var(--lwc-brandDark))'");
    expect(result.output).toContain('background: `transparent`');
  });

  it('resolves one direct const identifier for inline property values and deduplicates reused sources', async () => {
    const result = await lint(`
      const color = 'var(--lwc-brandDark)' as const;
      const styles = { color, borderColor: color } satisfies Record<string, string>;
      const View = () => <><div style={styles} /><span style={styles} /></>;
    `);

    expect(messages(result)).toEqual([
      expect.objectContaining({messageId: 'errorWithStyleHooks', line: 2, column: 22, endColumn: 42, severity: 2}),
    ]);
  });

  it('inspects complete static fragments of interpolated inline templates', async () => {
    const result = await lint(`
      const View = ({dynamic}) => <div style={{ color: \`var(--lwc-brandDark) \${dynamic} var(--lwc-brandPrimaryTransparent)\` }} />;
    `);

    expect(messages(result)).toEqual([
      expect.objectContaining({line: 2, column: 57, endColumn: 77}),
      expect.objectContaining({line: 2, column: 89, endColumn: 123}),
    ]);
  });

  it('fixes a complete inline call ending at a hole boundary but skips joined or split calls', async () => {
    const code = `
      const View = ({dynamic}) => <div style={{
        color: \`var(--lwc-brandDark)\${dynamic}\`,
        border: \`\${dynamic}var(--lwc-brandDark)\`,
        margin: \`var(--lwc-brand\${dynamic}Dark)\`,
      }} />;
    `;
    const result = await lint(code);
    expect(messages(result)).toEqual([expect.objectContaining({line: 3})]);

    const fixed = await lint(code, true);
    expect(fixed.output).toContain('var(--slds-g-color-accent-dark-1, var(--lwc-brandDark))\${dynamic}');
    expect(fixed.output).toContain('\${dynamic}var(--lwc-brandDark)');
  });

  it('does not report or fix an inline LWC call containing an interpolation', async () => {
    const code = `const View = ({fallback}) => <div style={{color: \`var(--lwc-brandDark, \${fallback})\`, border: \`var(--lwc-brandDark)\${fallback}\`}} />;`;
    const result = await lint(code);
    expect(messages(result)).toEqual([expect.objectContaining({column: 96})]);

    const fixed = await lint(code, true);
    expect(fixed.output).toContain('var(--lwc-brandDark, \${fallback})');
    expect(fixed.output).toContain('var(--slds-g-color-accent-dark-1, var(--lwc-brandDark))\${fallback}');
  });

  it('skips mutable, dynamic, ambiguous, imported, parameter, call, alias-chain, and spread-content inline values', async () => {
    const result = await lint(`
      import { importedStyles } from './styles';
      let mutable = { color: 'var(--lwc-brandDark)' };
      const dynamic = { color: getColor() };
      const spread = { ...dynamic, color: 'var(--lwc-brandDark)' };
      const first = 'var(--lwc-brandDark)';
      const second = first;
      function View({ parameterStyles }) {
        const ambiguous = true ? { color: 'var(--lwc-brandDark)' } : dynamic;
        return <><div style={mutable} /><div style={dynamic} /><div style={spread} />
          <div style={importedStyles} /><div style={parameterStyles} /><div style={ambiguous} />
          <div style={{ color: second }} /></>;
      }
    `);

    expect(messages(result)).toEqual([
      expect.objectContaining({messageId: 'errorWithStyleHooks', line: 5, column: 44, endColumn: 64}),
    ]);
  });

  it('skips const style objects after direct member and Object.assign mutations', async () => {
    const result = await lint(`
      const directlyMutated = { color: 'var(--lwc-brandDark)' };
      directlyMutated.color = 'red';
      const assigned = { color: 'var(--lwc-brandDark)' };
      Object.assign(assigned, { color: 'red' });
      const View = () => <><div style={directlyMutated} /><div style={assigned} /></>;
    `);

    expect(messages(result)).toHaveLength(0);
  });

  it('treats CSS comments as whitespace before LWC var first arguments', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const View = () => <div style={{ color: 'var(/* before */ --lwc-brandDark)' }} />;
      const Panel = styled.div\`color: var(/* before */ --lwc-brandDark);\`;
    `);

    expect(messages(result)).toHaveLength(2);
  });

  it('reports every eligible inline custom-property category and only fixes SLDS replacements', async () => {
    const code = `const View = () => <div style={{
      '--lwc-brandDark': '#123456',
      '--lwc-brandPrimaryTransparent': 'transparent',
      '--lwc-colorBackgroundLight': '#eee',
      '--lwc-brandBackgroundDark': '#000',
    }} />;`;
    const result = await lint(code);

    expect(messages(result).map(message => message.messageId)).toEqual([
      'errorWithStyleHooks',
      'errorWithReplacement',
      'errorWithStyleHooks',
      'errorWithNoRecommendation',
    ]);

    const fixed = await lint(code, true);
    expect(fixed.output).toContain("'--slds-g-color-accent-dark-1': '#123456'");
    expect(fixed.output).toContain("'--lwc-brandPrimaryTransparent': 'transparent'");
    expect(fixed.output).toContain("'--lwc-colorBackgroundLight': '#eee'");
    expect(fixed.output).toContain("'--lwc-brandBackgroundDark': '#000'");
    expect(messages(fixed)).toHaveLength(3);
  });

  it('reports and fixes outermost LWC var calls in styled declaration values', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        color: var(--lwc-brandDark, var(--lwc-brandPrimaryTransparent));
        padding: var(--lwc-cardBodyPadding);
      \`;
    `, true);

    expect(result.messages).toHaveLength(0);
    expect(result.output).toContain(
      'color: var(--slds-g-color-accent-dark-1, var(--lwc-brandDark, var(--lwc-brandPrimaryTransparent)));',
    );
    expect(result.output).toContain('padding: 0 var(--slds-g-spacing-4);');
  });

  it('reports and fixes eligible nested fallbacks when the outer LWC token is unknown or continue-to-use', async () => {
    const result = await lintRecommended(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        color: var(--lwc-customer-created, var(--lwc-brandDark));
        background: var(--lwc-brandHeader, var(--lwc-brandPrimaryTransparent));
      \`;
    `, true);

    expect(messages(result)).toHaveLength(0);
    expect(result.messages.filter(message => message.messageId === 'unsupportedFallback')).toHaveLength(1);
    expect(result.output).toContain(
      'color: var(--lwc-customer-created, var(--slds-g-color-accent-dark-1, var(--lwc-brandDark)));',
    );
    expect(result.output).toContain('background: var(--lwc-brandHeader, transparent);');
  });

  it('reports empty and array outer tokens while fixing eligible nested fallbacks', async () => {
    const code = `
      import styled from 'styled-components';
      const Panel = styled.div\`
        color: var(--lwc-brandBackgroundDark, var(--lwc-brandDark));
        background: var(--lwc-colorBackgroundLight, var(--lwc-brandPrimaryTransparent));
      \`;
    `;
    const first = await lint(code);
    expect(messages(first).map(message => message.messageId)).toEqual([
      'errorWithNoRecommendation',
      'errorWithStyleHooks',
      'errorWithStyleHooks',
      'errorWithReplacement',
    ]);

    const fixed = await lint(code, true);
    expect(fixed.output).toContain(
      'color: var(--lwc-brandBackgroundDark, var(--slds-g-color-accent-dark-1, var(--lwc-brandDark)));',
    );
    expect(fixed.output).toContain(
      'background: var(--lwc-colorBackgroundLight, transparent);',
    );
    expect(messages(fixed).map(message => message.messageId)).toEqual([
      'errorWithNoRecommendation',
      'errorWithStyleHooks',
    ]);

    const converged = await lint(fixed.output, true);
    expect(converged.output).toBeUndefined();
    expect(messages(converged)).toHaveLength(2);
  });

  it('skips strings and comments while continuing to scan styled values', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        content: 'var(--lwc-brandDark)';
        background: url("var(--lwc-brandDark)") var(--lwc-brandDark);
        color: /* var(--lwc-brandPrimaryTransparent) */ var(--lwc-brandDark);
      \`;
    `);

    expect(messages(result)).toHaveLength(2);
  });

  it('does not report LWC calls used as SLDS var fallbacks', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        color: var(/* keep */ --slds-g-color-accent-dark-1, var(--lwc-brandDark));
        border-color: calc(1px + var(--slds-g-color-accent-1, var(--lwc-brandPrimary)));
      \`;
    `);

    expect(messages(result)).toHaveLength(0);
  });

  it('scans a moderate number of nested fallback calls without losing matches', async () => {
    const declarations = Array.from(
      {length: 300},
      (_, index) => `--value-${index}: var(--lwc-customer-created, var(--lwc-brandDark));`,
    ).join('\n');
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`${declarations}\`;
    `);

    expect(messages(result)).toHaveLength(300);
  });

  it('reports every eligible styled custom-property category and only fixes a single SLDS replacement', async () => {
    const code = `
      import styled from 'styled-components';
      const Panel = styled.div\`
        --lwc-brandDark: #123456;
        --lwc-brandPrimaryTransparent: transparent;
        --lwc-colorBackgroundLight: #eee;
        --lwc-brandBackgroundDark: #000;
      \`;
    `;
    const result = await lint(code);

    expect(messages(result).map(message => message.messageId)).toEqual([
      'errorWithStyleHooks',
      'errorWithReplacement',
      'errorWithStyleHooks',
      'errorWithNoRecommendation',
    ]);

    const fixed = await lint(code, true);
    expect(fixed.output).toContain('--slds-g-color-accent-dark-1: #123456;');
    expect(fixed.output).toContain('--lwc-brandPrimaryTransparent: transparent;');
    expect(fixed.output).toContain('--lwc-colorBackgroundLight: #eee;');
    expect(fixed.output).toContain('--lwc-brandBackgroundDark: #000;');
    expect(messages(fixed)).toHaveLength(3);
  });

  it('ignores unknown, continue-to-use, and interpolation-adjacent styled tokens', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        color: var(--lwc-customer-created);
        background: var(--lwc-brandHeader);
        border-color: \${prefix}var(--lwc-brandDark);
      \`;
    `);

    expect(messages(result)).toHaveLength(0);
  });
});
