import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

const ruleId = '@salesforce-ux/slds/no-slds-private-var';

async function lint(code, fix = false) {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: plugin.configs.recommended,
    fix,
  });
  const [result] = await eslint.lintText(code, {filePath: 'component.tsx'});
  return result;
}

const messages = result => result.messages.filter(message => message.ruleId === ruleId);

function reportedText(code, message) {
  const lines = code.split('\n');
  if (message.line === message.endLine) {
    return lines[message.line - 1].slice(message.column - 1, message.endColumn - 1);
  }
  throw new Error('Expected a single-line report');
}

describe('no-slds-private-var', () => {
  it('reports only exact case-sensitive --_slds- declaration property prefixes', async () => {
    const result = await lint(`const View = () => <div
      className="--_slds-class"
      style={{
        '--_slds-private': 'red',
        '--slds-s-private': 'var(--_slds-value)',
        '--_SLDS-private': 'red',
        color: 'var(--_slds-value)',
      }}
    />;`);

    expect(messages(result)).toEqual([
      expect.objectContaining({
        messageId: 'privateVar',
        severity: 1,
        message: expect.stringContaining('--_slds-private'),
      }),
    ]);
  });

  it('checks direct, static computed, and safe const inline properties once', async () => {
    const result = await lint(`const style = {'--_slds-shared': 'red'} as const;
      const View = () => <>
        <div style={{'--_slds-direct': 'red', [\`--_slds-computed\`]: 'blue'}} />
        <span style={style!} /><i style={style} />
      </>;`);

    expect(messages(result).map(message => message.message.match(/--_slds-[\w-]+/u)?.[0])).toEqual([
      '--_slds-shared',
      '--_slds-direct',
      '--_slds-computed',
    ]);
  });

  it('reports exact property ranges and fixes only the private prefix to convergence', async () => {
    const code = "const View = () => <div style={{'--_slds-color': 'var(--_slds-value)'}} />;";
    const result = await lint(code);

    expect(messages(result)).toHaveLength(1);
    expect(reportedText(code, messages(result)[0])).toBe('--_slds-color');
    expect(messages(result)[0]).toEqual(expect.objectContaining({messageId: 'privateVar'}));
    expect(messages(result)[0].fix).toBeDefined();

    const fixed = await lint(code, true);
    expect(fixed.output).toBe("const View = () => <div style={{'--slds-color': 'var(--_slds-value)'}} />;");
    expect(messages(fixed)).toHaveLength(0);
    expect(messages(await lint(fixed.output))).toHaveLength(0);
  });

  it('skips unsafe, mutable, spread-only, and dynamic inline properties', async () => {
    const result = await lint(`const unsafe = {'--_slds-unsafe': 'red'};
      consume(unsafe);
      let mutable = {'--_slds-mutable': 'red'};
      const spread = {...{'--_slds-spread': 'red'}};
      const View = ({key}) => <><div style={unsafe} /><div style={mutable} />
        <div style={spread} /><div style={{[\`--_slds-\${key}\`]: 'red'}} /></>;
    `);

    expect(messages(result)).toHaveLength(0);
  });

  it('checks static styled declaration properties through aliases, nesting, and at-rules', async () => {
    const result = await lint(`import styledAlias, {styled as namedStyled} from 'styled-components';
      import other from 'other';
      const One = styledAlias.div\`
        --_slds-root: red;
        &:hover { --_slds-nested: blue; }
        @media (min-width: 1px) { --_slds-media: green; }
      \`;
      const Two = namedStyled('div')\`--_slds-named: red;\`;
      const Three = other.div\`--_slds-other: red;\`;
      const shadow = styledAlias => styledAlias.div\`--_slds-shadow: red;\`;
    `);

    expect(messages(result).map(message => message.message.match(/--_slds-[\w-]+/u)?.[0])).toEqual([
      '--_slds-root',
      '--_slds-nested',
      '--_slds-media',
      '--_slds-named',
    ]);
  });

  it('skips dynamic or interpolation-touching styled properties and never visits values', async () => {
    const result = await lint(`import styled from 'styled-components';
      const Panel = styled.div\`
        color: var(--_slds-value-only);
        --slds-s-private: red;
        --_SLDS-case: red;
        \${prefix}--_slds-after-hole: red;
        --_slds-split-\${suffix}: red;
      \`;
    `);

    expect(messages(result)).toHaveLength(0);
  });
});
