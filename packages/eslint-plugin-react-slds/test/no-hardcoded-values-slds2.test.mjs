import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

const ruleId = '@salesforce-ux/slds/no-hardcoded-values-slds2';

async function lint(code, {fix = false, options, settings} = {}) {
  const overrides = {
    ...(options ? {rules: {[ruleId]: ['warn', options]}} : {}),
    ...(settings ? {settings} : {}),
  };
  const config = Object.keys(overrides).length
    ? [...plugin.configs.recommended, overrides]
    : plugin.configs.recommended;
  const eslint = new ESLint({overrideConfigFile: true, overrideConfig: config, fix});
  const [result] = await eslint.lintText(code, {filePath: 'component.tsx'});
  return result;
}

const findings = result => result.messages.filter(message =>
  message.messageId === 'hardcodedValue' || message.messageId === 'noReplacement'
);

describe('no-hardcoded-values-slds2', () => {
  it('validates malformed context settings at the ESLint rule boundary', async () => {
    const result = await lint(`const View = () => <div style={{color: '#001639'}} />;`, {
      settings: {
        contextIndex: {},
        classifyIssue: 'invalid',
        serializeIssueContext: 'invalid',
        deterministicOnly: 'invalid',
      },
    });

    expect(findings(result)).toEqual([
      expect.objectContaining({messageId: 'hardcodedValue'}),
    ]);
  });

  it('reports exact inline ranges and foundation messages for normalized static keys', async () => {
    const code = `const View = () => <div style={{backgroundColor: '#001639', ['borderColor']: '#001639', [\`outlineColor\`]: '#001639', WebkitBackgroundColor: '#001639', '--custom': '#001639'}} />;`;
    const result = await lint(code);
    const expectedStarts = [
      code.indexOf("'#001639'") + 1,
      code.indexOf("'#001639'", code.indexOf("'#001639'") + 1) + 1,
      code.indexOf("'#001639'", code.indexOf("'#001639'", code.indexOf("'#001639'") + 1) + 1) + 1,
    ];

    expect(findings(result)).toHaveLength(3);
    expect(findings(result).map(message => [message.column, message.endColumn])).toEqual(
      expectedStarts.map(start => [start + 1, start + 8]),
    );
    expect(findings(result).every(message =>
      message.messageId === 'hardcodedValue' &&
      message.message.includes('Consider replacing the #001639 static value') &&
      message.suggestions === undefined
    )).toBe(true);
  });

  it('shares safe const resolution, dedupe, mutation, spread, and numeric exclusion boundaries', async () => {
    const result = await lint(`
      const color = '#001639';
      const shared = {color, padding: 4, ...uninspected};
      const mutated = {color: '#001639'};
      mutated.color = 'red';
      const spreadContent = {color: '#001639'};
      const spreadOnly = {...spreadContent};
      const View = () => <><div style={shared} /><span style={shared} />
        <i style={mutated} /><b style={spreadOnly} /></>;
    `);

    expect(findings(result)).toEqual([
      expect.objectContaining({line: 2, column: 22, endColumn: 29, severity: 1}),
    ]);
  });

  it('analyzes a shared resolved scalar once per declaration property', async () => {
    const result = await lint(`const v = '13px'; const View = () => <div style={{padding: v, width: v}} />;`, {
      options: {
        deterministicOnly: true,
        customMapping: {
          '--padding': {properties: ['padding'], values: ['13px']},
          '--width': {properties: ['width'], values: ['13px']},
        },
      },
    });

    expect(findings(result)).toHaveLength(2);
    expect(findings(result).map(message => message.message)).toEqual([
      expect.stringContaining('--padding'),
      expect.stringContaining('--width'),
    ]);
  });

  it('reports but does not fix an indirect const used outside CSS', async () => {
    const code = `const v = '13px'; const View = () => <div title={v} style={{padding: v}} />;`;
    const options = {
      deterministicOnly: true,
      customMapping: {'--padding': {properties: ['padding'], values: ['13px']}},
    };
    const result = await lint(code, {options});

    expect(findings(result)).toHaveLength(1);
    expect(findings(result)[0]).toEqual(expect.objectContaining({messageId: 'hardcodedValue'}));
    expect(findings(result)[0].fix).toBeUndefined();
    expect((await lint(code, {fix: true, options})).output).toBeUndefined();
  });

  it('does not analyze style objects that escape through mutable aliases or assignments', async () => {
    const result = await lint(`
      const mutableStyles = {padding: '13px'};
      let alias = mutableStyles;
      alias.padding = '20px';
      const assignedStyles = {padding: '13px'};
      holder.styles = assignedStyles;
      const View = () => <><div style={mutableStyles} /><div style={assignedStyles} /></>;
    `, {
      options: {
        deterministicOnly: true,
        customMapping: {'--padding': {properties: ['padding'], values: ['13px']}},
      },
    });

    expect(findings(result)).toHaveLength(0);
  });

  it('reports but does not fix a style object whose member is read externally', async () => {
    const code = `const styles = {padding: '13px', color: '#001639'}; use(styles.color); const View = () => <div style={styles} />;`;
    const options = {
      deterministicOnly: true,
      customMapping: {'--padding': {properties: ['padding'], values: ['13px']}},
    };
    const result = await lint(code, {options});

    expect(findings(result)).toHaveLength(2);
    expect(findings(result).every(message => message.fix === undefined)).toBe(true);
    expect((await lint(code, {fix: true, options})).output).toBeUndefined();
  });

  it('reports safe static fragments but never fixes partial inline values or hole-touching tokens', async () => {
    const code = `const View = ({tone}) => <div style={{color: \`#001639 \${tone}#001639 #001639\`}} />;`;
    const result = await lint(code);

    expect(findings(result)).toHaveLength(2);
    expect(findings(result).map(message => code.slice(...message.fix?.range || [0, 0]))).toEqual(['', '']);
    expect(findings(result).every(message => message.fix === undefined)).toBe(true);
  });

  it('supports custom options through ESLint and full-value single-candidate fixes', async () => {
    const code = `const View = () => <div style={{padding: '13px'}} />;`;
    const options = {
      reportNumericValue: 'always',
      deterministicOnly: true,
      customMapping: {'--custom-space': {properties: ['padding'], values: ['13px']}},
    };
    const result = await lint(code, {options});
    const [message] = findings(result);

    expect(message).toEqual(expect.objectContaining({
      messageId: 'hardcodedValue',
      severity: 1,
      fix: expect.objectContaining({text: 'var(--custom-space, 13px)'}),
    }));
    expect(message.suggestions).toBeUndefined();

    const fixed = await lint(code, {fix: true, options});
    expect(fixed.output).toBe(`const View = () => <div style={{padding: 'var(--custom-space, 13px)'}} />;`);
  });

  it('keeps per-diagnostic fix payload proportional to candidate tokens', async () => {
    const gap = ' '.repeat(20_000);
    const code = `const View = () => <div style={{padding: '0.25rem${gap}0.5rem'}} />;`;
    const result = await lint(code);
    const messages = findings(result);

    expect(messages).toHaveLength(2);
    expect(messages.map(message => code.slice(...message.fix.range))).toEqual(['0.25rem', '0.5rem']);
    expect(messages.reduce((sum, message) => sum + message.fix.text.length, 0)).toBeLessThan(200);
  });

  it('preserves overlapping foundation reports and reverse multipass ordering', async () => {
    const result = await lint(`const View = () => <div style={{outline: '1px solid #001639', padding: '0.25rem 0.5rem'}} />;`);

    expect(findings(result).map(message => message.messageId)).toEqual([
      'hardcodedValue',
      'hardcodedValue',
      'hardcodedValue',
      'hardcodedValue',
    ]);
    expect(findings(result).map(message => message.message.match(/the ([^ ]+) static/u)?.[1])).toEqual([
      '1px', '#001639', '0.25rem', '0.5rem',
    ]);
  });

  it('handles styled aliases, nesting, shadowing, interpolations, and hole-free shadows', async () => {
    const result = await lint(`
      import componentFactory from 'styled-components';
      const Panel = componentFactory.div\`
        color: #001639;
        &:hover { padding: 0.25rem; }
        border-color: #001639 \${tone} #001639;
        box-shadow: 0 2px \${blur} rgba(0,0,0,0.1);
      \`;
      function local(componentFactory) {
        return componentFactory.div\`color: #001639;\`;
      }
    `);

    expect(findings(result)).toEqual([
      expect.objectContaining({line: 4, column: 16, endColumn: 23}),
      expect.objectContaining({line: 5, column: 28, endColumn: 35}),
      expect.objectContaining({line: 6, column: 23, endColumn: 30}),
      expect.objectContaining({line: 6, column: 39, endColumn: 46}),
    ]);
    expect(findings(result).every(message => message.fix === undefined || message.line < 6)).toBe(true);
  });

  it('fixes a static styled declaration when interpolation is elsewhere in the template', async () => {
    const code = `import styled from 'styled-components';\nconst Panel = styled.div\`\n  color: #001639;\n  padding: \${space};\n\`;`;
    const options = {
      deterministicOnly: true,
      customMapping: {'--panel-color': {properties: ['color'], values: ['#001639']}},
    };
    const result = await lint(code, {options});

    expect(findings(result)).toEqual([
      expect.objectContaining({fix: expect.objectContaining({text: 'var(--panel-color, #001639)'})}),
    ]);
    expect((await lint(code, {fix: true, options})).output).toContain('color: var(--panel-color, #001639);');
  });

  it('fixes a static box-shadow declaration when an interpolation is elsewhere in the template', async () => {
    const code = `import styled from 'styled-components';\nconst Panel = styled.div\`\n  box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n  color: \${tone};\n\`;`;
    const options = {
      deterministicOnly: true,
      customMapping: {
        '--panel-shadow': {properties: ['box-shadow'], values: ['0 2px 4px rgba(0,0,0,0.1)']},
      },
    };
    const result = await lint(code, {options});

    expect(findings(result)).toEqual([
      expect.objectContaining({fix: expect.objectContaining({text: 'var(--panel-shadow, 0 2px 4px rgba(0,0,0,0.1))'})}),
    ]);
    expect((await lint(code, {fix: true, options})).output)
      .toContain('box-shadow: var(--panel-shadow, 0 2px 4px rgba(0,0,0,0.1));');
  });
});
