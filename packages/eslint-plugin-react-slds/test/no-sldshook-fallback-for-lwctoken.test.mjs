import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

const ruleId = '@salesforce-ux/slds/no-sldshook-fallback-for-lwctoken';

async function lint(code, fix = false) {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{
      ...plugin.configs.recommended[0],
      rules: {[ruleId]: 'warn'},
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

const messages = result => result.messages.filter(message => message.ruleId === ruleId);

describe('no-sldshook-fallback-for-lwctoken', () => {
  it('reports global and component SLDS hooks and normalizes SDS hooks for membership', async () => {
    const result = await lint(`
      const View = () => <div style={{
        color: 'var(--lwc-colorBackground, var(--slds-g-color-border-1))',
        background: 'var(--lwc-brandDark, var(--sds-c-button-color-background))',
      }} />;
    `);

    expect(messages(result)).toEqual([
      expect.objectContaining({
        messageId: 'unsupportedFallback', severity: 1,
        line: 3, column: 21, endColumn: 42,
        message: 'Remove the --slds-g-color-border-1 styling hook that is used as a fallback value for --lwc-colorBackground.',
      }),
      expect.objectContaining({
        messageId: 'unsupportedFallback', severity: 1,
        line: 4, column: 26, endColumn: 41,
        message: 'Remove the --sds-c-button-color-background styling hook that is used as a fallback value for --lwc-brandDark.',
      }),
    ]);
    expect(result.output).toBeUndefined();
    expect(messages(await lint(`const View = () => <div style={{color: 'var(--lwc-colorBackground, var(--slds-g-color-border-1))'}} />;`, true))).toHaveLength(1);
  });

  it('excludes unknown and shared hooks, non-LWC calls, missing or static fallbacks, and property keys', async () => {
    const result = await lint(`
      const View = () => <div style={{
        '--lwc-colorBackground': 'var(--slds-g-color-border-1)',
        color: 'var(--custom, var(--slds-g-color-border-1))',
        background: 'var(--lwc-colorBackground)',
        border: 'var(--lwc-colorBackground, #fff)',
        outline: 'var(--lwc-colorBackground, var(--slds-g-not-real))',
        padding: 'var(--lwc-colorBackground, var(--slds-s-button-color))',
      }} />;
    `);

    expect(messages(result)).toHaveLength(0);
  });

  it('reports multiple relationships in declarations, calc, and direct nested hook fallbacks', async () => {
    const result = await lint(`
      const View = () => <div style={{
        color: 'var(--lwc-colorBackground, var(--slds-g-color-border-1)) var(--lwc-spacingSmall, var(--slds-g-spacing-2))',
        width: 'calc(100% - var(--lwc-spacingMedium, var(--slds-g-spacing-4)))',
        border: 'var(--lwc-colorBorder, var(--slds-g-color-border-1, var(--custom)))',
      }} />;
    `);

    expect(messages(result).map(message => message.messageId)).toEqual([
      'unsupportedFallback', 'unsupportedFallback', 'unsupportedFallback', 'unsupportedFallback',
    ]);
  });

  it('uses only the first nested var candidate in each fallback', async () => {
    const result = await lint(`
      const View = () => <div style={{
        color: 'var(--lwc-colorBackground, calc(var(--slds-g-color-border-1)))',
        background: 'var(--lwc-brandDark, var(--custom) var(--slds-g-color-border-1))',
        border: 'var(--lwc-colorBorder, var(--slds-g-not-real) var(--slds-g-color-border-1))',
        outline: 'var(--lwc-colorBorder, var(--slds-g-color-border-1, var(--custom)))',
      }} />;
    `);

    expect(messages(result)).toEqual([
      expect.objectContaining({line: 3}),
      expect.objectContaining({line: 6}),
    ]);
  });

  it('inspects complete static fragments of interpolated inline templates', async () => {
    const result = await lint(`
      const View = ({dynamic}) => <div style={{ color: \`var(--lwc-colorBackground, var(--slds-g-color-border-1)) \${dynamic} var(--lwc-colorBorder, var(--slds-g-color-border-2))\` }} />;
    `);

    expect(messages(result)).toEqual([
      expect.objectContaining({line: 2, column: 61, endColumn: 82}),
      expect.objectContaining({line: 2, column: 129, endColumn: 146}),
    ]);
  });

  it('reports a complete inline relationship ending at a hole boundary but skips joined or split calls', async () => {
    const result = await lint(`
      const View = ({dynamic}) => <div style={{
        color: \`var(--lwc-colorBackground, var(--slds-g-color-border-1))\${dynamic}\`,
        border: \`\${dynamic}var(--lwc-colorBackground, var(--slds-g-color-border-1))\`,
        margin: \`var(--lwc-colorBackground, var(--slds-g-color-\${dynamic}border-1))\`,
      }} />;
    `);
    expect(messages(result)).toEqual([expect.objectContaining({line: 3})]);
  });

  it('skips a hole in the inline relationship and handles a completed relationship before a later hole', async () => {
    const result = await lint(`
      const View = ({fallback, tail}) => <div style={{
        color: \`var(--lwc-colorBackground, \${fallback}var(--slds-g-color-border-1))\`,
        border: \`var(--lwc-colorBackground, var(--slds-g-color-border-1)) \${tail}\`,
      }} />;
    `);
    expect(messages(result)).toEqual([expect.objectContaining({line: 4})]);
  });

  it('shares inline discovery for direct values, const objects and values, wrappers, dedupe, and explicit spread siblings', async () => {
    const result = await lint(`
      const color = 'var(--lwc-colorBackground, var(--slds-g-color-border-1))' as const;
      const styles = ({...uninspected, color: color!, borderColor: 'var(--lwc-colorBorder, var(--slds-g-color-border-2))'} as const) satisfies React.CSSProperties;
      const View = () => <><div style={{background: 'var(--lwc-brandDark, var(--slds-g-color-accent-1))'}} /><div style={styles!} /><span style={styles} /></>;
    `);

    expect(messages(result)).toEqual([
      expect.objectContaining({line: 2}),
      expect.objectContaining({line: 3}),
      expect.objectContaining({line: 4}),
    ]);
  });

  it('skips mutable, imported, parameter, call, conditional, alias-chain, spread-content, and mutated sources', async () => {
    const result = await lint(`
      import { importedStyles } from './styles';
      let mutable = {color: 'var(--lwc-colorBackground, var(--slds-g-color-border-1))'};
      const spreadContent = {color: 'var(--lwc-colorBackground, var(--slds-g-color-border-1))'};
      const spreadOnly = {...spreadContent};
      const called = getStyles();
      const conditional = ready ? spreadContent : called;
      const first = 'var(--lwc-colorBackground, var(--slds-g-color-border-1))';
      const second = first;
      const mutated = {color: 'var(--lwc-colorBackground, var(--slds-g-color-border-1))'};
      mutated.color = 'red';
      const assigned = {color: 'var(--lwc-colorBackground, var(--slds-g-color-border-1))'};
      Object.assign(assigned, {color: 'red'});
      function View({parameterStyles}) {
        return <><div style={mutable} /><div style={importedStyles} /><div style={parameterStyles} />
          <div style={spreadOnly} /><div style={called} /><div style={conditional} />
          <div style={{color: second}} /><div style={mutated} /><div style={assigned} /></>;
      }
    `);

    expect(messages(result)).toHaveLength(0);
  });

  it('accepts comments as CSS whitespace and skips strings, comments, URLs, malformed calls, and casing variants', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const View = () => <div style={{color: 'var(/*a*/ --lwc-colorBackground /*b*/, /*c*/ var(/*d*/ --slds-g-color-border-1 /*e*/))'}} />;
      const Panel = styled.div\`
        content: 'var(--lwc-colorBackground, var(--slds-g-color-border-1))';
        background: url("var(--lwc-colorBackground, var(--slds-g-color-border-1))");
        outline: /* var(--lwc-colorBackground, var(--slds-g-color-border-1)) */ none;
        border: VAR(--lwc-colorBackground, var(--slds-g-color-border-1));
        padding: var(--LWC-colorBackground, var(--slds-g-color-border-1));
        margin: var(--lwc-spacingSmall var(--slds-g-spacing-2));
        inset: var(--lwc-spacingSmall, VAR(--slds-g-spacing-2));
      \`;
    `);

    expect(messages(result)).toEqual([expect.objectContaining({line: 3})]);
  });

  it('honors styled aliases, lexical shadowing, non-styled tags, and static interpolation boundaries', async () => {
    const result = await lint(`
      import styledAlias, {styled as namedStyled} from 'styled-components';
      import other from 'other';
      const one = styledAlias.div\`color: var(--lwc-colorBackground, var(--slds-g-color-border-1));\`;
      const two = namedStyled('div')\`padding: var(--lwc-spacingSmall, var(--slds-g-spacing-2));\`;
      const three = other.div\`color: var(--lwc-colorBackground, var(--slds-g-color-border-1));\`;
      const shadow = styledAlias => styledAlias.div\`color: var(--lwc-colorBackground, var(--slds-g-color-border-1));\`;
      const joinedOuter = styledAlias.div\`color: var(--lwc-\${name}, var(--slds-g-color-border-1));\`;
      const separated = styledAlias.div\`color: var(--lwc-colorBackground, \${fallback}var(--slds-g-color-border-1));\`;
      const joinedInner = styledAlias.div\`color: var(--lwc-colorBackground, var(--slds-g-color-\${kind}));\`;
      const safeTail = styledAlias.div\`color: var(--lwc-colorBackground, var(--slds-g-color-border-1)) \${tail};\`;
    `);

    expect(messages(result)).toEqual([
      expect.objectContaining({line: 4}),
      expect.objectContaining({line: 5}),
      expect.objectContaining({line: 11}),
    ]);
  });

  it('keeps the fallback diagnostic observable after the LWC migration autofix', async () => {
    const code = `const View = () => <div style={{color: 'var(--lwc-brandDark, var(--slds-g-color-border-1))'}} />;`;
    const first = await lintRecommended(code);
    const expectedRuleIds = [
      '@salesforce-ux/slds/lwc-token-to-slds-hook',
      ruleId,
      '@salesforce-ux/slds/no-slds-var-without-fallback',
    ];
    if (process.env.TARGET_PERSONA === 'internal') {
      expectedRuleIds.push('@salesforce-ux/slds/no-invalid-hook-property-usage');
    }
    expect(first.messages.map(message => message.ruleId)).toEqual(expectedRuleIds);

    const fixed = await lintRecommended(code, true);
    expect(fixed.output).toContain('var(--slds-g-color-accent-dark-1, var(--lwc-brandDark, var(--slds-g-color-border-1, #e5e5e5)))');
    expect(messages(fixed)).toEqual([
      expect.objectContaining({messageId: 'unsupportedFallback', line: 1, severity: 1}),
    ]);
    expect(fixed.messages.every(message => message.fix == null && message.suggestions == null)).toBe(true);
  });
});
