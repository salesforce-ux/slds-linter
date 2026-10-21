import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

const ruleId = '@salesforce-ux/slds/no-invalid-hook-property-usage';

async function lint(code, options = {}) {
  const rules = options.rules || {[ruleId]: 'warn'};
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: [{...plugin.configs.recommended[0], rules}],
    fix: options.fix || false,
  });
  const [result] = await eslint.lintText(code, {filePath: 'component.tsx'});
  return result;
}

const invalid = result => result.messages.filter(message => message.messageId === 'invalidProperty');

describe('no-invalid-hook-property-usage', () => {
  it('ports the foundation valid and invalid metadata vectors to inline styles', async () => {
    const result = await lint(`
      const View = () => <div style={{
        backgroundColor: 'var(--slds-g-color-error-container-2)',
        color: 'var(--slds-g-color-error-container-2)',
        font: 'normal var(--slds-g-font-weight-bold) var(--slds-g-font-scale-2)/var(--slds-g-font-line-height-4) sans-serif',
        fontSize: 'var(--slds-g-spacing-1)',
        boxShadow: '0 var(--slds-g-spacing-1) 0 var(--slds-g-sizing-border-1) var(--slds-g-color-border-1)',
        textShadow: 'var(--slds-g-font-scale-2)',
        gap: 'var(--slds-g-spacing-1)',
        animationDuration: 'var(--slds-g-duration-quickly)',
      }} />;
    `);

    expect(invalid(result).map(message => message.message)).toEqual([
      "The '--slds-g-color-error-container-2' styling hook isn't intended for the 'color' CSS property. Use it only with: background, background-color.",
      "The '--slds-g-spacing-1' styling hook isn't intended for the 'font-size' CSS property. Use it only with: padding, margin, top, right, bottom, left.",
      "The '--slds-g-font-scale-2' styling hook isn't intended for the 'text-shadow' CSS property. Use it only with: font-size.",
    ]);
  });

  it('uses the font, box-shadow, gap, color, density, and wildcard matching branches', async () => {
    const result = await lint(`
      const View = () => <div style={{
        font: 'var(--slds-g-font-scale-2)',
        boxShadow: 'var(--slds-g-color-border-1) var(--slds-g-sizing-border-1) var(--slds-g-spacing-1)',
        gap: 'var(--slds-g-spacing-1)',
        outlineColor: 'var(--slds-g-color-border-1)',
        borderLeftWidth: 'var(--slds-g-sizing-border-1)',
        paddingInline: 'var(--slds-g-spacing-1)',
        transitionDelay: 'var(--slds-g-duration-quickly)',
      }} />;
    `);

    expect(invalid(result)).toHaveLength(0);
  });

  it('checks all complete known lowercase names through nesting and fallbacks only', async () => {
    const result = await lint(`
      const View = () => <div style={{color:
        'calc(var(--slds-g-color-error-container-2) + var(--custom, var(--slds-g-spacing-1, var(--slds-g-color-on-error-2))))'
      }} />;
    `);

    expect(invalid(result)).toHaveLength(2);
    expect(invalid(result).map(message => message.message)).toEqual([
      expect.stringContaining("'--slds-g-color-error-container-2'"),
      expect.stringContaining("'--slds-g-spacing-1'"),
    ]);
  });

  it('ignores unknown, non-global, custom, uppercase, malformed, string, comment, and URL names', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const View = () => <div style={{color: 'var(--slds-g-custom-unknown) var(--slds-s-table-color) var(--mine) var(--SLDS-g-color-error-container-2)'}} />;
      const Panel = styled.div\`
        content: 'var(--slds-g-spacing-1)';
        background: url("var(--slds-g-spacing-1)") /* var(--slds-g-spacing-1) */;
        color: VAR(--slds-g-spacing-1) var(--slds-g-spacing-1;
      \`;
    `);

    expect(invalid(result)).toHaveLength(0);
  });

  it('shares inline direct/const/reuse discovery while respecting spreads and mutation boundaries', async () => {
    const result = await lint(`
      const value = 'var(--slds-g-spacing-1)' as const;
      const safe = {color: value!, ...external};
      const mutated = {color: 'var(--slds-g-spacing-1)'};
      mutated.color = 'red';
      const source = {color: 'var(--slds-g-spacing-1)'};
      const spread = {...source, color: 'var(--slds-g-spacing-1)'};
      const View = () => <><div style={safe} /><span style={safe} /><i style={mutated} /><b style={spread} /></>;
    `);

    expect(invalid(result)).toHaveLength(2);
  });

  it('honors styled aliases, nesting and at-rules while ignoring shadowing and malformed templates', async () => {
    const result = await lint(`
      import styledAlias, {styled as namedStyled} from 'styled-components';
      import other from 'other';
      const One = styledAlias.div\`color: var(--slds-g-spacing-1); &:hover { @media (min-width: 1px) { fill: var(--slds-g-spacing-1); } }\`;
      const Two = namedStyled('div')\`background-color: var(--slds-g-color-error-container-2);\`;
      const Three = other.div\`color: var(--slds-g-spacing-1);\`;
      const shadow = styledAlias => styledAlias.div\`color: var(--slds-g-spacing-1);\`;
      const Broken = styledAlias.div\`color: var(--slds-g-spacing-1); } } }\`;
    `);

    expect(invalid(result)).toHaveLength(2);
  });

  it('reports static names with dynamic fallbacks and skips split or interpolation-touching names', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const View = ({dynamic}) => <div style={{
        color: \`var(--slds-g-spacing-1, \${dynamic})\`,
        border: \`var(\${dynamic}--slds-g-spacing-1)\`,
        margin: \`var(--slds-g-spacing-\${dynamic}1)\`,
      }} />;
      const Panel = styled.div\`
        color: var(--slds-g-spacing-1, \${fallback});
        border: var(\${prefix}--slds-g-spacing-1);
        inset: var(--slds-g-spacing-1\${suffix});
      \`;
    `);

    expect(invalid(result)).toHaveLength(2);
  });

  it('reports exact hook ranges, metadata-order data, warning severity, and no fix or suggestions', async () => {
    const code = "const View = () => <div style={{ color: 'var(--slds-g-color-error-container-2)' }} />;";
    const start = code.indexOf('--slds-g-color-error-container-2');
    const result = await lint(code);

    expect(invalid(result)).toEqual([expect.objectContaining({
      line: 1,
      column: start + 1,
      endColumn: start + '--slds-g-color-error-container-2'.length + 1,
      severity: 1,
      message: "The '--slds-g-color-error-container-2' styling hook isn't intended for the 'color' CSS property. Use it only with: background, background-color.",
    })]);
    expect(invalid(result)[0].suggestions).toBeUndefined();
    expect(result.output).toBeUndefined();

    const fixed = await lint(code, {fix: true});
    expect(invalid(fixed)).toHaveLength(1);
    expect(fixed.output).toBeUndefined();
  });

  it('keeps overlaps transparent to other enabled rules', async () => {
    const result = await lint("const View = () => <div style={{ color: 'var(--slds-g-spacing-1)' }} />;", {
      rules: {
        [ruleId]: 'warn',
        '@salesforce-ux/slds/no-slds-var-without-fallback': 'warn',
      },
    });

    expect(result.messages.map(message => message.messageId).sort()).toEqual([
      'invalidProperty',
      'varWithoutFallback',
    ]);
  });
});
