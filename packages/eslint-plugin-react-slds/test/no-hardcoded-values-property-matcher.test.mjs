import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const reactMatcherUrl = new URL('../src/utils/no-hardcoded-values/property-matcher.ts', import.meta.url);

describe('React-local property matcher parity with foundation', () => {
  it('provides the foundation-named local property matcher module', () => {
    expect(existsSync(fileURLToPath(reactMatcherUrl))).toBe(true);
  });

  it('matches foundation property resolvers across representative properties', async () => {
    if (!existsSync(fileURLToPath(reactMatcherUrl))) return;

    const reactMatcher = await import(reactMatcherUrl.href);
    const foundationMatcher = await import('../../eslint-plugin-slds/src/utils/property-matcher.ts');
    const properties = [
      'outline', 'outline-width', 'border', 'border-inline-start-width',
      'margin-block-end', 'padding-inline', 'border-start-end-radius',
      'height', 'max-width', 'inset-block-end', 'top', 'line-height',
      'background', 'background-color', 'border-left-color', 'fill', 'stroke',
    ];

    for (const property of properties) {
      expect(reactMatcher.resolveDensityPropertyToMatch(property)).toBe(
        foundationMatcher.resolveDensityPropertyToMatch(property),
      );
      expect(reactMatcher.resolveColorPropertyToMatch(property)).toBe(
        foundationMatcher.resolveColorPropertyToMatch(property),
      );
    }
  });

  it('matches foundation wildcard property routing', async () => {
    if (!existsSync(fileURLToPath(reactMatcherUrl))) return;

    const reactMatcher = await import(reactMatcherUrl.href);
    const foundationMatcher = await import('../../eslint-plugin-slds/src/utils/property-matcher.ts');
    const cases = [
      ['border-left-color', reactMatcher.colorProperties],
      ['border-inline-start-width', reactMatcher.densificationProperties],
      ['font-weight', reactMatcher.fontProperties],
      ['--custom-border-color', reactMatcher.colorProperties],
    ];

    for (const [property, patterns] of cases) {
      const foundationPatterns = patterns === reactMatcher.colorProperties
        ? foundationMatcher.colorProperties
        : patterns === reactMatcher.densificationProperties
          ? foundationMatcher.densificationProperties
          : foundationMatcher.fontProperties;
      expect(reactMatcher.matchesCssProperty(patterns, property)).toBe(
        foundationMatcher.matchesCssProperty(foundationPatterns, property),
      );
    }
  });
});
