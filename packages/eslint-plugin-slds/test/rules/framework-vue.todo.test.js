/**
 * Up-front TDD specification for Vue Single File Component (.vue) support.
 *
 * Vue support is DESIGNED but DEFERRED. These tests encode the expected
 * behavior so implementation can proceed test-first. They are declared with
 * `it.todo` (pending) so they neither pass nor fail today.
 *
 * Implementation notes (for when this is picked up):
 *  - Parse `.vue` with `vue-eslint-parser` (adds `<template>` AST + `<script>`).
 *  - `<template>` surfaces:
 *      - static `class="slds-..."`            -> class-checks (deprecated/BEM/override)
 *      - dynamic `:class="{ 'slds-x': cond }"` -> object keys + string/array exprs
 *      - inline `:style="{ color: '...' }"`    -> style-value-checks (hooks/hardcoded)
 *  - `<style>` / `<style scoped>` blocks are plain CSS/SCSS and should reuse the
 *    existing `@eslint/css` rule paths (already covered by the CSS rules).
 *  - CSS Modules (`$style.foo`) carry no SLDS artifact -> no-op.
 */

describe('Vue (.vue) SLDS support [deferred]', () => {
  describe('<template> class binding', () => {
    it.todo('flags deprecated class in static class="slds-action-overflow--touch"');
    it.todo('flags retired BEM class in static class and offers single-underscore fix');
    it.todo("flags deprecated class in :class=\"{ 'slds-action-overflow--touch': cond }\"");
    it.todo(':class="[a, \'slds-...\']" array syntax checks string members');
    it.todo('ignores custom (non-slds) classes in class and :class');
  });

  describe('<template> :style binding', () => {
    it.todo("flags var(--lwc-brandDark) in :style=\"{ color: 'var(--lwc-brandDark)' }\" and fixes to --slds hook");
    it.todo("flags --lwc-* custom property key in :style object");
    it.todo("flags hardcoded color in :style=\"{ color: '#ff0000' }\"");
    it.todo('flags --slds var without fallback and adds metadata fallback');
    it.todo('flags reserved --slds- namespace for custom hooks');
    it.todo('rewrites --_slds- private var to --slds-');
  });

  describe('<style> block', () => {
    it.todo('reuses existing @eslint/css rules for <style> and <style scoped> (parity with .css)');
  });

  describe('CSS Modules', () => {
    it.todo('treats $style.foo member refs as no-op (no SLDS artifact)');
  });
});
