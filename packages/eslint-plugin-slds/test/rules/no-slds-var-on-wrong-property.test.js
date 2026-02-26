const rule = require('../../src/rules/v9/no-slds-var-on-wrong-property').default;
const { RuleTester } = require('eslint');

let cssPlugin;
try {
  cssPlugin = require('@eslint/css').default || require('@eslint/css');
} catch (e) {
  cssPlugin = require('@eslint/css');
}

const ruleTester = new RuleTester({
  plugins: { css: cssPlugin },
  language: 'css/css',
});

// ---------------------------------------------------------------------------
// Helpers — real hook names from globalStylingHooks.metadata.json
// ---------------------------------------------------------------------------
// color hooks    → ['background-color', 'color', 'border-color', 'fill']
const COLOR_HOOK = '--slds-g-color-palette-blue-10';

// spacing hooks  → ['padding', 'margin', 'top', 'right', 'bottom', 'left']
const SPACING_HOOK = '--slds-g-spacing-1';

// font-family    → ['font-family']
const FONT_FAMILY_HOOK = '--slds-g-font-family';

// font-weight    → ['font-weight']
const FONT_WEIGHT_HOOK = '--slds-g-font-weight-bold';

// font-size      → ['font-size']
const FONT_SIZE_HOOK = '--slds-g-font-size-base';

// box-shadow     → ['box-shadow']
const SHADOW_HOOK = '--slds-g-shadow-1';

// border-radius  → ['border-radius']
const RADIUS_HOOK = '--slds-g-radius-border-1';

// sizing (border-width, width) → ['border-width', 'width']
const SIZING_HOOK = '--slds-g-sizing-border-1';

// duration — wildcard properties ['animation*', 'transition*']
const DURATION_HOOK = '--slds-c-duration-instantly';

// shared hook with empty properties array — validation must be skipped
const SHARED_HOOK_NO_PROPS = '--slds-s-table-color';

ruleTester.run('no-slds-var-on-wrong-property', rule, {
  // ==========================================================================
  // VALID — correct property usage
  // ==========================================================================
  valid: [
    // ---- color hooks on colour-bearing properties -------------------------
    {
      code: `.x { color: var(${COLOR_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { background-color: var(${COLOR_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { border-color: var(${COLOR_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { fill: var(${COLOR_HOOK}); }`,
      filename: 'test.css',
    },

    // ---- color hook on `background` shorthand (maps to background-color) --
    {
      code: `.x { background: var(${COLOR_HOOK}); }`,
      filename: 'test.css',
    },

    // ---- color/sizing/radius hooks on `border` shorthand ------------------
    // `border` expands to [border-color, border-width, border-radius]
    {
      code: `.x { border: var(${COLOR_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { border: var(${SIZING_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { border: var(${RADIUS_HOOK}); }`,
      filename: 'test.css',
    },

    // ---- font hooks on `font` shorthand -----------------------------------
    // `font` expands to [font-family, font-size, font-weight]
    {
      code: `.x { font: var(${FONT_FAMILY_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { font: var(${FONT_SIZE_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { font: var(${FONT_WEIGHT_HOOK}); }`,
      filename: 'test.css',
    },

    // ---- spacing hooks on layout properties --------------------------------
    {
      code: `.x { padding: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { margin: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { top: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { right: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { bottom: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { left: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
    },

    // ---- font hooks on their designated properties -------------------------
    {
      code: `.x { font-family: var(${FONT_FAMILY_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { font-weight: var(${FONT_WEIGHT_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { font-size: var(${FONT_SIZE_HOOK}); }`,
      filename: 'test.css',
    },

    // ---- shadow/radius/sizing hooks ----------------------------------------
    {
      code: `.x { box-shadow: var(${SHADOW_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { border-radius: var(${RADIUS_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { border-width: var(${SIZING_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { width: var(${SIZING_HOOK}); }`,
      filename: 'test.css',
    },

    // ---- duration hook on wildcard-matched properties ----------------------
    {
      code: `.x { animation-duration: var(${DURATION_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { animation-name: var(${DURATION_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { transition-duration: var(${DURATION_HOOK}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { transition-property: var(${DURATION_HOOK}); }`,
      filename: 'test.css',
    },
    // `animation` shorthand maps to `animation*` wildcard
    {
      code: `.x { animation: var(${DURATION_HOOK}); }`,
      filename: 'test.css',
    },
    // `transition` shorthand maps to `transition*` wildcard
    {
      code: `.x { transition: var(${DURATION_HOOK}); }`,
      filename: 'test.css',
    },

    // ---- hooks with empty properties array — must be silently skipped ------
    {
      code: `.x { color: var(${SHARED_HOOK_NO_PROPS}); }`,
      filename: 'test.css',
    },
    {
      code: `.x { background-color: var(${SHARED_HOOK_NO_PROPS}); }`,
      filename: 'test.css',
    },

    // ---- custom / unknown hooks — not in metadata, always ignored ----------
    {
      code: `.x { color: var(--slds-custom-brand-color); }`,
      filename: 'test.css',
    },
    {
      code: `.x { padding: var(--slds-my-spacing); }`,
      filename: 'test.css',
    },

    // ---- non-SLDS variables — ignored entirely ----------------------------
    {
      code: `.x { color: var(--lwc-brandColor); }`,
      filename: 'test.css',
    },
    {
      code: `.x { padding: var(--custom-spacing); }`,
      filename: 'test.css',
    },

    // ---- SLDS hook with correct property and a fallback value --------------
    {
      code: `.x { color: var(${COLOR_HOOK}, #000); }`,
      filename: 'test.css',
    },

    // ---- hook used inside calc() on a valid property ----------------------
    {
      code: `.x { padding: calc(var(${SPACING_HOOK}) * 2); }`,
      filename: 'test.css',
    },
  ],

  // ==========================================================================
  // INVALID — hook applied to wrong CSS property
  // ==========================================================================
  invalid: [
    // ---- spacing hook on a colour property ---------------------------------
    {
      code: `.x { color: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: SPACING_HOOK,
          property: 'color',
          allowedProperties: 'padding, margin, top, right, bottom, left',
        },
      }],
    },
    {
      code: `.x { background-color: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: SPACING_HOOK,
          property: 'background-color',
          allowedProperties: 'padding, margin, top, right, bottom, left',
        },
      }],
    },

    // ---- color hook on a layout property -----------------------------------
    {
      code: `.x { padding: var(${COLOR_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: COLOR_HOOK,
          property: 'padding',
          allowedProperties: 'background-color, color, border-color, fill',
        },
      }],
    },
    {
      code: `.x { margin: var(${COLOR_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: COLOR_HOOK,
          property: 'margin',
          allowedProperties: 'background-color, color, border-color, fill',
        },
      }],
    },
    {
      code: `.x { font-size: var(${COLOR_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: COLOR_HOOK,
          property: 'font-size',
          allowedProperties: 'background-color, color, border-color, fill',
        },
      }],
    },

    // ---- font hooks on wrong properties -----------------------------------
    {
      code: `.x { color: var(${FONT_FAMILY_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: FONT_FAMILY_HOOK,
          property: 'color',
          allowedProperties: 'font-family',
        },
      }],
    },
    {
      code: `.x { padding: var(${FONT_SIZE_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: FONT_SIZE_HOOK,
          property: 'padding',
          allowedProperties: 'font-size',
        },
      }],
    },
    {
      code: `.x { color: var(${FONT_WEIGHT_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: FONT_WEIGHT_HOOK,
          property: 'color',
          allowedProperties: 'font-weight',
        },
      }],
    },

    // ---- shadow hook on wrong property ------------------------------------
    {
      code: `.x { color: var(${SHADOW_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: SHADOW_HOOK,
          property: 'color',
          allowedProperties: 'box-shadow',
        },
      }],
    },

    // ---- radius hook on wrong property ------------------------------------
    {
      code: `.x { color: var(${RADIUS_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: RADIUS_HOOK,
          property: 'color',
          allowedProperties: 'border-radius',
        },
      }],
    },

    // ---- sizing hook on wrong property ------------------------------------
    {
      code: `.x { color: var(${SIZING_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: SIZING_HOOK,
          property: 'color',
          allowedProperties: 'border-width, width',
        },
      }],
    },

    // ---- duration hook on a non-animation/transition property -------------
    {
      code: `.x { color: var(${DURATION_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: DURATION_HOOK,
          property: 'color',
          allowedProperties: 'animation*, transition*',
        },
      }],
    },
    {
      code: `.x { padding: var(${DURATION_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: DURATION_HOOK,
          property: 'padding',
          allowedProperties: 'animation*, transition*',
        },
      }],
    },

    // ---- multiple violations in the same rule block ------------------------
    {
      code: `.x {
        color: var(${SPACING_HOOK});
        padding: var(${COLOR_HOOK});
      }`,
      filename: 'test.css',
      errors: [
        {
          messageId: 'wrongProperty',
          type: 'Declaration',
          data: {
            cssVar: SPACING_HOOK,
            property: 'color',
            allowedProperties: 'padding, margin, top, right, bottom, left',
          },
        },
        {
          messageId: 'wrongProperty',
          type: 'Declaration',
          data: {
            cssVar: COLOR_HOOK,
            property: 'padding',
            allowedProperties: 'background-color, color, border-color, fill',
          },
        },
      ],
    },

    // ---- violation still reported when there is an explicit fallback -------
    {
      code: `.x { font-size: var(${SPACING_HOOK}, 1rem); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: SPACING_HOOK,
          property: 'font-size',
          allowedProperties: 'padding, margin, top, right, bottom, left',
        },
      }],
    },

    // ---- violation inside a complex selector ------------------------------
    {
      code: `.container .child:hover { color: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: SPACING_HOOK,
          property: 'color',
          allowedProperties: 'padding, margin, top, right, bottom, left',
        },
      }],
    },

    // ---- spacing hook on box-shadow (not a layout property) ---------------
    {
      code: `.x { box-shadow: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: SPACING_HOOK,
          property: 'box-shadow',
          allowedProperties: 'padding, margin, top, right, bottom, left',
        },
      }],
    },

    // ---- shorthand `background` with a non-color hook — still invalid -----
    // Shorthand expansion does not bypass type enforcement; `background` only
    // maps to `background-color`, not to spacing/font/shadow/etc.
    {
      code: `.x { background: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: SPACING_HOOK,
          property: 'background',
          allowedProperties: 'padding, margin, top, right, bottom, left',
        },
      }],
    },
    {
      code: `.x { background: var(${FONT_SIZE_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: FONT_SIZE_HOOK,
          property: 'background',
          allowedProperties: 'font-size',
        },
      }],
    },

    // ---- shorthand `border` with a non-border hook — still invalid --------
    {
      code: `.x { border: var(${SPACING_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: SPACING_HOOK,
          property: 'border',
          allowedProperties: 'padding, margin, top, right, bottom, left',
        },
      }],
    },

    // ---- shorthand `font` with a non-font hook — still invalid ------------
    {
      code: `.x { font: var(${COLOR_HOOK}); }`,
      filename: 'test.css',
      errors: [{
        messageId: 'wrongProperty',
        type: 'Declaration',
        data: {
          cssVar: COLOR_HOOK,
          property: 'font',
          allowedProperties: 'background-color, color, border-color, fill',
        },
      }],
    },
  ],
});
