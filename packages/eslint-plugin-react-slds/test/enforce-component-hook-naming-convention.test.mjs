import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

const ruleName = 'enforce-component-hook-naming-convention';
const ruleId = `@salesforce-ux/slds/${ruleName}`;
const fallbackRule = {meta: {schema: [], messages: {}}, create: () => ({})};

async function lint(code, fix = false) {
  const testPlugin = {...plugin, rules: {...plugin.rules, [ruleName]: plugin.rules[ruleName] || fallbackRule}};
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{
      ...plugin.configs.recommended[0],
      plugins: {'@salesforce-ux/slds': testPlugin},
      rules: {[ruleId]: 'error'},
    }],
    fix,
  });
  const [result] = await eslint.lintText(code, {filePath: 'component.tsx'});
  return result;
}

async function lintRecommended(code) {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: plugin.configs.recommended,
  });
  const [result] = await eslint.lintText(code, {filePath: 'component.tsx'});
  return result;
}

const replacements = result => result.messages.filter(message => message.messageId === 'replace');

describe('enforce-component-hook-naming-convention', () => {
  it('preserves foundation rule overlaps under the recommended config', async () => {
    const result = await lintRecommended(`
      const View = () => <div style={{
        '--slds-c-button-spacing-blockstart': '1px',
        color: 'var(--slds-c-button-spacing-blockstart, red)',
      }} />;
    `);

    expect(result.messages.map(message => message.ruleId)).toEqual([
      '@salesforce-ux/slds/no-unsupported-hooks-slds2',
      '@salesforce-ux/slds/no-slds-namespace-for-custom-hooks',
      ruleId,
      '@salesforce-ux/slds/no-unsupported-hooks-slds2',
      '@salesforce-ux/slds/no-slds-namespace-for-custom-hooks',
      ruleId,
    ]);
  });

  it('uses exact case-sensitive metadata membership and ignores className text', async () => {
    const result = await lint(`
      const View = () => <div
        className="--slds-c-button-spacing-blockstart"
        style={{
          '--slds-c-button-spacing-blockstart': '1px',
          '--slds-c-button-spacing-block-start': '2px',
          '--SLDS-c-button-spacing-blockstart': '3px',
          '--slds-c-not-a-metadata-member': '4px',
        }}
      />;
    `);

    expect(replacements(result)).toEqual([
      expect.objectContaining({
        line: 5,
        column: 12,
        endColumn: 46,
        severity: 2,
        messageId: 'replace',
        message: expect.stringContaining('--slds-c-button-spacing-block-start'),
      }),
    ]);
  });

  it('reports inline declaration keys and every valid nested var name with name-only fixes', async () => {
    const code = `const View = () => <div style={{ '--slds-c-button-spacing-blockstart': 'var(--slds-c-button-spacing-inlineend, var(--slds-c-button-brand-spacing-inlinestart))' }} />;`;
    const result = await lint(code);

    expect(replacements(result).map(message => [message.column, message.endColumn])).toEqual([
      [35, 69],
      [77, 110],
      [116, 157],
    ]);

    const fixed = await lint(code, true);
    expect(fixed.messages).toHaveLength(0);
    expect(fixed.output).toBe(`const View = () => <div style={{ '--slds-c-button-spacing-block-start': 'var(--slds-c-button-spacing-inline-end, var(--slds-c-button-brand-spacing-inline-start))' }} />;`);
  });

  it('resolves safe const objects through TypeScript wrappers and deduplicates reuse', async () => {
    const result = await lint(`
      const value = 'var(--slds-c-button-spacing-inlineend)' as const;
      const style = ({'--slds-c-button-spacing-blockstart': value!} as const) satisfies React.CSSProperties;
      const View = () => <><div style={style!} /><span style={style} /></>;
    `);

    expect(replacements(result)).toHaveLength(2);
  });

  it('is conservative for mutable, spread, dynamic, and non-CSS text sources', async () => {
    const result = await lint(`
      let mutable = {'--slds-c-button-spacing-blockstart': '1px'};
      const source = {'--slds-c-button-spacing-inlineend': '2px'};
      const style = {...source, [name]: 'var(--slds-c-button-spacing-blockstart)', color: value};
      const View = () => <><div style={mutable} /><div style={style} /></>;
      import styled from 'styled-components';
      const Panel = styled.div\`
        content: 'var(--slds-c-button-spacing-blockstart)';
        background: url("var(--slds-c-button-spacing-inlineend)") /* var(--slds-c-button-spacing-blockend) */;
        color: VAR(--slds-c-button-spacing-blockstart) var(--slds-c-button-spacing-inlineend;
      \`;
    `);

    expect(replacements(result)).toEqual([
      expect.objectContaining({line: 4, column: 46, endColumn: 80}),
    ]);
  });

  it('supports styled default and named aliases, shadowing, and nested at-rules', async () => {
    const result = await lint(`
      import styledAlias, {styled as namedStyled} from 'styled-components';
      import other from 'other';
      const One = styledAlias.div\`@media (width > 1px) { --slds-c-button-spacing-blockstart: 1px; color: var(--slds-c-button-spacing-inlineend); }\`;
      const Two = namedStyled('div')\`padding: var(--slds-c-button-brand-spacing-inlinestart);\`;
      const Three = other.div\`margin: var(--slds-c-button-spacing-blockend);\`;
      const shadow = styledAlias => styledAlias.div\`inset: var(--slds-c-button-spacing-blockend);\`;
    `);

    expect(replacements(result)).toHaveLength(3);
  });

  it('fixes a complete static styled name with a dynamic fallback but skips split or touching names', async () => {
    const code = `
      import styled from 'styled-components';
      const Panel = styled.div\`
        color: var(--slds-c-button-spacing-blockstart, \${fallback});
        border: var(--slds-c-button-spacing-\${suffix});
        margin: \${prefix}var(--slds-c-button-spacing-inlineend);
      \`;
    `;
    const result = await lint(code);
    expect(replacements(result)).toEqual([expect.objectContaining({line: 4})]);

    const fixed = await lint(code, true);
    expect(fixed.messages).toHaveLength(0);
    expect(fixed.output).toContain('var(--slds-c-button-spacing-block-start, ${fallback})');
    expect(fixed.output).toContain('var(--slds-c-button-spacing-${suffix})');
    expect(fixed.output).toContain('${prefix}var(--slds-c-button-spacing-inlineend)');
  });

  it('fixes multiple findings and converges', async () => {
    const code = `const View = () => <div style={{'--slds-c-button-spacing-blockstart': 'var(--slds-c-button-spacing-inlineend)'}} />;`;
    const first = await lint(code);
    expect(replacements(first)).toHaveLength(2);

    const fixed = await lint(code, true);
    expect(fixed.messages).toHaveLength(0);
    expect(replacements(await lint(fixed.output))).toHaveLength(0);
  });
});
