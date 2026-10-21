import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

const ruleName = 'no-slds-namespace-for-custom-hooks';
const ruleId = `@salesforce-ux/slds/${ruleName}`;
const fallbackRule = {meta: {schema: [], messages: {}}, create: () => ({})};

async function lint(code, options = {}) {
  const testPlugin = {...plugin, rules: {...plugin.rules, [ruleName]: plugin.rules[ruleName] || fallbackRule}};
  const rules = options.rules || {[ruleId]: 'warn'};
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{
      ...plugin.configs.recommended[0],
      plugins: {'@salesforce-ux/slds': testPlugin},
      rules,
    }],
    fix: options.fix || false,
  });
  const [result] = await eslint.lintText(code, {filePath: 'component.tsx'});
  return result;
}

const namespaceMessages = result => result.messages.filter(message => message.messageId === 'customHookNamespace');
const tokens = result => namespaceMessages(result).map(message => message.message.match(/for (.*?) isn't/u)[1]);

describe('no-slds-namespace-for-custom-hooks', () => {
  it('accepts custom namespaces plus known global, component, shared, and normalized SDS hooks', async () => {
    const result = await lint(`
      const View = () => <div style={{
        '--myapp-color': 'var(--custom-color)',
        '--slds-g-color-brand-base-50': 'var(--sds-g-color-brand-base-50)',
        '--sds-c-button-color-background': 'var(--slds-c-button-color-background)',
        '--slds-s-button-shadow-focus': 'var(--sds-s-button-shadow-focus)',
        color: 'red',
      }} />;
    `);

    expect(namespaceMessages(result)).toHaveLength(0);
  });

  it('reports unknown reserved declaration keys and every complete nested var first argument', async () => {
    const result = await lint(`
      const View = () => <div style={{
        '--slds-my-key': 'calc(var(--slds-one) + var(--sds-two, var(--slds-three)))',
        '--sds-my-key': 'var(--slds-repeat) var(--slds-repeat)',
      }} />;
    `);

    expect(tokens(result)).toEqual([
      '--slds-my-key', '--slds-one', '--sds-two', '--slds-three',
      '--sds-my-key', '--slds-repeat', '--slds-repeat',
    ]);
  });

  it('uses exact lowercase reserved prefixes and excludes runtime kinetics candidates', async () => {
    const result = await lint(`
      const View = () => <div style={{
        '--SLDS-unknown': 'var(--SDS-unknown)',
        '--sldsish-unknown': 'var(--sdsish-unknown)',
        color: 'var(--slds-kx-breadcrumbs-pointer-position-x)',
        border: 'var(--slds-unknown)',
      }} />;
    `);

    expect(tokens(result)).toEqual([
      '--slds-kx-breadcrumbs-pointer-position-x',
      '--slds-unknown',
    ]);
  });

  it('shares normalized inline discovery and source-range dedupe', async () => {
    const result = await lint(`
      const color = 'var(--slds-value-ref)' as const;
      const style = ({
        ...external,
        '--slds-direct-key': color!,
        ['--sds-static-key']: \`x \${dynamic} var(--slds-static-quasi)\`,
        [\`--slds-template-key\`]: 'ok',
      } as const) satisfies React.CSSProperties;
      const View = () => <><div style={style!} /><span style={style} /></>;
    `);

    expect(tokens(result)).toEqual([
      '--slds-value-ref', '--slds-direct-key', '--sds-static-key',
      '--slds-static-quasi', '--slds-template-key',
    ]);
  });

  it('skips mutations, escaping objects, dynamic values, computed aliases, and spread sources', async () => {
    const result = await lint(`
      let mutable = {'--slds-mutable': 'var(--slds-value)'};
      const mutated = {'--slds-mutated': 'var(--slds-value)'};
      mutated.color = 'red';
      const escaped = {'--slds-escaped': 'var(--slds-value)'};
      consume(escaped);
      const source = {'--slds-source': 'var(--slds-value)'};
      const key = '--slds-computed';
      const style = {...source, [key]: 'red', color: getColor()};
      const View = () => <><div style={mutable} /><div style={mutated} />
        <div style={escaped} /><div style={style} /></>;
    `);

    expect(namespaceMessages(result)).toHaveLength(0);
  });

  it('checks explicit spread siblings and a complete static inline var before a hole', async () => {
    const result = await lint(`
      const source = {'--slds-source': 'var(--slds-source-value)'};
      const style = {...source, '--slds-explicit': \`var(--slds-before-hole)\${dynamic}\`};
      const View = () => <div style={style} />;
    `);

    expect(tokens(result)).toEqual(['--slds-explicit', '--slds-before-hole']);
  });

  it('reports static inline property and var names while suppressing dynamic property and value ranges', async () => {
    const result = await lint(`
      const View = ({fallback, key, name}) => <div style={{
        '--slds-static-property': \`var(--slds-static-name, \${fallback})\`,
        [\`--slds-\${key}\`]: \`var(--slds-\${name})\`,
      }} />;
    `);
    expect(tokens(result)).toEqual(['--slds-static-property', '--slds-static-name']);
  });

  it('ignores strings, comments, URLs, malformed calls, uppercase calls, and ordinary text', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        content: 'var(--slds-string)';
        background: url("var(--slds-url)") /* var(--slds-comment) */;
        margin: VAR(--slds-upper) var(--slds-malformed;
        padding: --slds-ordinary-text;
      \`;
    `);

    expect(namespaceMessages(result)).toHaveLength(0);
  });

  it('honors styled aliases and shadowing while reporting declaration properties and values', async () => {
    const result = await lint(`
      import styledAlias, {styled as namedStyled} from 'styled-components';
      import other from 'other';
      const One = styledAlias.div\`--slds-property: red; color: var(--sds-value);\`;
      const Two = namedStyled('div')\`padding: var(--slds-named);\`;
      const Three = other.div\`margin: var(--slds-other);\`;
      const shadow = styledAlias => styledAlias.div\`inset: var(--slds-shadow);\`;
    `);

    expect(tokens(result)).toEqual(['--slds-property', '--sds-value', '--slds-named']);
  });

  it('guards both styled property and value ranges against interpolations', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        --slds-static: var(--slds-static-value, \${fallback});
        \${prefix}--slds-after-hole: red;
        --slds-split-\${suffix}: red;
        color: \${prefix}var(--slds-after);
        border: var(--slds-split-\${suffix});
      \`;
    `);

    expect(tokens(result)).toEqual(['--slds-static', '--slds-static-value']);
  });

  it('reports exact token ranges, data, and shared wording without fixes or suggestions', async () => {
    const code = "const View = () => <div style={{ '--sds-custom-key': 'var(--slds-custom-value)' }} />;";
    const result = await lint(code);

    expect(namespaceMessages(result)).toEqual([
      expect.objectContaining({
        line: 1, column: 35, endColumn: 51, severity: 1,
        messageId: 'customHookNamespace',
        message: "Using the --slds namespace for --sds-custom-key isn't supported. Create the custom styling hook in your namespace. Example: --myapp-custom-key",
      }),
      expect.objectContaining({line: 1, column: 59, endColumn: 78, severity: 1}),
    ]);
    expect(namespaceMessages(result).every(message => message.suggestions === undefined)).toBe(true);
    expect(result.output).toBeUndefined();

    const fixed = await lint(code, {fix: true});
    expect(namespaceMessages(fixed)).toHaveLength(2);
    expect(fixed.output).toBeUndefined();
  });

  it('preserves transparent overlaps and converges after enforce-sds fixes a known equivalent', async () => {
    const unknownDeprecated = '--slds-g-link-color';
    const rules = {
      [ruleId]: 'warn',
      '@salesforce-ux/slds/no-unsupported-hooks-slds2': 'warn',
      '@salesforce-ux/slds/enforce-sds-to-slds-hooks': 'warn',
    };
    const code = `const View = () => <div style={{color: 'var(${unknownDeprecated})', border: 'var(--sds-c-badge-text-color)'}} />;`;
    const result = await lint(code, {rules});

    expect(result.messages.map(message => message.messageId).sort()).toEqual([
      'customHookNamespace',
      'deprecated',
      'deprecated',
      'replaceSdsWithSlds',
    ]);

    const fixed = await lint(code, {rules, fix: true});
    expect(fixed.output).toContain('var(--slds-c-badge-text-color)');
    expect(namespaceMessages(fixed)).toEqual([
      expect.objectContaining({message: expect.stringContaining(unknownDeprecated)}),
    ]);
  });
});
