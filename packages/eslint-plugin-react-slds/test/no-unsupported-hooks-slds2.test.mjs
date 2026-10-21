import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

const ruleId = '@salesforce-ux/slds/no-unsupported-hooks-slds2';

async function lint(code, options = {}) {
  const rules = options.rules || {[ruleId]: 'warn'};
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{
      ...plugin.configs.recommended[0],
      rules,
    }],
    fix: options.fix || false,
  });
  const [result] = await eslint.lintText(code, {filePath: 'component.tsx'});
  return result;
}

const deprecated = result => result.messages.filter(message => message.messageId === 'deprecated');

describe('no-unsupported-hooks-slds2', () => {
  it('reports representative exact deprecated metadata members in declaration keys and value references', async () => {
    const result = await lint(`
      const View = () => <div style={{
        '--slds-g-color-border-base-2': 'var(--slds-c-badge-line-height)',
        '--sds-c-badge-text-color': 'var(--slds-kx-button-underline-scale-x)',
        '--slds-s-label-sizing-gap': 'var(--slds-g-link-color)',
      }} />;
    `);

    expect(deprecated(result).map(message => message.message.match(/'([^']+)'/u)[1])).toEqual([
      '--slds-g-color-border-base-2',
      '--slds-c-badge-line-height',
      '--sds-c-badge-text-color',
      '--slds-kx-button-underline-scale-x',
      '--slds-s-label-sizing-gap',
      '--slds-g-link-color',
    ]);
  });

  it('reports every complete lowercase var first argument through nesting, fallback, and calc', async () => {
    const result = await lint(`
      const View = () => <div style={{ color:
        'calc(var(--slds-g-color-border-base-2) + var(--custom, var(--slds-g-link-color, var(--slds-c-badge-line-height))))'
      }} />;
    `);

    expect(deprecated(result)).toHaveLength(3);
  });

  it('uses exact case-sensitive metadata membership without normalizing SDS names', async () => {
    const result = await lint(`
      const View = () => <div style={{
        '--slds-c-button-color-background': 'var(--slds-c-button-color-background)',
        '--custom-hook': 'var(--unknown-hook)',
        color: 'red',
        border: 'var(--SLDS-g-color-border-base-2)',
        padding: 'var(--sds-g-color-border-base-2)',
      }} />;
    `);

    expect(deprecated(result)).toHaveLength(0);
  });

  it('shares inline discovery for direct, const, value, wrappers, static quasis and keys with dedupe', async () => {
    const result = await lint(`
      const color = 'var(--slds-g-link-color)' as const;
      const style = ({
        ...external,
        '--slds-g-color-border-base-2': color!,
        [[33m'--slds-c-badge-line-height'[39m]: [33m[39m\`x [33m[39m\${dynamic} var(--slds-g-link-color-hover)\`,
        [[33m[39m\`--slds-g-link-color-focus\`]: 'ok',
      } as const) satisfies React.CSSProperties;
      const View = () => <><div style={style!} /><span style={style} /></>;
    `.replaceAll('\u001b[33m', '').replaceAll('\u001b[39m', ''));

    expect(deprecated(result)).toHaveLength(5);
  });

  it('reports a complete inline var ending at a hole boundary but skips joined or split calls', async () => {
    const result = await lint(`
      const View = ({dynamic}) => <div style={{
        color: \`var(--slds-g-link-color)\${dynamic}\`,
        border: \`\${dynamic}var(--slds-g-link-color)\`,
        margin: \`var(--slds-g-link-\${dynamic}color)\`,
      }} />;
    `);
    expect(deprecated(result)).toEqual([expect.objectContaining({line: 3})]);
  });

  it('reports a static deprecated inline name with a dynamic fallback', async () => {
    const result = await lint(`
      const View = ({fallback}) => <div style={{
        color: \`var(--slds-g-link-color, \${fallback})\`,
      }} />;
    `);
    expect(deprecated(result)).toEqual([expect.objectContaining({line: 3})]);
  });

  it('excludes mutable, mutation-unsafe, dynamic, computed, alias-chain, and spread content', async () => {
    const result = await lint(`
      let mutable = {color: 'var(--slds-g-link-color)'};
      const mutated = {color: 'var(--slds-g-link-color)'};
      mutated.color = 'red';
      const spreadSource = {color: 'var(--slds-g-link-color)'};
      const first = 'var(--slds-g-link-color)';
      const second = first;
      const style = {...spreadSource, [name]: getValue(), color: second, inset: getValue()};
      const View = () => <><div style={mutable} /><div style={mutated} /><div style={style} /></>;
    `);

    expect(deprecated(result)).toHaveLength(0);
  });

  it('inspects explicit spread siblings but not the spread source', async () => {
    const result = await lint(`
      const source = {color: 'var(--slds-g-link-color)'};
      const style = {...source, '--slds-g-color-border-base-2': 'red'};
      const View = () => <div style={style} />;
    `);

    expect(deprecated(result)).toHaveLength(1);
  });

  it('handles comments as whitespace and skips strings, comments, URLs, malformed and uppercase calls', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const View = () => <div style={{color: 'var(/*a*/ --slds-g-link-color /*b*/)'}} />;
      const Panel = styled.div\`
        content: 'var(--slds-g-link-color)';
        background: url("var(--slds-g-link-color)") /* var(--slds-g-link-color) */;
        margin: VAR(--slds-g-link-color) var(--slds-g-link-color;
      \`;
    `);

    expect(deprecated(result)).toHaveLength(1);
  });

  it('honors styled aliases and shadowing while reporting declarations and values', async () => {
    const result = await lint(`
      import styledAlias, {styled as namedStyled} from 'styled-components';
      import other from 'other';
      const One = styledAlias.div\`--slds-g-link-color: red; color: var(--slds-g-color-border-base-2);\`;
      const Two = namedStyled('div')\`padding: var(--slds-c-badge-line-height);\`;
      const Three = other.div\`margin: var(--slds-g-link-color);\`;
      const shadow = styledAlias => styledAlias.div\`inset: var(--slds-g-link-color);\`;
    `);

    expect(deprecated(result)).toHaveLength(3);
  });

  it('reports a static styled name with dynamic fallback and skips split or touching names', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        color: var(--slds-g-link-color, \${fallback});
        border: var(\${prefix}--slds-g-link-color);
        inset: var(--slds-g-link-color\${suffix});
      \`;
    `);

    expect(deprecated(result)).toHaveLength(1);
  });

  it('classifies many exact styled ranges across sorted interpolation holes', async () => {
    const declarations = Array.from({length: 400}, (_, index) =>
      `--value-${index}: var(--slds-g-link-color) \${value${index}};`
    ).join('\n');
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`${declarations}\`;
    `);
    expect(deprecated(result)).toHaveLength(400);
  });

  it('reports exact token ranges at warning severity without fixes, output, or suggestions', async () => {
    const code = "const View = () => <div style={{ color: 'var(--slds-g-link-color)' }} />;";
    const result = await lint(code);

    expect(deprecated(result)).toEqual([
      expect.objectContaining({line: 1, column: 46, endColumn: 65, severity: 1}),
    ]);
    expect(deprecated(result)[0].suggestions).toBeUndefined();
    expect(result.output).toBeUndefined();

    const fixResult = await lint(code, {fix: true});
    expect(deprecated(fixResult)).toHaveLength(1);
    expect(fixResult.output).toBeUndefined();
  });

  it('keeps overlap transparent and lets enforce-sds autofix remove the SDS deprecated diagnostic', async () => {
    const code = "const View = () => <div style={{ color: 'var(--sds-c-badge-text-color)' }} />;";
    const rules = {
      [ruleId]: 'warn',
      '@salesforce-ux/slds/enforce-sds-to-slds-hooks': 'warn',
    };
    const result = await lint(code, {rules});

    expect(result.messages.map(message => message.messageId).sort()).toEqual([
      'deprecated',
      'replaceSdsWithSlds',
    ]);

    const fixed = await lint(code, {rules, fix: true});
    expect(fixed.output).toContain('var(--slds-c-badge-text-color)');
    expect(deprecated(fixed)).toHaveLength(0);
  });
});
