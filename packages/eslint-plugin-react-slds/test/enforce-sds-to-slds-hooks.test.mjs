import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

const ruleId = '@salesforce-ux/slds/enforce-sds-to-slds-hooks';

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

const messages = result => result.messages.filter(message => message.messageId === 'replaceSdsWithSlds');

describe('enforce-sds-to-slds-hooks', () => {
  it('reports and fixes known global and component hooks in direct inline values', async () => {
    const code = "const View = () => <div style={{ color: 'var(--sds-g-color-palette-blue-10)', background: `var(--sds-c-button-color-background)` }} />;";
    const result = await lint(code);

    expect(messages(result)).toEqual([
      expect.objectContaining({line: 1, column: 46, endColumn: 75, severity: 1}),
      expect.objectContaining({line: 1, column: 96, endColumn: 127, severity: 1}),
    ]);

    const fixed = await lint(code, true);
    expect(fixed.messages).toHaveLength(0);
    expect(fixed.output).toBe("const View = () => <div style={{ color: 'var(--slds-g-color-palette-blue-10)', background: `var(--slds-c-button-color-background)` }} />;");
  });

  it('resolves local const style objects and direct const property values with TypeScript wrappers', async () => {
    const result = await lint(`
      const color = 'var(--sds-g-color-palette-blue-10)' as const;
      const styles = ({ color, borderColor: color } as const) satisfies React.CSSProperties;
      const View = () => <><div style={styles!} /><span style={styles} /></>;
    `);

    expect(messages(result)).toEqual([
      expect.objectContaining({line: 2, column: 26, endColumn: 55}),
    ]);
  });

  it('inspects complete static fragments of interpolated inline templates', async () => {
    const result = await lint(`
      const View = ({dynamic}) => <div style={{ color: \`var(--sds-g-spacing-1) \${dynamic} var(--sds-c-button-color-background)\` }} />;
    `);

    expect(messages(result)).toEqual([
      expect.objectContaining({line: 2, column: 61, endColumn: 78}),
      expect.objectContaining({line: 2, column: 95, endColumn: 126}),
    ]);
  });

  it('keeps a complete inline var ending at a hole boundary but skips joined or split calls', async () => {
    const code = `
      const View = ({dynamic}) => <div style={{
        color: \`var(--sds-g-spacing-1)\${dynamic}\`,
        border: \`\${dynamic}var(--sds-g-spacing-2)\`,
        margin: \`var(--sds-g-spacing-\${dynamic}1)\`,
      }} />;
    `;
    const result = await lint(code);
    expect(messages(result)).toEqual([expect.objectContaining({line: 3})]);

    const fixed = await lint(code, true);
    expect(fixed.messages).toHaveLength(0);
    expect(fixed.output).toContain('var(--slds-g-spacing-1)\${dynamic}');
    expect(fixed.output).toContain('\${dynamic}var(--sds-g-spacing-2)');
  });

  it('reports static inline custom-property keys and deduplicates referenced objects', async () => {
    const code = `
      const styles = {
        '--sds-g-spacing-1': '4px',
        [[33m'--sds-c-button-color-background'[39m]: 'red',
        [[33m[39m\`--sds-g-spacing-2\`]: '8px',
      } satisfies React.CSSProperties;
      const View = () => <><div style={styles} /><span style={styles} /></>;
    `.replaceAll('\u001b[33m', '').replaceAll('\u001b[39m', '');
    const result = await lint(code, true);

    expect(result.messages).toHaveLength(0);
    expect(result.output).toContain("'--slds-g-spacing-1': '4px'");
    expect(result.output).toContain("['--slds-c-button-color-background']: 'red'");
    expect(result.output).toContain('[`--slds-g-spacing-2`]: \'8px\'');
  });

  it('reports styled declaration names and every eligible nested var first argument', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        --sds-g-spacing-1: 4px;
        color: var(--custom, var(--slds-g-color-brand-base-50, var(--sds-g-color-palette-blue-10)));
        margin: calc(var(--sds-g-spacing-2) + var(--sds-g-spacing-3, var(--sds-c-button-spacing-block-start)));
      \`;
    `);

    expect(messages(result)).toHaveLength(5);
  });

  it('accepts only exact global or component metadata members', async () => {
    const result = await lint(`
      const View = () => <div style={{
        color: 'var(--sds-g-color-palette-blue-10)',
        background: 'var(--sds-c-button-color-background)',
        border: 'var(--sds-s-button-color)',
        padding: 'var(--sds-g-not-real)',
        margin: 'var(--custom-hook)',
        inset: 'var(--slds-g-spacing-1)',
      }} />;
    `);

    expect(messages(result)).toHaveLength(2);
  });

  it('skips arbitrary text, uppercase or malformed calls, strings, comments, and URLs', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        --custom: --sds-g-spacing-1;
        content: 'var(--sds-g-spacing-1)';
        background: url("var(--sds-g-spacing-1)") /* var(--sds-g-spacing-1) */;
        margin: VAR(--sds-g-spacing-1) var --sds-g-spacing-1 var(--sds-g-spacing-1;
      \`;
    `);

    expect(messages(result)).toHaveLength(0);
  });

  it('skips mutable, spread content, dynamic values, and computed-unsafe inline keys while inspecting explicit spread siblings', async () => {
    const result = await lint(`
      let mutable = { '--sds-g-spacing-1': '4px' };
      const dynamic = { [name]: 'var(--sds-g-spacing-1)', color: getColor() };
      const spread = { ...dynamic, '--sds-g-spacing-1': '4px' };
      const key = '--sds-g-spacing-1';
      const View = () => <><div style={mutable} /><div style={dynamic} /><div style={spread} />
        <div style={{ [key]: '4px', color: value }} /></>;
    `);

    expect(messages(result)).toEqual([
      expect.objectContaining({line: 3, column: 38, endColumn: 55}),
      expect.objectContaining({line: 4, column: 37, endColumn: 54}),
    ]);
  });

  it('skips const style objects after direct member and Object.assign mutations', async () => {
    const result = await lint(`
      const directlyMutated = { color: 'var(--sds-g-spacing-1)' };
      directlyMutated.color = 'red';
      const assigned = { color: 'var(--sds-g-spacing-1)' };
      Object.assign(assigned, { color: 'red' });
      const View = () => <><div style={directlyMutated} /><div style={assigned} /></>;
    `);

    expect(messages(result)).toHaveLength(0);
  });

  it('skips style objects and direct aliases passed to unknown calls or constructors', async () => {
    const result = await lint(`
      const called = {color: 'var(--sds-g-spacing-1)'};
      consume(called);
      const constructed = {color: 'var(--sds-g-spacing-2)'};
      const alias = constructed;
      new Box(alias);
      const View = () => <><div style={called} /><div style={constructed} /></>;
    `);
    expect(messages(result)).toHaveLength(0);
  });

  it('handles long direct-alias mutation chains without recursive overflow', async () => {
    const aliases = Array.from({length: 2500}, (_, index) =>
      `const alias${index + 1} = alias${index};`
    ).join('\n');
    const result = await lint(`
      const style = {color: 'var(--sds-g-spacing-1)'};
      const alias0 = style;
      ${aliases}
      alias2500.color = 'red';
      const View = () => <div style={style} />;
    `);
    expect(messages(result)).toHaveLength(0);
  });

  it('treats CSS comments as whitespace around var first arguments', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const View = () => <div style={{ color: 'var(/* before */ --sds-g-spacing-1 /* after */)' }} />;
      const Panel = styled.div\`color: var(/* before */ --sds-g-spacing-2 /* after */);\`;
    `);

    expect(messages(result)).toHaveLength(2);
  });

  it('honors styled bindings and static interpolation boundaries', async () => {
    const result = await lint(`
      import styledAlias, { styled as namedStyled } from 'styled-components';
      import other from 'other';
      const one = styledAlias.div\`color: var(--sds-g-spacing-1);\`;
      const two = namedStyled('div')\`padding: var(--sds-g-spacing-2);\`;
      const three = other.div\`margin: var(--sds-g-spacing-3);\`;
      const styledAliasShadow = (styledAlias) => styledAlias.div\`inset: var(--sds-g-spacing-4);\`;
      const unsafe = styledAlias.div\`border: \${prefix}var(--sds-g-spacing-4); color: var(--sds-g-spacing-5)\${suffix};\`;
    `, true);

    expect(result.messages).toHaveLength(0);
    expect(result.output).toContain('color: var(--slds-g-spacing-1)');
    expect(result.output).toContain('padding: var(--slds-g-spacing-2)');
    expect(result.output).toContain('other.div\`margin: var(--sds-g-spacing-3)');
    expect(result.output).toContain('\${prefix}var(--sds-g-spacing-4)');
    expect(result.output).toContain('var(--slds-g-spacing-5)\${suffix}');
  });

  it('reports and fixes a static var name when only its fallback is dynamic', async () => {
    const code = `
      import styled from 'styled-components';
      const Panel = styled.div\`margin: var(--sds-g-spacing-1, \${fallback});\`;
    `;

    const result = await lint(code);
    expect(messages(result)).toEqual([
      expect.objectContaining({line: 3, column: 44, endColumn: 61}),
    ]);

    const fixed = await lint(code, true);
    expect(fixed.messages).toHaveLength(0);
    expect(fixed.output).toContain('var(--slds-g-spacing-1, \${fallback})');
  });

  it('masks inline interpolation expressions without scanning their punctuation', async () => {
    const code = `
      const View = ({fallback, name, prefix}) => <div style={{
        color: \`var(--sds-g-spacing-1, \${choose(")")})\`,
        border: \`var(\${name}, red)\`,
        margin: \`\${prefix}var(--sds-g-spacing-2)\`,
        padding: \`var(--sds-g-spacing-3)\${fallback}\`,
      }} />;
    `;
    const result = await lint(code);
    expect(messages(result)).toEqual([
      expect.objectContaining({line: 3}),
      expect.objectContaining({line: 6}),
    ]);

    const fixed = await lint(code, true);
    expect(fixed.messages).toHaveLength(0);
    expect(fixed.output).toContain('var(--slds-g-spacing-1, \${choose(")")})');
    expect(fixed.output).toContain('var(--slds-g-spacing-3)\${fallback}');
    expect(fixed.output).toContain('var(\${name}, red)');
  });

  it('reports multiple complete static ranges and converges after autofix', async () => {
    const code = `
      import styled from 'styled-components';
      const Panel = styled.div\`color: var(--sds-g-spacing-1, var(--sds-g-spacing-2));\`;
    `;
    const first = await lint(code);
    expect(messages(first).map(message => [message.line, message.column, message.endColumn])).toEqual([
      [3, 43, 60],
      [3, 66, 83],
    ]);

    const fixed = await lint(code, true);
    expect(fixed.messages).toHaveLength(0);
    expect(fixed.output).toContain('var(--slds-g-spacing-1, var(--slds-g-spacing-2))');
    const converged = await lint(fixed.output);
    expect(messages(converged)).toHaveLength(0);
  });
});
