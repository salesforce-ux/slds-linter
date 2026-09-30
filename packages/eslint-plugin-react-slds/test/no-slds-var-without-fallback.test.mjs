import {ESLint} from 'eslint';
import plugin from '../build/index.mjs';

const ruleId = '@salesforce-ux/slds/no-slds-var-without-fallback';

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

describe('no-slds-var-without-fallback', () => {
  it('reports exact names and independently fixes representative declaration values', async () => {
    const code = `const View = () => <div style={{
      color: 'var(--slds-g-color-border-base-1)',
      boxShadow: 'var(--slds-g-spacing-4) calc(1px + var(--slds-g-spacing-4))',
      '--custom-shadow': '0 0 var(--slds-g-color-border-base-2)',
    }} />;`;
    const result = await lint(code);

    expect(messages(result)).toEqual([
      expect.objectContaining({
        messageId: 'varWithoutFallback', severity: 1, line: 2, column: 19, endColumn: 47,
        message: expect.stringContaining('var(--slds-g-color-border-base-1, #c9c9c9)'),
      }),
      expect.objectContaining({messageId: 'varWithoutFallback', line: 3, column: 23, endColumn: 41}),
      expect.objectContaining({messageId: 'varWithoutFallback', line: 3, column: 58, endColumn: 76}),
      expect.objectContaining({messageId: 'varWithoutFallback', line: 4, column: 35, endColumn: 63}),
    ]);

    const fixed = await lint(code, true);
    expect(messages(fixed)).toHaveLength(0);
    expect(fixed.output).toBe(`const View = () => <div style={{
      color: 'var(--slds-g-color-border-base-1, #c9c9c9)',
      boxShadow: 'var(--slds-g-spacing-4, 1rem) calc(1px + var(--slds-g-spacing-4, 1rem))',
      '--custom-shadow': '0 0 var(--slds-g-color-border-base-2, #aeaeae)',
    }} />;`);
    expect(messages(await lint(fixed.output))).toHaveLength(0);
  });

  it('checks nested calls independently and accepts any top-level fallback', async () => {
    const code = `const View = ({fallback}) => <div style={{
      color: 'var(--slds-g-color-border-base-1, #333)',
      background: 'var(--slds-g-color-border-base-1, var(--slds-g-color-border-base-2))',
      border: \`var(--slds-g-color-border-base-1, \${fallback})\`,
      padding: 'var(--slds-g-spacing-4, calc(1px, 2px))',
    }} />;`;
    const result = await lint(code);
    expect(messages(result)).toEqual([
      expect.objectContaining({line: 3, column: 58, endColumn: 86}),
    ]);
    const fixed = await lint(code, true);
    expect(fixed.output).toContain('var(--slds-g-color-border-base-1, var(--slds-g-color-border-base-2, #aeaeae))');
  });

  it('ignores unknown, custom, LWC, SDS, uppercase, comments, malformed calls, strings, and URLs', async () => {
    const result = await lint(`
      import styled from 'styled-components';
      const View = () => <div style={{color: 'var(--slds-not-real) var(--custom) var(--lwc-brandDark) var(--sds-g-spacing-4) var(--SLDS-g-spacing-4)'}} />;
      const Panel = styled.div\`
        content: 'var(--slds-g-spacing-4)';
        background: url("var(--slds-g-spacing-4)");
        outline: /* var(--slds-g-spacing-4) */ none;
        padding: VAR(--slds-g-spacing-4);
        margin: var(--slds-g-spacing-4;
      \`;
    `);
    expect(messages(result)).toHaveLength(0);
  });

  it('accepts CSS comments as whitespace and does not inspect property keys', async () => {
    const code = `const View = () => <div style={{
      '--slds-g-spacing-4': 'var(/*a*/ --slds-g-spacing-4 /*b*/)',
    }} />;`;
    const result = await lint(code);
    expect(messages(result)).toEqual([
      expect.objectContaining({line: 2, column: 40, endColumn: 58}),
    ]);
    const fixed = await lint(code, true);
    expect(fixed.output).toContain("'--slds-g-spacing-4': 'var(--slds-g-spacing-4, 1rem)'");
  });

  it('shares normalized inline discovery, dedupes reused objects, and inspects explicit spread siblings', async () => {
    const result = await lint(`
      const color = 'var(--slds-g-color-border-base-1)' as const;
      const base = {padding: '1rem'};
      const style = ({...base, color: color!, margin: \`var(--slds-g-spacing-4)\`} as const) satisfies React.CSSProperties;
      const View = () => <><div style={style!} /><span style={style} /><i style={{...base, border: 'var(--slds-g-color-border-base-2)'}} /></>;
    `);
    expect(messages(result)).toEqual([
      expect.objectContaining({line: 2}),
      expect.objectContaining({line: 4}),
      expect.objectContaining({line: 5}),
    ]);
  });

  it('skips mutations, escapes, alias chains, spread content, and dynamic values', async () => {
    const result = await lint(`
      const source = {color: 'var(--slds-g-spacing-4)'};
      const alias = source;
      alias.color = 'red';
      const escaped = {color: 'var(--slds-g-spacing-4)'};
      consume(escaped);
      const spreadOnly = {...{color: 'var(--slds-g-spacing-4)'}};
      const View = ({value}) => <><div style={source} /><div style={escaped} /><div style={spreadOnly} /><div style={{color: value}} /></>;
    `);
    expect(messages(result)).toHaveLength(0);
  });

  it('skips style objects passed through transparent TypeScript wrappers', async () => {
    const code = `
      const asCall = {color: 'var(--slds-g-spacing-4)'};
      consume(asCall as React.CSSProperties);
      const satisfiesCall = {color: 'var(--slds-g-spacing-4)'};
      consume(satisfiesCall satisfies React.CSSProperties);
      const nonNullCall = {color: 'var(--slds-g-spacing-4)'};
      consume(nonNullCall!);
      const asNew = {color: 'var(--slds-g-spacing-4)'};
      new Consumer(asNew as React.CSSProperties);
      const satisfiesNew = {color: 'var(--slds-g-spacing-4)'};
      new Consumer(satisfiesNew satisfies React.CSSProperties);
      const nonNullNew = {color: 'var(--slds-g-spacing-4)'};
      new Consumer(nonNullNew!);
      const View = () => <><div style={asCall} /><div style={satisfiesCall} /><div style={nonNullCall} />
        <div style={asNew} /><div style={satisfiesNew} /><div style={nonNullNew} /></>;
    `;
    expect(messages(await lint(code))).toHaveLength(0);
    const fixed = await lint(code, true);
    expect(messages(fixed)).toHaveLength(0);
    expect(fixed.output).toBeUndefined();
  });

  it('skips direct const aliases created through transparent TypeScript wrappers', async () => {
    const code = `
      const asMutated = {color: 'var(--slds-g-spacing-4)'};
      const asAlias = asMutated as React.CSSProperties;
      asAlias.color = 'red';
      const satisfiesMutated = {color: 'var(--slds-g-spacing-4)'};
      const satisfiesAlias = satisfiesMutated satisfies React.CSSProperties;
      satisfiesAlias.color = 'red';
      const nonNullMutated = {color: 'var(--slds-g-spacing-4)'};
      const nonNullAlias = nonNullMutated!;
      nonNullAlias.color = 'red';
      const asReturned = {color: 'var(--slds-g-spacing-4)'};
      const asReturnedAlias = asReturned as React.CSSProperties;
      function getAsAlias() { return asReturnedAlias; }
      const satisfiesReturned = {color: 'var(--slds-g-spacing-4)'};
      const satisfiesReturnedAlias = satisfiesReturned satisfies React.CSSProperties;
      function getSatisfiesAlias() { return satisfiesReturnedAlias; }
      const nonNullReturned = {color: 'var(--slds-g-spacing-4)'};
      const nonNullReturnedAlias = nonNullReturned!;
      function getNonNullAlias() { return nonNullReturnedAlias; }
      const View = () => <><div style={asMutated} /><div style={satisfiesMutated} /><div style={nonNullMutated} />
        <div style={asReturned} /><div style={satisfiesReturned} /><div style={nonNullReturned} /></>;
    `;
    expect(messages(await lint(code))).toHaveLength(0);
    const fixed = await lint(code, true);
    expect(messages(fixed)).toHaveLength(0);
    expect(fixed.output).toBeUndefined();
  });

  it('skips direct member mutations through transparent TypeScript wrappers', async () => {
    const code = `
      const assigned = {color: 'var(--slds-g-spacing-4)'};
      (assigned as React.CSSProperties).color = 'red';
      const deleted = {color: 'var(--slds-g-spacing-4)'};
      delete (deleted satisfies React.CSSProperties).color;
      const updated = {opacity: 'var(--slds-g-spacing-4)'};
      updated!.opacity++;
      const View = () => <><div style={assigned} /><div style={deleted} /><div style={updated} /></>;
    `;
    expect(messages(await lint(code))).toHaveLength(0);
    const fixed = await lint(code, true);
    expect(messages(fixed)).toHaveLength(0);
    expect(fixed.output).toBeUndefined();
  });

  it('checks only complete static interpolation fragments', async () => {
    const code = `const View = ({prefix, suffix, fallback}) => <div style={{
      color: \`var(--slds-g-spacing-4)\${suffix}\`,
      border: \`\${prefix}var(--slds-g-spacing-4)\`,
      margin: \`var(--slds-g-spacing-\${suffix}4)\`,
      padding: \`var(--slds-g-spacing-4, \${fallback})\`,
    }} />;`;
    const result = await lint(code);
    expect(messages(result)).toEqual([expect.objectContaining({line: 2})]);
    const fixed = await lint(code, true);
    expect(fixed.output).toContain('var(--slds-g-spacing-4, 1rem)\${suffix}');
    expect(fixed.output).toContain('\${prefix}var(--slds-g-spacing-4)');
  });

  it('accepts a dynamic fallback when the inline var name is static', async () => {
    const result = await lint(`const View = ({fallback}) => <div style={{color: \`var(--slds-g-spacing-4, \${fallback})\`}} />;`);
    expect(messages(result)).toHaveLength(0);
  });

  it('skips escaped interpolated templates whose raw and cooked text differ', async () => {
    const code = `const View = ({suffix}) => <div style={{color: \`var(--slds-g-spacing-4)\\n\${suffix}\`}} />;`;
    expect(messages(await lint(code))).toHaveLength(0);
    const fixed = await lint(code, true);
    expect(messages(fixed)).toHaveLength(0);
    expect(fixed.output).toBeUndefined();
  });

  it('skips const style objects that escape through returns and exports, including direct aliases', async () => {
    const result = await lint(`
      const direct = {color: 'var(--slds-g-spacing-4)'};
      function getDirect() { return direct; }
      const wrapped = {color: 'var(--slds-g-spacing-4)'};
      function getWrapped() { return (wrapped as const)!; }
      const concise = {color: 'var(--slds-g-spacing-4)'};
      const getConcise = () => concise;
      const named = {color: 'var(--slds-g-spacing-4)'};
      export {named};
      const aliasedNamed = {color: 'var(--slds-g-spacing-4)'};
      export {aliasedNamed as publicStyles};
      const defaulted = {color: 'var(--slds-g-spacing-4)'};
      export default defaulted;
      export const declared = {color: 'var(--slds-g-spacing-4)'};
      const source = {color: 'var(--slds-g-spacing-4)'};
      const alias = source;
      function getAlias() { return alias; }
      const unrelated = {color: 'var(--slds-g-spacing-4)'};
      function other() { return 'unrelated'; }
      const local = {color: 'var(--slds-g-spacing-4)'};
      const View = () => <><div style={direct} /><div style={wrapped} /><div style={concise} />
        <div style={named} /><div style={aliasedNamed} /><div style={defaulted} />
        <div style={declared} /><div style={source} /><div style={unrelated} /><div style={local} /></>;
    `);
    expect(messages(result)).toEqual([
      expect.objectContaining({line: 18}),
      expect.objectContaining({line: 20}),
    ]);
  });

  it('applies the same value-only policy to styled declarations and interpolation', async () => {
    const code = `
      import styled, {styled as namedStyled} from 'styled-components';
      const One = styled.div\`--slds-g-spacing-4: 1rem; color: var(--slds-g-spacing-4); border: var(--slds-g-spacing-4, \${fallback});\`;
      const Two = namedStyled('div')\`margin: var(--slds-g-color-border-base-1)\${tail};\`;
    `;
    const result = await lint(code);
    expect(messages(result)).toEqual([
      expect.objectContaining({line: 3, column: 67, endColumn: 85}),
      expect.objectContaining({line: 4, column: 50, endColumn: 78}),
    ]);
  });

  it('uses numeric and string metadata fallbacks verbatim like the CSS rule', async () => {
    const code = `const View = () => <div style={{
      aspectRatio: 'var(--slds-g-ratio-square)',
      boxShadow: 'var(--slds-g-shadow-3)',
    }} />;`;
    const result = await lint(code);
    expect(messages(result)).toEqual([
      expect.objectContaining({line: 2, message: expect.stringContaining('var(--slds-g-ratio-square, 1)')}),
      expect.objectContaining({line: 3, message: expect.stringContaining('0px 2px 4px 0px #00000027;')}),
    ]);
    expect(messages(result).every(message => message.fix != null)).toBe(true);
    expect(messages(result).every(message => message.suggestions == null)).toBe(true);

    const fixed = await lint(code, true);
    expect(fixed.output).toContain("aspectRatio: 'var(--slds-g-ratio-square, 1)'");
    expect(fixed.output).toContain("boxShadow: 'var(--slds-g-shadow-3, 0px 2px 4px 0px #00000027;)'");
    expect(messages(fixed)).toHaveLength(0);
  });

  it('preserves nested fixes across overlapping multipass migrations', async () => {
    const code = `const View = () => <div style={{color: 'var(--sds-g-color-border-base-1, var(--slds-g-spacing-4))', background: 'var(--lwc-brandDark)'}} />;`;
    const fixed = await lint(code, true);
    expect(fixed.output).toContain('var(--slds-g-color-border-base-1, var(--slds-g-spacing-4, 1rem))');
    expect(fixed.output).toContain('var(--slds-g-color-accent-dark-1, var(--lwc-brandDark))');
    expect(messages(fixed)).toHaveLength(0);
  });
});
