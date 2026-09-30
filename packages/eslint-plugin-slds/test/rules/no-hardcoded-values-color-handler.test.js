const rule = require('../../src/rules/v9/no-hardcoded-values/no-hardcoded-values-slds2').default;
const { RuleTester } = require('eslint');

let cssPlugin;
try {
  cssPlugin = require('@eslint/css').default || require('@eslint/css');
} catch (e) {
  cssPlugin = require('@eslint/css');
}

const ruleTester = new RuleTester({
  plugins: {
    css: cssPlugin,
  },
  language: 'css/css',
});

ruleTester.run('no-hardcoded-values-slds2 (colorHandler context & deterministicOnly)', rule, {
  valid: [],
  invalid: [
    // Context extraction: deterministic classification auto-fixes with selectedHook
    {
      code: `.example { color: #ffffff; }`,
      filename: 'test.css',
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: '#ffffff' }; }
        },
        classifyIssue() {
          return {
            tier: 'deterministic',
            selectedHook: '--slds-g-color-neutral-base-100',
            matchingHooks: ['--slds-g-color-neutral-base-100']
          };
        },
        serializeIssueContext() { return 'Used as text on dark background'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { color: var(--slds-g-color-neutral-base-100, #ffffff); }`
    },

    // Default (deterministicOnly omitted) — semi-deterministic tier produces autofix
    {
      code: `.example { background-color: #ffffff; }`,
      filename: 'test.css',
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: '#ffffff' }; }
        },
        classifyIssue() {
          return {
            tier: 'semi-deterministic',
            selectedHook: '--slds-g-color-surface-1',
            matchingHooks: ['--slds-g-color-surface-1', '--slds-g-color-surface-2']
          };
        },
        serializeIssueContext() { return 'Used as container background'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { background-color: var(--slds-g-color-surface-1, #ffffff); }`
    },

    // deterministicOnly: false (explicit) — semi-deterministic tier produces autofix
    {
      code: `.example { background-color: #ffffff; }`,
      filename: 'test.css',
      options: [{
        deterministicOnly: false
      }],
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: '#ffffff' }; }
        },
        classifyIssue() {
          return {
            tier: 'semi-deterministic',
            selectedHook: '--slds-g-color-surface-1',
            matchingHooks: ['--slds-g-color-surface-1', '--slds-g-color-surface-2']
          };
        },
        serializeIssueContext() { return 'Used as container background'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { background-color: var(--slds-g-color-surface-1, #ffffff); }`
    },

    // deterministicOnly: true — semi-deterministic becomes suggestion-only (no autofix)
    {
      code: `.example { background-color: #ffffff; }`,
      filename: 'test.css',
      options: [{
        deterministicOnly: true
      }],
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: '#ffffff' }; }
        },
        classifyIssue() {
          return {
            tier: 'semi-deterministic',
            selectedHook: '--slds-g-color-surface-1',
            matchingHooks: ['--slds-g-color-surface-1', '--slds-g-color-surface-2']
          };
        },
        serializeIssueContext() { return 'Used as container background'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }]
    },

    // deterministicOnly: true — deterministic tier still auto-fixes
    {
      code: `.example { color: #ffffff; }`,
      filename: 'test.css',
      options: [{
        deterministicOnly: true
      }],
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: '#ffffff' }; }
        },
        classifyIssue() {
          return {
            tier: 'deterministic',
            selectedHook: '--slds-g-color-neutral-base-100',
            matchingHooks: ['--slds-g-color-neutral-base-100']
          };
        },
        serializeIssueContext() { return 'Used as text on dark background'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { color: var(--slds-g-color-neutral-base-100, #ffffff); }`
    },

    // CLI settings override: settings.deterministicOnly takes precedence over rule option
    {
      code: `.example { background-color: #ffffff; }`,
      filename: 'test.css',
      options: [{
        deterministicOnly: false
      }],
      settings: {
        deterministicOnly: true,
        contextIndex: {
          getIssue() { return { type: 'color', value: '#ffffff' }; }
        },
        classifyIssue() {
          return {
            tier: 'semi-deterministic',
            selectedHook: '--slds-g-color-surface-1',
            matchingHooks: ['--slds-g-color-surface-1', '--slds-g-color-surface-2']
          };
        },
        serializeIssueContext() { return 'Used as container background'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }]
    },

    // Context extraction: contextIndex exists but getIssue returns null (no match)
    {
      code: `.example { color: #ff0000; }`,
      filename: 'test.css',
      settings: {
        contextIndex: {
          getIssue() { return null; }
        },
        classifyIssue() { return null; },
        serializeIssueContext() { return ''; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }]
    },

    // Context extraction: non-deterministic tier falls through to normal hook matching
    {
      code: `.example { color: #ff0000; }`,
      filename: 'test.css',
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: '#ff0000' }; }
        },
        classifyIssue() {
          return { tier: 'ambiguous' };
        },
        serializeIssueContext() { return 'Ambiguous context'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }]
    },

    // Context extraction: deterministic with no selectedHook but has matchingHooks
    {
      code: `.example { border-color: #ffffff; }`,
      filename: 'test.css',
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: '#ffffff' }; }
        },
        classifyIssue() {
          return {
            tier: 'deterministic',
            selectedHook: null,
            matchingHooks: ['--slds-g-color-border-base-1', '--slds-g-color-border-base-2']
          };
        },
        serializeIssueContext() { return 'Used as border'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }]
    },

    // Alpha channel: deterministic classification wraps in color-mix()
    {
      code: `.example { color: rgba(181, 54, 45, 0.7); }`,
      filename: 'test.css',
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: 'rgba(181, 54, 45, 0.7)' }; }
        },
        classifyIssue() {
          return {
            tier: 'deterministic',
            selectedHook: '--slds-g-color-palette-red-40',
            matchingHooks: ['--slds-g-color-palette-red-40']
          };
        },
        serializeIssueContext() { return 'Used as error text with transparency'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { color: color-mix(in oklab, var(--slds-g-color-palette-red-40, rgba(181,54,45,0.7)), transparent 30%); }`
    },

    // Alpha channel: semi-deterministic with deterministicOnly omitted (default allows auto-fix)
    {
      code: `.example { background-color: rgba(0, 0, 0, 0.5); }`,
      filename: 'test.css',
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: 'rgba(0, 0, 0, 0.5)' }; }
        },
        classifyIssue() {
          return {
            tier: 'semi-deterministic',
            selectedHook: '--slds-g-color-neutral-base-1',
            matchingHooks: ['--slds-g-color-neutral-base-1']
          };
        },
        serializeIssueContext() { return 'Used as overlay background'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { background-color: color-mix(in oklab, var(--slds-g-color-neutral-base-1, rgba(0,0,0,0.5)), transparent 50%); }`
    },

    // Alpha channel: deterministicOnly true blocks semi-deterministic context-based fix,
    // but single-hook fallback still auto-fixes with color-mix()
    {
      code: `.example { background-color: rgba(0, 0, 0, 0.5); }`,
      filename: 'test.css',
      options: [{
        deterministicOnly: true
      }],
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: 'rgba(0, 0, 0, 0.5)' }; }
        },
        classifyIssue() {
          return {
            tier: 'semi-deterministic',
            selectedHook: '--slds-g-color-neutral-base-1',
            matchingHooks: ['--slds-g-color-neutral-base-1']
          };
        },
        serializeIssueContext() { return 'Used as overlay background'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { background-color: color-mix(in oklab, var(--slds-g-color-neutral-base-1, rgba(0,0,0,0.5)), transparent 50%); }`
    },

    // Alpha channel: deterministicOnly true with multiple hooks prevents auto-fix
    {
      code: `.example { background-color: rgba(0, 0, 0, 0.5); }`,
      filename: 'test.css',
      options: [{
        deterministicOnly: true
      }],
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: 'rgba(0, 0, 0, 0.5)' }; }
        },
        classifyIssue() {
          return {
            tier: 'semi-deterministic',
            selectedHook: '--slds-g-color-neutral-base-1',
            matchingHooks: ['--slds-g-color-neutral-base-1', '--slds-g-color-neutral-base-2']
          };
        },
        serializeIssueContext() { return 'Used as overlay background'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }]
    },

    // Alpha channel: hsla color with deterministic classification wraps in color-mix()
    {
      code: `.example { color: hsla(240, 75%, 60%, 0.9); }`,
      filename: 'test.css',
      settings: {
        contextIndex: {
          getIssue() { return { type: 'color', value: 'hsla(240, 75%, 60%, 0.9)' }; }
        },
        classifyIssue() {
          return {
            tier: 'deterministic',
            selectedHook: '--slds-g-color-brand-base-50',
            matchingHooks: ['--slds-g-color-brand-base-50']
          };
        },
        serializeIssueContext() { return 'Used as branded text'; }
      },
      errors: [{
        messageId: 'hardcodedValue'
      }],
      output: `.example { color: color-mix(in oklab, var(--slds-g-color-brand-base-50, hsla(240,75%,60%,0.9)), transparent 10%); }`
    },
  ]
});
