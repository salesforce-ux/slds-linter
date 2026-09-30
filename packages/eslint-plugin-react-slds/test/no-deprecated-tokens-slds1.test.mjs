import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

const ruleId = '@salesforce-ux/slds/no-deprecated-tokens-slds1';

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

describe('no-deprecated-tokens-slds1', () => {
  it('does not inspect className values', async () => {
    const result = await lint('<div className="token(account)" />');

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toHaveLength(0);
  });

  it.each([
    'x) token(account)',
    'token(account) var(',
    '((var(--lwc-brandDark)',
    'var(--lwc-brandDark) /*',
  ])('fails closed for malformed CSS values: %s', async value => {
    const result = await lint(`const View = () => <div style={{color: '${value}'}} />;`, true);

    expect(result.messages).toHaveLength(0);
    expect(result.output).toBeUndefined();
  });

  it('reports and fixes deprecated tokens in static inline styles', async () => {
    const result = await lint(
      "const View = () => <div style={{ color: 'token(account)', borderColor: `t(brandPrimary)` }} />;",
      true,
    );

    expect(result.messages).toHaveLength(0);
    expect(result.output).toBe(
      "const View = () => <div style={{ color: 'var(--lwc-account)', borderColor: `var(--slds-g-color-accent-1, var(--lwc-brandPrimary))` }} />;",
    );
  });

  it('shares inline discovery across const objects, direct const values, wrappers, spreads, and reused sources', async () => {
    const result = await lint(`
      const color = 'token(account)' as const;
      const styles = ({
        ...uninspected,
        color: color!,
        borderColor: 't(brandPrimary)',
      } as const) satisfies React.CSSProperties;
      const View = () => <><div style={styles!} /><span style={styles} /></>;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toEqual([
      expect.objectContaining({line: 2, column: 22, endColumn: 36, severity: 2}),
      expect.objectContaining({line: 6, column: 23, endColumn: 38, severity: 2}),
    ]);
  });

  it('inspects complete static fragments of interpolated inline templates without inspecting expressions', async () => {
    const result = await lint(`
      const expression = 'token(accountInfo)';
      const View = () => <div style={{ color: \`token(account) \${expression} t(brandPrimary)\` }} />;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toEqual([
      expect.objectContaining({line: 3, column: 48, endColumn: 62}),
      expect.objectContaining({line: 3, column: 77, endColumn: 92}),
    ]);
  });

  it('skips calls starting after or split across holes while retaining complete preceding calls', async () => {
    const result = await lint(`
      const View = ({left, middle, right}) => <div style={{ color:
        \`\${left}token(account)  token(account) \${middle} token(account)  token(account)\${right}\`
      }} />;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toEqual([
      expect.objectContaining({line: 3, column: 33, endColumn: 47}),
      expect.objectContaining({line: 3, column: 58, endColumn: 72}),
      expect.objectContaining({line: 3, column: 74, endColumn: 88}),
    ]);
  });

  it('skips inline token calls containing holes and fixes a completed call before a hole exactly', async () => {
    const code = `const View = ({name, suffix}) => <div style={{color: \`token(\${name})\`, border: \`token(account)\${suffix}\`}} />;`;
    const result = await lint(code);
    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toHaveLength(1);

    const fixed = await lint(code, true);
    expect(fixed.output).toContain('token(\${name})');
    expect(fixed.output).toContain('var(--lwc-account)\${suffix}');
  });

  it('skips mutable, imported, parameter, call, conditional, alias-chain, and spread-content sources', async () => {
    const result = await lint(`
      import { importedStyles } from './styles';
      let mutable = { color: 'token(account)' };
      const spreadContent = { color: 'token(account)' };
      const spreadOnly = { ...spreadContent };
      const called = getStyles();
      const conditional = ready ? { color: 'token(account)' } : spreadContent;
      const first = 'token(account)';
      const second = first;
      function View({ parameterStyles }) {
        return <><div style={mutable} /><div style={importedStyles} /><div style={parameterStyles} />
          <div style={spreadOnly} /><div style={called} /><div style={conditional} />
          <div style={{ color: second }} /></>;
      }
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toHaveLength(0);
  });

  it('skips const style objects after direct member and Object.assign mutations', async () => {
    const result = await lint(`
      const directlyMutated = { color: 'token(account)' };
      directlyMutated.color = 'red';
      const assigned = { color: 'token(account)' };
      Object.assign(assigned, { color: 'red' });
      const View = () => <><div style={directlyMutated} /><div style={assigned} /></>;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toHaveLength(0);
  });

  it('skips deleted, defineProperty-mutated, and directly aliased then mutated style objects', async () => {
    const result = await lint(`
      const deleted = { color: 'token(account)' };
      delete deleted.color;
      const defined = { color: 'token(account)' };
      Object.defineProperty(defined, 'color', {value: 'red'});
      const definedMany = { color: 'token(account)' };
      Object.defineProperties(definedMany, {color: {value: 'red'}});
      const aliased = { color: 'token(account)' };
      const alias = aliased;
      alias.color = 'red';
      const View = () => <><div style={deleted} /><div style={defined} />
        <div style={definedMany} /><div style={aliased} /></>;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toHaveLength(0);
  });

  it('treats CSS comments as whitespace around token and t first arguments', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const View = () => <div style={{ color: 'token(/* before */ account /* after */)' }} />;
      const Panel = styled.div\`color: t(/* before */ brandPrimary /* after */);\`;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toHaveLength(2);
  });

  it('reports and fixes multiple and nested calls in styled-components', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        color: token(account);
        width: calc(100% - t(brandPrimary));
      \`;
    `, true);

    expect(result.messages).toHaveLength(0);
    expect(result.output).toContain('color: var(--lwc-account);');
    expect(result.output).toContain(
      'width: calc(100% - var(--slds-g-color-accent-1, var(--lwc-brandPrimary)));',
    );
  });

  it('finds styled token calls through declaration values nested in at-rules', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        @media (min-width: 48rem) {
          color: token(account);
          border-color: \${prefix}token(accountInfo);
        }
      \`;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toEqual([
      expect.objectContaining({line: 5, column: 18, endColumn: 32, severity: 2}),
    ]);
  });

  it('reports exact locations without applying fixes during normal linting', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`color: token(account);\`;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toEqual([
      expect.objectContaining({line: 3, column: 39, endColumn: 53, severity: 2}),
    ]);
  });

  it('ignores unknown tokens, dynamic inline styles, CSS strings, and dynamic token names', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const View = ({color}) => <div style={{ color, borderColor: 'token(unknownToken)' }} />;
      const Panel = styled.div\`
        content: 'token(account)';
        color: token(unknownToken);
        border-color: token(\${tokenName});
      \`;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toHaveLength(0);
  });

  it('handles styled aliases, lexical shadowing, and imports after use', async () => {
    const result = await lint(`
      const Real = componentFactory.div\`color: token(account);\`;
      import componentFactory from 'styled-components';
      function create(componentFactory) {
        return componentFactory.div\`color: token(accountInfo);\`;
      }
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toHaveLength(1);
  });

  it('preserves token fallbacks inside SLDS var functions', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const View = () => <div style={{ color: 'var(--slds-c-button-brand-color-background, token(brandPrimary))' }} />;
      const Panel = styled.div\`
        color: var(--slds-c-button-brand-color-background, token(brandPrimary));
        background: var( /* keep */ --slds-c-button-color-background, token(account));
      \`;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toHaveLength(0);
  });

  it('does not let strings or comments suppress unrelated token calls', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        background: url("var(--slds-x,(") token(account);
        color: /* var(--slds-x,( */ token(accountInfo);
      \`;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toHaveLength(2);
  });

  it('skips token calls immediately adjacent to styled interpolations', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`color: \${prefix}token(account);\`;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedToken')).toHaveLength(0);
  });

  it('fixes a complete static styled token call next to a trailing interpolation', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`color: token(account)\${suffix};\`;
    `, true);

    expect(result.messages).toHaveLength(0);
    expect(result.output).toContain('color: var(--lwc-account)\${suffix};');
  });
});
