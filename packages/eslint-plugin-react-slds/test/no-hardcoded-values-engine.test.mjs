import {analyzeHardcodedValue} from '../src/utils/no-hardcoded-values/engine.ts';

const customMapping = (hook, properties, values) => ({
  [hook]: {properties, values},
});

describe('React-local no-hardcoded-values analysis engine', () => {
  it('preserves exact color candidate ordering and reports without a fix when ambiguous', () => {
    expect(analyzeHardcodedValue({property: 'color', value: '#001639', sourceStart: 20})).toEqual([
      {
        range: [20, 27],
        messageId: 'hardcodedValue',
        data: {
          oldValue: '#001639',
          newValue: '\n1. --slds-g-color-accent-dark-2\n2. --slds-g-color-on-surface-3\n3. --slds-g-color-accent-dark-1\n4. --slds-g-color-accent-3\n5. --slds-g-color-accent-2',
          usageContext: '',
        },
        replacement: null,
      },
    ]);
  });

  it('preserves alpha in a color-mix fallback', () => {
    expect(analyzeHardcodedValue({
      property: 'color',
      value: 'rgba(181, 54, 45, 0.7)',
      options: {customMapping: customMapping('--custom-red', ['color'], ['rgba(181,54,45,0.7)'])},
    })).toEqual([
      expect.objectContaining({
        range: [0, 22],
        replacement: 'color-mix(in oklab, var(--custom-red, rgba(181,54,45,0.7)), transparent 30%)',
      }),
    ]);
  });

  it('preserves density and font semantics plus reportNumericValue modes', () => {
    expect(analyzeHardcodedValue({property: 'padding', value: '0.25rem'})).toEqual([
      expect.objectContaining({replacement: 'var(--slds-g-spacing-1, 0.25rem)'}),
    ]);
    expect(analyzeHardcodedValue({property: 'font-weight', value: 'normal'})).toEqual([
      expect.objectContaining({replacement: 'var(--slds-g-font-weight-4, 400)'}),
    ]);
    expect(analyzeHardcodedValue({
      property: 'line-height', value: '2.5', options: {reportNumericValue: 'hasReplacement'},
    })).toEqual([]);
    expect(analyzeHardcodedValue({
      property: 'padding', value: '0.25rem', options: {reportNumericValue: 'never'},
    })).toEqual([]);
  });

  it('uses first matching custom mapping before metadata and supports property wildcards', () => {
    expect(analyzeHardcodedValue({
      property: 'background-color',
      value: '#001639',
      options: {customMapping: {
        ...customMapping('--first', ['background*'], ['#001639']),
        ...customMapping('--second', ['background-color'], ['#001639']),
      }},
    })).toEqual([
      expect.objectContaining({
        data: expect.objectContaining({newValue: '--first'}),
        replacement: 'var(--first, #001639)',
      }),
    ]);
  });

  it('runs both color and density routes for outline in foundation order', () => {
    const findings = analyzeHardcodedValue({property: 'outline', value: '1px solid #001639'});
    expect(findings.map(({range, messageId}) => ({range, messageId}))).toEqual([
      {range: [10, 17], messageId: 'hardcodedValue'},
      {range: [0, 3], messageId: 'hardcodedValue'},
    ]);
  });

  it('reports shorthand values in reverse source order with multipass-compatible replacements', () => {
    const findings = analyzeHardcodedValue({property: 'padding', value: '0.25rem 0.5rem', sourceStart: 100});
    expect(findings.map(({range, replacement}) => ({range, replacement}))).toEqual([
      {range: [108, 114], replacement: 'var(--slds-g-spacing-2, 0.5rem)'},
      {range: [100, 107], replacement: 'var(--slds-g-spacing-1, 0.25rem)'},
    ]);
  });

  it('resolves candidate context from its exact absolute multiline location', () => {
    const calls = [];
    const locations = [{line: 8, column: 2}, {line: 9, column: 4}];
    analyzeHardcodedValue({
      property: 'color',
      value: 'red\n#001639',
      sourceStart: 100,
      source: {
        filename: 'component.tsx',
        line: 8,
        column: 2,
        locationAt: offset => locations[offset === 0 ? 0 : 1],
      },
      settings: {
        contextIndex: {getIssue: (...args) => { calls.push(args); return null; }},
      },
    });

    expect(calls).toEqual([
      ['component.tsx', 8, 2],
      ['component.tsx', 9, 4],
    ]);
  });

  it('ignores malformed context settings and falls back to metadata suggestions', () => {
    expect(analyzeHardcodedValue({
      property: 'color',
      value: '#001639',
      source: {filename: 'component.tsx', line: 1, column: 1},
      settings: {
        contextIndex: {},
        classifyIssue: 'invalid',
        serializeIssueContext: 'invalid',
      },
    })).toEqual([expect.objectContaining({messageId: 'hardcodedValue'})]);
  });

  it('retains only candidate replacement tokens for large multi-color declarations', () => {
    const value = Array.from({length: 1000}, () => '#001639').join(' ');
    const findings = analyzeHardcodedValue({
      property: 'color',
      value,
      options: {customMapping: customMapping('--stress-color', ['color'], ['#001639'])},
    });

    expect(findings).toHaveLength(1000);
    expect(findings.every(finding => finding.replacement === 'var(--stress-color, #001639)')).toBe(true);
    expect(findings.reduce((total, finding) => total + (finding.replacement?.length || 0), 0))
      .toBeLessThan(value.length * 5);
  });

  it('matches box shadows as whole values and ignores unmatched shadows', () => {
    const options = {
      customMapping: customMapping('--custom-shadow', ['box-shadow'], ['0 2px 4px rgba(0,0,0,0.1)']),
    };
    expect(analyzeHardcodedValue({
      property: 'box-shadow', value: '0 2px 4px rgba(0,0,0,0.1)', options,
    })).toEqual([
      expect.objectContaining({
        range: [0, 25],
        replacement: 'var(--custom-shadow, 0 2px 4px rgba(0,0,0,0.1))',
      }),
    ]);
    expect(analyzeHardcodedValue({property: 'box-shadow', value: '2px 2px 4px red'})).toEqual([]);
  });

  it('preserves context classification, settings precedence, message data, and fix eligibility', () => {
    const issue = {kind: 'color'};
    const base = {
      property: 'background-color',
      value: '#001639',
      sourceStart: 10,
      source: {filename: 'component.tsx', line: 4, column: 8},
      options: {deterministicOnly: false},
      settings: {
        deterministicOnly: true,
        contextIndex: {getIssue: (...args) => args.join(':') === 'component.tsx:4:8' ? issue : null},
        classifyIssue: () => ({
          tier: 'semi-deterministic',
          selectedHook: '--selected',
          matchingHooks: ['--selected', '--alternate'],
        }),
        serializeIssueContext: () => 'Used as a surface',
      },
    };
    expect(analyzeHardcodedValue(base)).toEqual([
      {
        range: [10, 17],
        messageId: 'hardcodedValue',
        data: {
          oldValue: '#001639',
          newValue: '\n1. --selected\n2. --alternate',
          usageContext: 'Used as a surface. ',
        },
        replacement: null,
      },
    ]);
  });
});
