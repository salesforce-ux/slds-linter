import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

async function lint(code, filePath = 'component.tsx') {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: plugin.configs.recommended,
    fix: false,
  });
  const [result] = await eslint.lintText(code, {filePath});
  return result;
}

describe('JSX class extraction', () => {
  it.each(['component.jsx', 'component.tsx'])(
    'reports BEM classes in direct literals for %s',
    async filePath => {
      const result = await lint(
        '<div className="slds-container--medium valid-class" />',
        filePath,
      );

      expect(result.messages).toEqual(expect.arrayContaining([
        expect.objectContaining({
          ruleId: '@salesforce-ux/slds/enforce-bem-usage',
          messageId: 'bemDoubleDash',
          line: 1,
          column: 17,
          endColumn: 39,
        }),
      ]));
    },
  );

  it('reports and fixes BEM classes in styled-components selectors', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: plugin.configs.recommended,
      fix: true,
    });
    const [result] = await eslint.lintText(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        &.slds-container--medium,
        .slds-p-around--medium & {}
      \`;
    `, {filePath: 'component.tsx'});

    expect(result.messages).toEqual([
      expect.objectContaining({messageId: 'sldsClassOverride', severity: 1}),
      expect.objectContaining({messageId: 'sldsClassOverride', severity: 1}),
    ]);
    expect(result.messages.some(message => message.messageId === 'bemDoubleDash')).toBe(false);
    expect(result.output).toContain('&.slds-container_medium,');
    expect(result.output).toContain('.slds-p-around_medium &');
  });

  it('ignores inline style declarations for class-based rules', async () => {
    const result = await lint(
      "const View = () => <div style={{ color: '#0176d3' }} />;",
    );

    expect(result.messages.filter(message =>
      message.messageId === 'bemDoubleDash' || message.messageId === 'deprecatedClass' ||
      message.messageId === 'sldsClassOverride'
    )).toHaveLength(0);
  });

  describe('no-slds-class-overrides', () => {
    it('reports only the last direct SLDS class in each styled selector', async () => {
      const result = await lint(`
        import styled from 'styled-components';
        const Panel = styled.div\`
          .slds-button { color: red; }
          .custom .slds-input:hover { color: blue; }
          .slds-card button { display: block; }
          .slds-button.modified { padding: 0; }
          .modified.slds-button { margin: 0; }
          .custom:not(.slds-button) { border: 0; }
        \`;
      `);

      expect(result.messages.filter(message => message.messageId === 'sldsClassOverride')).toEqual([
        expect.objectContaining({line: 4, column: 12, endColumn: 23}),
        expect.objectContaining({line: 5, column: 20, endColumn: 30}),
        expect.objectContaining({line: 6, column: 12, endColumn: 21}),
        expect.objectContaining({line: 8, column: 21, endColumn: 32}),
      ]);
    });

    it('checks selector-list members independently and ignores unknown SLDS classes', async () => {
      const result = await lint(`
        import styled from 'styled-components';
        const Panel = styled.div\`
          .slds-button, .custom, .wrapper .slds-input {}
          .slds-custom-class { color: blue; }
        \`;
      `);

      expect(result.messages.filter(message => message.messageId === 'sldsClassOverride')).toEqual([
        expect.objectContaining({line: 4, column: 12}),
        expect.objectContaining({line: 4, column: 44}),
      ]);
    });

    it('does not inspect className or inline style usage', async () => {
      const result = await lint(`
        const View = () => (
          <div className="slds-button" style={{ color: 'red' }} />
        );
      `);

      expect(result.messages.filter(message => message.messageId === 'sldsClassOverride')).toHaveLength(0);
    });

    it('does not offer a fix for styled SLDS overrides', async () => {
      const eslint = new ESLint({
        overrideConfigFile: true,
        overrideConfig: plugin.configs.recommended,
        fix: true,
      });
      const code = `
        import styled from 'styled-components';
        const Panel = styled.div\`.slds-button { color: red; }\`;
      `;
      const [result] = await eslint.lintText(code, {filePath: 'component.tsx'});

      expect(result.output).toBeUndefined();
      expect(result.messages.filter(message => message.messageId === 'sldsClassOverride')).toEqual([
        expect.objectContaining({messageId: 'sldsClassOverride', severity: 1}),
      ]);
    });

    it('resolves styled imports regardless of declaration order', async () => {
      const result = await lint(`
        const Panel = styled.div\`.slds-button { color: red; }\`;
        import styled from 'styled-components';
      `);

      expect(result.messages.filter(message => message.messageId === 'sldsClassOverride')).toHaveLength(1);
    });

    it('skips a static class when a later interpolation makes the final class uncertain', async () => {
      const result = await lint(`
        import styled from 'styled-components';
        const Panel = styled.div\`.slds-button \${Child} { color: red; }\`;
      `);

      expect(result.messages.filter(message => message.messageId === 'sldsClassOverride')).toHaveLength(0);
    });
  });

  it('reports deprecated classes in expression literals', async () => {
    const result = await lint(
      "const View = () => <div className={'slds-action-overflow--touch'} />;",
    );

    expect(result.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({
        ruleId: '@salesforce-ux/slds/no-deprecated-classes-slds2',
        messageId: 'deprecatedClass',
      }),
    ]));
  });

  it('checks static template segments and skips dynamic expressions', async () => {
    const result = await lint(
      'const View = ({dynamic}) => <div className={`slds-container--medium ${dynamic} slds-action-overflow--touch`} />;',
    );

    expect(result.messages.map(message => message.ruleId)).toEqual(expect.arrayContaining([
      '@salesforce-ux/slds/enforce-bem-usage',
      '@salesforce-ux/slds/no-deprecated-classes-slds2',
    ]));
  });

  it('supports class on custom JSX components', async () => {
    const result = await lint('<Box class="slds-container--medium" />', 'component.jsx');

    expect(result.messages).toEqual(expect.arrayContaining([
      expect.objectContaining({ruleId: '@salesforce-ux/slds/enforce-bem-usage'}),
    ]));
  });

  it('fixes only the deprecated BEM token', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: plugin.configs.recommended,
      fix: true,
    });
    const [result] = await eslint.lintText(
      '<div className="valid-class slds-container--medium" />',
      {filePath: 'component.tsx'},
    );

    expect(result.output).toBe(
      '<div className="valid-class slds-container_medium" />',
    );
  });

  it.each([
    [
      'a leading static template segment',
      'const View = ({dynamic}) => <div className={`slds-container--medium ${dynamic}`} />;',
      'const View = ({dynamic}) => <div className={`slds-container_medium ${dynamic}`} />;',
    ],
    [
      'a trailing static template segment',
      'const View = ({dynamic}) => <div className={`${dynamic} slds-container--medium`} />;',
      'const View = ({dynamic}) => <div className={`${dynamic} slds-container_medium`} />;',
    ],
    [
      'a middle static template segment',
      'const View = ({before, after}) => <div className={`${before} slds-container--medium ${after}`} />;',
      'const View = ({before, after}) => <div className={`${before} slds-container_medium ${after}`} />;',
    ],
    [
      'an expression-free template',
      'const View = () => <div className={`slds-container--medium`} />;',
      'const View = () => <div className={`slds-container_medium`} />;',
    ],
  ])('safely fixes %s', async (_name, code, output) => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: plugin.configs.recommended,
      fix: true,
    });
    const [result] = await eslint.lintText(code, {filePath: 'component.tsx'});

    expect(result.output).toBe(output);
    expect(result.messages).toHaveLength(0);
  });

  it.each([
    'const View = ({prefix}) => <div className={`${prefix}slds-container--medium`} />;',
    'const View = ({suffix}) => <div className={`slds-container--medium${suffix}`} />;',
    'const View = () => <div className={"slds-container\\x2d\\x2dmedium"} />;',
    'const View = () => <div className="slds-container&#45;&#45;medium" />;',
  ])('skips values without safe source-token boundaries: %s', async code => {
    const result = await lint(code);

    expect(result.messages).toHaveLength(0);
  });

  it('ignores unrelated and dynamic className values', async () => {
    const result = await lint(
      'const View = ({classes}) => <div title="slds-container--medium" className={classes} />;',
    );

    expect(result.messages).toHaveLength(0);
  });

  it('reports deprecated classes in static styled-components selectors', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        &.slds-action-overflow--touch,
        .slds-action-overflow--touch & {
          color: red;
        }
      \`;
    `);

    expect(result.messages.filter(message => message.messageId === 'deprecatedClass')).toEqual([
      expect.objectContaining({
        ruleId: '@salesforce-ux/slds/no-deprecated-classes-slds2',
        messageId: 'deprecatedClass',
        line: 4,
        column: 11,
      }),
      expect.objectContaining({
        ruleId: '@salesforce-ux/slds/no-deprecated-classes-slds2',
        messageId: 'deprecatedClass',
        line: 5,
        column: 10,
      }),
    ]);
  });

  it('checks complete static selector tokens around styled interpolations', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        .slds-action-overflow--touch \${({active}) => active && '.active'} & {}
        .prefix\${({suffix}) => suffix} .slds-action-overflow--touch & {}
      \`;
    `);

    expect(result.messages).toHaveLength(2);
    expect(result.messages.every(message => message.messageId === 'deprecatedClass')).toBe(true);
  });

  it('supports aliased default and named styled imports', async () => {
    const result = await lint(`
      import componentFactory from 'styled-components';
      import { styled as namedFactory } from 'styled-components';
      const DefaultPanel = componentFactory.div\`.slds-action-overflow--touch {}\`;
      const NamedPanel = namedFactory('div')\`.slds-action-overflow--touch {}\`;
    `);

    expect(result.messages).toHaveLength(2);
    expect(result.messages.every(message => message.messageId === 'deprecatedClass')).toBe(true);
  });

  it('supports chained factories and selectors nested in at-rules', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div.withConfig({ displayName: 'Panel' }).attrs({ role: 'region' })
        \`
          @media (min-width: 40rem) {
            &:is(.slds-action-overflow--touch, .current) {}
          }
        \`;
    `);

    expect(result.messages).toEqual([
      expect.objectContaining({
        messageId: 'deprecatedClass',
        line: 6,
        column: 19,
      }),
    ]);
  });

  it('does not report class-like text in comments, strings, or attributes', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        /* .slds-action-overflow--touch {} */
        &::before { content: '.slds-action-overflow--touch {}'; }
        &[data-selector='.slds-action-overflow--touch'] {}
      \`;
    `);

    expect(result.messages).toHaveLength(0);
  });

  it('does not report class names that touch an interpolation', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Before = styled.div\`.slds-action-overflow--touch\${({ suffix }) => suffix} {}\`;
      const After = styled.div\`\${({ prefix }) => prefix}.slds-action-overflow--touch {}\`;
    `);

    expect(result.messages).toHaveLength(0);
  });

  it('does not report interpolation-adjacent classes with internal whitespace', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Before = styled.div\`.slds-action-overflow--touch\${suffix } {}\`;
      const After = styled.div\`\${ prefix}.slds-action-overflow--touch {}\`;
    `);

    expect(result.messages).toHaveLength(0);
  });

  it('reports exact ranges and tolerates malformed selectors', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Panel = styled.div\`
        .current, .slds-action-overflow--touch {}
        .malformed:) {}
      \`;
    `);

    expect(result.messages).toEqual([
      expect.objectContaining({
        messageId: 'deprecatedClass',
        line: 4,
        column: 20,
        endColumn: 47,
      }),
    ]);
  });

  it('respects lexical shadowing of styled imports', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const Real = styled.div\`.slds-action-overflow--touch {}\`;
      function create(styled) {
        return styled.div\`.slds-action-overflow--touch {}\`;
      }
    `);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]).toEqual(expect.objectContaining({ line: 3 }));
  });

  it('ignores deprecated classes in non-styled tagged templates', async () => {
    const result = await lint(
      'const value = css`.slds-action-overflow--touch { color: red; }`;',
    );

    expect(result.messages).toHaveLength(0);
  });
});
